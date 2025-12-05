const { cmd } = require('../command');
const fetch = require('node-fetch'); // Assuming node-fetch is available
const yts = require('yt-search'); // Reliable internal YouTube search
const axios = require('axios'); // For API calls
const Buffer = require('buffer').Buffer;

// --- API Endpoints for Download Fallback (Required for reliable downloading) ---
const DOWNLOAD_API_VIDEO = "https://jawad-tech.vercel.app/download/ytdl?url=";
const DOWNLOAD_API_AUDIO = "https://jawad-tech.vercel.app/download/audio?url=";


// --- Core Download Function (Handles Audio/Video Links) ---
async function fetchAndSendMedia(conn, chat, videoUrl, isAudio, fileName, caption, quotedMsg) {
    let mediaKey = isAudio ? 'audio' : 'video';
    let mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
    let ext = isAudio ? 'mp3' : 'mp4';
    
    // 1. Fetch final download link (using a reliable API instead of complex scraper functions)
    const apiUrl = isAudio ? `${DOWNLOAD_API_AUDIO}${encodeURIComponent(videoUrl)}` : `${DOWNLOAD_API_VIDEO}${encodeURIComponent(videoUrl)}`;
    
    try {
        const { data } = await axios.get(apiUrl, { timeout: 25000 });
        const finalUrl = data.result?.url || data.result?.link || data.link;

        if (!finalUrl) throw new Error("API se seedha download link nahi mila.");
        
        // 2. Send the media
        await conn.sendMessage(chat, {
            [mediaKey]: { url: finalUrl },
            mimetype: mimeType,
            fileName: `${fileName}.${ext}`,
            caption: caption,
            ptt: isAudio ? false : undefined // Standard audio send
        }, { quoted: quotedMsg });

        return true;

    } catch (e) {
        console.error(`Download/Send Error for ${mediaKey}:`, e.message);
        throw new Error(`Download karte samay truti aayi: ${e.message}`);
    }
}


// --- MAIN HANDLER FUNCTION (Handles all aliases) ---
let handler = async (conn, mek, m, { q, text, args, usedPrefix, command, reply, from }) => {
    
    // --- Determine Command Type ---
    const isPlay = ['mplay', 'ytplay', 'youtubeplay'].includes(command);
    const isList = ['ytlist', 'youtubelist', 'ytl'].includes(command);
    const isYTA = ['yta', 'ytmp3', 'getaud', 'youtubemp3', 'ytaudio'].includes(command);
    const isYTV = ['getvid', 'ytmp4', 'youtubemp4', 'ytv', 'youtubevideo'].includes(command);
    const isYTSearch = ['yts', 'ytsearch', 'youtubesearch'].includes(command);
    
    
    if (isPlay || isYTA || isYTV) {
        // --- LOGIC FOR PLAY/DOWNLOAD ---
        
        if (!q) return reply(`❌ Kripya video ka naam ya URL dein.\nUdaharan: ${usedPrefix + command} naruto blue bird`);

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply('⏳ Video/Audio data khoja ja raha hai...');

        try {
            // Search or use direct URL
            let videoResult;
            if (q.includes('youtube.com') || q.includes('youtu.be')) {
                const search = await yts({ videoId: extractVideoId(q) || q });
                videoResult = search;
            } else {
                const search = await yts(q);
                videoResult = search.videos[0];
            }

            if (!videoResult) throw 'Video nahi mila. Kripya doosra title try karein.';
            
            const { title, thumbnail, url, timestamp, viewCount } = videoResult;
            const isAudio = isPlay || isYTA;
            
            // Send Info Card
            let caption = `╭──── 〔 Y O U T U B E 〕 ─⬣
⬡ Judul: ${title}
⬡ Durasi: ${timestamp}
⬡ Views: ${viewCount}
⬡ Link: ${url}
╰────────⬣\n\n*Media bheja ja raha hai...*`;

            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: caption,
                contextInfo: { externalAdReply: { title, thumbnailUrl: thumbnail, sourceUrl: url } }
            }, { quoted: mek });

            // Fetch and Send Download
            await fetchAndSendMedia(conn, from, url, isAudio, title, `✅ Downloaded: ${title}`, mek);
            
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error(error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            reply('❌ Download karte samay truti aayi. Kripya URL ya title check karein.');
        }
    } 
    
    else if (isYTSearch || isList) {
        // --- LOGIC FOR YOUTUBE SEARCH/LIST ---
        if (!q) return reply(`❌ Kripya khojne ke liye kuch shabd dein.`);

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const searchResults = await yts(q);
            const videos = searchResults.videos.slice(0, 5); // Max 5 results

            if (videos.length === 0) return reply(`🤷‍♀️ *"${q}"* ke liye koi natija nahi mila.`);

            let replyText = '📺 *YouTube Search Results* 📺\n\n';
            
            videos.forEach((vid, i) => {
                replyText += `*${i + 1}. ${vid.title.trim()}*\n`;
                replyText += `   ⏱️ ${vid.timestamp} | 👀 ${vid.views}\n`;
                replyText += `   🔗 ${vid.url}\n\n`;
            });

            await conn.sendMessage(from, { text: replyText }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error(error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            reply('❌ Search karte samay truti aayi.');
        }
    }
};

// Function to extract video ID (copied from user's original logic)
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}


// --- COMMAND WRAPPER ---
cmd({
    pattern: "play",
    alias: ['ytplay', 'youtubeplay', 'ytlist', 'youtubelist', 'ytl', 'yta', 'ytmp3', 'getaud', 'youtubemp3', 'yts', 'youtubesearch', 'getvid', 'ytmp4', 'youtubemp4', 'ytv', 'youtubevideo'],
    desc: "YouTube par search, download (MP3/MP4) aur playlist list karta hai.",
    category: "download",
    react: "🎶",
    filename: __filename,
    command: /^(play|ytplay|youtubeplay|ytlist|youtubelist|ytl|yta|ytmp3|getaud|youtubemp3|yts|youtubesearch|getvid|ytmp4|youtubemp4|ytv|youtubevideo)$/i
}, handler);

module.exports = handler;
