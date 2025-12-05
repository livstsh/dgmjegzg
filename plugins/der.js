const { cmd } = require('../command');
const fetch = require('node-fetch'); 
const yts = require('yt-search'); 
const axios = require('axios'); 
const Buffer = require('buffer').Buffer;
const config = require('../config');

// --- API Endpoints (Required for reliable downloading) ---
// User provided APIs for download
const PRIMARY_VIDEO_API = "https://jawad-tech.vercel.app/download/ytdl?url=";
const PRIMARY_AUDIO_API = "https://jawad-tech.vercel.app/download/audio?url=";

// --- FINAL RELIABLE FALLBACK API (Requires Key in config) ---
// Using a stable third-party fallback API as a safety measure.
const FALLBACK_DOWNLOAD_API = "https://api.deline.web.id/downloader/ytmp4?url="; 


// --- Core Download Function (Handles Audio/Video Links) ---
async function fetchAndSendMedia(conn, chat, videoUrl, isAudio, fileName, caption, quotedMsg) {
    let mediaKey = isAudio ? 'audio' : 'video';
    let mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
    let ext = isAudio ? 'mp3' : 'mp4';
    let finalUrl = null;

    // 1. Attempt Primary APIs (User's /ytdl and /audio)
    try {
        const apiUrl = isAudio ? `${PRIMARY_AUDIO_API}${encodeURIComponent(videoUrl)}` : `${PRIMARY_VIDEO_API}${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });
        
        if (data.status === true) {
            // Check based on API structure: /audio gives direct link, /ytdl gives nested mp4
            if (isAudio && data.result) {
                finalUrl = data.result; // Direct link from /download/audio
            } else if (!isAudio && data.result?.mp4) {
                finalUrl = data.result.mp4; // Nested link from /download/ytdl
            }
        }
    } catch (e) {
        console.warn(`Primary Download API failed for ${mediaKey}. Trying Fallback.`);
    }

    // 2. Attempt Fallback API (Deline Web)
    if (!finalUrl) {
        try {
            const fallbackUrl = isAudio ? 
                `${DOWNLOAD_API_AUDIO.replace('ytmp3', 'ytmp3')}${encodeURIComponent(videoUrl)}` : 
                `${FALLBACK_DOWNLOAD_API}${encodeURIComponent(videoUrl)}`;

            const { data } = await axios.get(fallbackUrl, { timeout: 20000 });
            
            // Assuming fallback API structure returns final URL in data.link or data.result.url
            if (data.status === true) {
                finalUrl = data.result?.url || data.link || data.result;
            }
        } catch (e) {
            console.error(`Fallback Download API failed: ${e.message}`);
        }
    }

    if (!finalUrl) throw new Error("Sabhi APIs se seedha download link nahi mila.");
    
    // 3. Send the media
    await conn.sendMessage(chat, {
        [mediaKey]: { url: finalUrl },
        mimetype: mimeType,
        fileName: `${fileName}.${ext}`,
        caption: caption,
        ptt: isAudio ? false : undefined // Standard audio send
    }, { quoted: quotedMsg });

    return true;
}


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


// --- MAIN HANDLER FUNCTION (Handles all aliases) ---
let handler = async (conn, mek, m, { q, text, args, usedPrefix, command, reply, from }) => {
    
    // --- Determine Command Type based on user's desired aliases ---
    // User's desired aliases: mplay, ytplay, yta, ytmp4, yts, etc.
    const isPlay = ['play', 'ytplay', 'youtubeplay', 'mplay'].includes(command);
    const isYTA = ['yta', 'ytmp3', 'getaud', 'youtubemp3', 'ytaudio'].includes(command);
    const isYTV = ['getvid', 'ytmp4', 'youtubemp4', 'ytv', 'youtubevideo', 'video'].includes(command);
    const isYTSearch = ['yts', 'ytsearch', 'youtubesearch', 'ytlist', 'youtubelist', 'ytl'].includes(command);
    
    
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
            const isAudio = isYTA || isPlay; // Play command defaults to audio
            
            // Send Info Card (Thumbnail Preview)
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
            reply(`❌ Download karte samay truti aayi: ${error.message}.`);
        }
    } 
    
    else if (isYTSearch) {
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


// --- COMMAND WRAPPER (Updated to include all new aliases) ---
cmd({
    pattern: "mplay",
    alias: ['ytplay', 'youtubeplay', 'mplay', 'ytlist', 'youtubelist', 'ytl', 'yta', 'ytmp3', 'getaud', 'youtubemp3', 'yts', 'ytsearch', 'youtubesearch', 'getvid', 'ytmp4', 'youtubemp4', 'ytv', 'youtubevideo', 'video'],
    desc: "YouTube par search, download (MP3/MP4) aur playlist list karta hai.",
    category: "download",
    react: "🎶",
    filename: __filename,
    command: /^(play|ytplay|youtubeplay|mplay|ytlist|youtubelist|ytl|yta|ytmp3|getaud|youtubemp3|yts|ytsearch|youtubesearch|getvid|ytmp4|youtubemp4|ytv|youtubevideo|video)$/i
}, handler);

module.exports = handler;
