const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search'); 
const config = require('../config');
const Buffer = require('buffer').Buffer;

// --- API Endpoints ---
const SEARCH_API = "https://jawad-tech.vercel.app/search/youtube?q=";
const PRIMARY_VIDEO_API = "https://jawad-tech.vercel.app/download/ytdl?url=";
const PRIMARY_AUDIO_API = "https://jawad-tech.vercel.app/download/audio?url=";
const FALLBACK_DOWNLOAD_API = "https://api.deline.web.id/downloader/ytmp4?url="; 

// --- DRAMA (CINE SUB) API ---
const DRAMA_SEARCH_API = "https://apis.sandarux.sbs/api/download/sinhalasub/search?q=";
const DRAMA_DOWNLOAD_API = "https://apis.sandarux.sbs/api/download/sinhalasub-dl?q=";

const cache = new Map(); // Caching search results


// --- Helper Functions ---

// Function to fetch video data from either API
async function fetchDownloadLink(url, isAudio, isDrama) {
    let finalUrl = null;

    if (isDrama) {
        // DRAMA LOGIC (Complex 2-step scrape)
        try {
            const searchResponse = await axios.get(`${DRAMA_SEARCH_API}${encodeURIComponent(url)}`, { timeout: 15000 });
            const pageLink = searchResponse.data?.result?.[0]?.link;
            if (!pageLink) throw new Error("Drama page link not found.");

            const downloadResponse = await axios.get(`${DRAMA_DOWNLOAD_API}${encodeURIComponent(pageLink)}`, { timeout: 20000 });
            // Assuming index 1 is the typical 720p download link
            finalUrl = downloadResponse.data.result.downloadLinks[1]?.link; 
            if (!finalUrl) throw new Error("Drama 720p link not found.");
            
            return { url: finalUrl, title: downloadResponse.data.result.title };

        } catch(e) {
            console.error("Drama Fetch Failed:", e.message);
            throw new Error(`Drama download fail: ${e.message}`);
        }
    }
    
    // YOUTUBE LOGIC (Primary API with Fallback)
    try {
        const apiUrl = isAudio ? `${PRIMARY_AUDIO_API}${encodeURIComponent(url)}` : `${PRIMARY_VIDEO_API}${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });
        
        if (data.status === true) {
            if (isAudio && data.result) {
                finalUrl = data.result; 
            } else if (!isAudio && data.result?.mp4) {
                finalUrl = data.result.mp4; 
            }
        }
    } catch (e) {
        console.warn(`Primary Download API failed for ${isAudio}. Trying Fallback.`);
    }
    
    // Fallback API (Deline Web)
    if (!finalUrl) {
        try {
            const fallbackUrl = isAudio ? `${PRIMARY_AUDIO_API.replace('ytdl', 'ytmp3')}${encodeURIComponent(url)}` : `${FALLBACK_DOWNLOAD_API}${encodeURIComponent(url)}`;
            const { data } = await axios.get(fallbackUrl, { timeout: 20000 });
            
            if (data.status === true) {
                finalUrl = data.result?.link || data.link || data.result;
            }
        } catch (e) {
            console.error(`Fallback Download API failed: ${e.message}`);
        }
    }

    if (!finalUrl) throw new Error("Sabhi APIs se seedha download link nahi mila.");
    
    return { url: finalUrl, title: 'YouTube Video' };
}

async function searchYouTube(query) {
    try {
        const searchResults = await yts(query);
        const video = searchResults.videos[0];
        if (video) {
            return {
                url: video.url,
                title: video.title,
                duration: video.timestamp,
                thumbnail: video.thumbnail,
            };
        }
    } catch (e) {
        console.error(`Local yts search failed: ${e.message}`);
    }
    return null;
}


// --- MAIN COMMAND HANDLER ---
cmd({
    pattern: "allv",
    alias: ["allvideo", "youTube"],
    desc: "Interactive download menu for YouTube, Audio, Video, and Drama links.",
    category: "download",
    react: "💾",
    filename: __filename,
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q) return reply(`❌ Kripya video/drama ka naam ya URL dein.`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        await reply('⏳ Video/Drama data khoja ja raha hai...');

        // 1. SEARCH PHASE (Used to get URL and Metadata)
        const videoInfo = await searchYouTube(q);

        if (!videoInfo) {
            return reply("❌ Video khojne mein vifal rahe ya koi natija nahi mila.");
        }

        // --- STEP 2: SHOW INTERACTIVE MENU (8 OPTIONS) ---
        let menu = `
👑 *KAMRAN MD DOWNLOADER* 👑

📌 *Title:* ${videoInfo.title}
⏱️ *Duration:* ${videoInfo.duration}
🔗 *Source URL:* ${videoInfo.url}

🔢 *Kripya format select karne ke liye number se reply karein:*
----------------------------------------
1 - MP4 (Video) 🎥
2 - MP4 DOCUMENT 📄 
3 - DRAMA (720P) 🎬 (Searches for Sinhala Sub)
4 - DRAMA DOCUMENT 📁
5 - MP3 (Audio) 🎶
6 - MP3 DOCUMENT 📃 
7 - YTSEARCH 🔍 (Show more results)
8 - LISTPLAY 📃 (Download as playlist list)
----------------------------------------
*Kripya 1 se 8 tak number se reply karein.*
`;
        
        const cacheKey = `${from}-${mek.key.id}`;
        cache.set(cacheKey, videoInfo); // Store video info
        
        const sentMenuMsg = await conn.sendMessage(
            from,
            { image: { url: videoInfo.thumbnail }, caption: menu },
            { quoted: mek }
        );

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // --- STEP 3: LISTEN FOR SELECTION ---
        const selectionHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToMenu = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentMenuMsg.key.id;
            if (!repliedToMenu) return;

            const selection = msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim();
            const cachedData = cache.get(cacheKey);

            if (!cachedData) return; // Ignore if cache expired

            if (selection >= '1' && selection <= '8') {
                conn.ev.off("messages.upsert", selectionHandler); // Remove listener
                cache.delete(cacheKey); // Clear cache

                await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });

                // --- 3A: Handle Simple Options (7 & 8) ---
                if (selection === '7') {
                    return reply(`🌐 *More Search Results:* ${videoInfo.url.replace('/watch?v=', '/results?search_query=')}`);
                }
                if (selection === '8') {
                    return reply(`🔗 *Playlist Link:* Is video ke liye koi playlist link uplabdh nahi hai.`);
                }

                // --- 3B: Handle Download Options (1-6) ---
                const isDrama = selection === '3' || selection === '4';
                const isAudio = selection === '5' || selection === '6';
                const sendAsDocument = selection === '2' || selection === '4' || selection === '6';
                
                let downloadResult;
                
                try {
                    await reply(`⏳ Link taiyaar kiya jaa raha hai... (Option: ${selection})`);
                    
                    downloadResult = await fetchDownloadLink(cachedData.url, isAudio, isDrama);
                    
                } catch (e) {
                    return reply(`❌ Link laate samay truti aayi: ${e.message}`);
                }

                if (!downloadResult || !downloadResult.url) {
                    return reply("❌ Download link nahi mil paya. Kripya doobara prayas karein.");
                }

                // --- 3C: Send Final Media ---
                const mediaKey = sendAsDocument ? 'document' : (isAudio ? 'audio' : 'video');
                const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
                const fileExt = isAudio ? 'mp3' : 'mp4';
                const finalTitle = downloadResult.title || cachedData.title;
                const formatLabel = isDrama ? 'DRAMA 720P' : (isAudio ? 'MP3' : 'MP4');

                await conn.sendMessage(from, {
                    [mediaKey]: { url: downloadResult.url },
                    mimetype: mimeType,
                    ptt: mediaKey === 'audio' ? false : undefined, 
                    fileName: `${finalTitle} (${formatLabel}).${fileExt}`,
                    caption: `✅ *${finalTitle}* Downloaded Successfully!\n*Format:* ${formatLabel} (${mediaKey.toUpperCase()})`
                }, { quoted: msg });
                
                await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

            } else if (cachedData) {
                await reply("❌ Kripya sahi number (1 se 8) se reply karein.");
            }
        };

        conn.ev.on("messages.upsert", selectionHandler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", selectionHandler);
            if (cache.has(cacheKey)) {
                reply("⚠️ Samay seema samapt ho gayi. Kripya dobara khojein.");
                cache.delete(cacheKey);
            }
        }, 180000); // 3 minutes main timeout


    } catch (e) {
        console.error("Mega Downloader Command Error:", e);
        reply(`⚠️ Anjaan truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
