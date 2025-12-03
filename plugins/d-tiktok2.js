const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch');

// --- API Endpoints ---
const DOWNLOAD_API = `https://api.siputzx.my.id/api/tiktok/v2?url=`;

// Global State Cache for Interactive Steps
const searchCache = new Map();

// Helper function to handle fetch and error reporting
async function fetchTikTokData(url) {
    try {
        const encodedURL = encodeURIComponent(url);
        const apiUrl = `${DOWNLOAD_API}${encodedURL}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });
        
        if (!data.success || !data.data) {
            throw new Error(data.message || "API se TikTok data lene mein vifal rahe.");
        }
        return data.data;
    } catch (err) {
        console.error("TikTok Fetch Error:", err.message);
        throw new Error("❌ TikTok data lene mein truti aayi.");
    }
}

cmd({
    pattern: "tt",
    alias: ["tiktok", "tiktokdl"],
    desc: "TikTok link se video ya photo slide download karta hai.", // Downloads video or photo slides from TikTok link.
    category: "download",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q || !/tiktok\.com/.test(q)) {
            return reply(`❌ Kripya sahi TikTok link dein!\n\n*Udaharan:* ${prefix + command} [TikTok Link]`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply("⏳ TikTok data lene mein thoda waqt lag sakta hai, kripya intezaar karein...");

        const data = await fetchTikTokData(q);
        const { metadata, download } = data;
        
        // Determine content type
        const isVideo = Array.isArray(download.video) && download.video.length > 0;
        const isPhoto = Array.isArray(download.photo) && download.photo.length > 0;
        
        let downloadLinks = [];
        let contentType = 'Unknown';
        
        if (isVideo) {
            downloadLinks = download.video;
            contentType = 'Video';
        } else if (isPhoto) {
            downloadLinks = download.photo;
            contentType = 'Photo Slide';
        } else {
            return reply("❌ Is link par na video mila aur na photo slide.");
        }

        const info = `
*🎬 TIKTOK DOWNLOADER*

📌 *Description:* ${metadata.description || 'N/A'}
❤️ *Likes:* ${metadata.stats.likeCount}
💬 *Comments:* ${metadata.stats.commentCount}
🔗 *Link:* ${q}

*Content:* ${contentType}
`;

        // Store links for the next step (Audio option added)
        const currentLinks = {
            video: downloadLinks[0] || null, // Best video link
            photo: isPhoto ? downloadLinks : null,
            audio: download.musicUrl || download.audio || null,
            isPhoto: isPhoto
        };
        
        const options = `
*Kripya format select karein:*
1 - Download ${contentType} ⬇️
2 - Download Audio (MP3) 🎵

*Kripya 1 ya 2 se reply karein.*
`;

        // Store the result temporarily
        const cacheKey = `${from}-${mek.key.id}`;
        searchCache.set(cacheKey, currentLinks);

        // Send confirmation and options
        const sentMenuMsg = await conn.sendMessage(from, {
            text: info + options
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // --- LISTEN FOR SELECTION ---
        const selectionHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToMenu = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentMenuMsg.key.id;
            if (!repliedToMenu) return;

            const selection = msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim();
            const cachedData = searchCache.get(cacheKey);

            if (cachedData && (selection === '1' || selection === '2')) {
                conn.ev.off("messages.upsert", selectionHandler);
                searchCache.delete(cacheKey);

                await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
                
                const isAudio = selection === '2';
                let finalUrl = isAudio ? cachedData.audio : cachedData.video;
                
                if (!finalUrl && isAudio) {
                    // Fallback check if direct audio link is missing
                    finalUrl = await fetchDownloadLink(q, true); // Hypothetical API call for audio extraction
                }

                if (!finalUrl) {
                    await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
                    return await reply(`❌ ${isAudio ? 'Audio' : 'Video'} link uplabdh nahi hai.`);
                }
                
                // Send Media based on selection
                if (isAudio) {
                    await conn.sendMessage(from, {
                        audio: { url: finalUrl },
                        mimetype: 'audio/mpeg',
                        fileName: `${metadata.description || 'tiktok'}.mp3`,
                        caption: `✅ *Audio Extracted*\nTitle: ${metadata.description}`,
                    }, { quoted: msg });
                } else if (cachedData.isPhoto) {
                    // Send all photos in the slide (Not feasible in simple setup, send first image or video only)
                    await conn.sendMessage(from, {
                        image: { url: finalUrl }, 
                        caption: `✅ *Photo Slide* (First Image)\nTitle: ${metadata.description}`
                    }, { quoted: msg });
                } else {
                    await conn.sendMessage(from, {
                        video: { url: finalUrl },
                        mimetype: 'video/mp4',
                        caption: `✅ *Video Downloaded*\nTitle: ${metadata.description}`,
                    }, { quoted: msg });
                }
                
                await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

            } else if (cachedData) {
                 await reply("❌ Kripya sirf 1 ya 2 se reply karein.");
            }
        };

        conn.ev.on("messages.upsert", selectionHandler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", selectionHandler);
            if (searchCache.has(cacheKey)) {
                reply("⚠️ Samay seema samapt. Kripya dobara link dein.");
                searchCache.delete(cacheKey);
            }
        }, 180000); // 3 minutes timeout

    } catch (e) {
        console.error("❌ TT Command General Error:", e);
        reply(`⚠️ Terjadi kesalahan saat memproses TikTok: ${e.message}`);
    }
});
