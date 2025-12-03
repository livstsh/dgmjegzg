const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch');

// --- API Endpoints ---
const PRIMARY_DOWNLOAD_API = `https://api.siputzx.my.id/api/tiktok/v2?url=`; // Primary API
const FALLBACK_DOWNLOAD_API = `https://jawad-tech.vercel.app/download/tiktok?url=`; // Public fallback API (Note: Structure might differ)

// Global State Cache for Interactive Steps
const searchCache = new Map();

// Helper function to handle fetch and error reporting
async function fetchTikTokData(url) {
    // --- Attempt 1: Primary API ---
    try {
        const encodedURL = encodeURIComponent(url);
        const apiUrl = `${PRIMARY_DOWNLOAD_API}${encodedURL}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });
        
        if (data.success && data.data) {
            return { 
                source: 'Primary',
                metadata: data.data.metadata,
                download: data.data.download 
            };
        }
        throw new Error("Primary API returned invalid data structure.");
    } catch (err) {
        console.warn("Primary TikTok API failed. Trying Fallback...");
    }

    // --- Attempt 2: Fallback API ---
    try {
        const encodedURL = encodeURIComponent(url);
        const apiUrl = `${FALLBACK_DOWNLOAD_API}${encodedURL}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        // Assuming this fallback API returns a simplified structure with direct links
        if (data.status && data.result) {
            const videoLink = data.result.nowm || data.result.video;
            const audioLink = data.result.music || data.result.audio;
            
            if (videoLink || audioLink) {
                return {
                    source: 'Fallback',
                    metadata: { description: data.result.title || 'TikTok Video', stats: {} },
                    download: {
                        video: [videoLink].filter(Boolean),
                        photo: [], // Assuming fallback doesn't handle photo slides well
                        musicUrl: audioLink
                    }
                };
            }
        }
        throw new Error("Fallback API failed or returned no usable link.");
    } catch (err) {
        throw new Error("❌ Dono APIs se TikTok data lene mein truti aayi.");
    }
}

// Helper function needed for audio fallback logic inside the handler
async function fetchDownloadLink(url, isAudio) {
    // This is a simplified function used only for the audio fallback check within the main handler
    const linkField = isAudio ? 'musicUrl' : 'video';
    const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;

    try {
        const { data } = await axios.get(apiUrl, { timeout: 15000 });
        if (data.success && data.data && data.data.download[linkField]) {
            return data.data.download[linkField];
        }
    } catch (e) {
        // Ignore specific error, just return null if fail
    }
    return null;
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

        const data = await fetchTikTokData(q); // Now fetches using the fallback logic
        const { metadata, download, source } = data;
        
        // Determine content type
        const isVideo = Array.isArray(download.video) && download.video.length > 0;
        const isPhoto = Array.isArray(download.photo) && download.photo.length > 0;
        
        let downloadLinks = [];
        let contentType = 'Unknown';
        
        if (isVideo) {
            downloadLinks = download.video;
            contentType = 'Video';
        } else if (isPhoto && download.photo[0]) { // Check if photo slide has any images
            downloadLinks = download.photo;
            contentType = 'Photo Slide';
        } else {
            return reply("❌ Is link par na video mila aur na photo slide.");
        }

        const info = `
*🎬 TIKTOK DOWNLOADER*

📌 *Description:* ${metadata.description || 'N/A'}
❤️ *Likes:* ${metadata.stats?.likeCount || 'N/A'}
💬 *Comments:* ${metadata.stats?.commentCount || 'N/A'}
🔗 *Link:* ${q}

*Content:* ${contentType} (Source: ${source})
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
                let finalUrl = isAudio ? cachedData.audio : cachedData.video || (cachedData.isPhoto ? cachedData.photo[0] : null);
                
                // Final Check and Fallback for Audio if original URL was null
                if (!finalUrl && isAudio) {
                    finalUrl = await fetchDownloadLink(q, true); // Use simpler fetcher as a last resort
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
                    // Send the first photo in the slide
                    await conn.sendMessage(from, {
                        image: { url: finalUrl }, 
                        caption: `✅ *Photo Slide* (First Image)\nTitle: ${metadata.description}`,
                        fileName: `${metadata.description || 'tiktok'}.jpg`,
                    }, { quoted: msg });
                } else {
                    await conn.sendMessage(from, {
                        video: { url: finalUrl },
                        mimetype: 'video/mp4',
                        caption: `✅ *Video Downloaded*\nTitle: ${metadata.description}`,
                        fileName: `${metadata.description || 'tiktok'}.mp4`,
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
