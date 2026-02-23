const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

// Temporary storage for selection
let downloadSession = {};

const FOOTER = "⚡ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ";

// --- 1. SEARCH & MENU COMMAND ---
cmd({
    pattern: "song2",
    alias: ["play5", "video3", "download2"],
    desc: "Search and download audio/video",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (sock, message, m, { q, from, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a name or link!");

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        // Session save kar rahe hain taaki reply handle ho sake
        downloadSession[from] = {
            url: video.url,
            title: video.title,
            thumbnail: video.thumbnail,
            author: video.author.name
        };

        const menuText = `*${video.title}*

🎥 Channel: ${video.author.name}
⏳ Duration: ${video.timestamp}

*Reply with a number:*
1️⃣ *Audio (MP3)*
2️⃣ *Video (MP4)*

> ${FOOTER}`;

        await sock.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: menuText
        }, { quoted: message });

    } catch (e) {
        console.error(e);
        reply("❌ Search error.");
    }
});

// --- 2. REPLY HANDLER (1 or 2) ---
// Note: Ye logic aapke 'index.js' ya 'message-handler' mein hona chahiye
// Lekin yahan main template de raha hoon jo aapke 'cmd' structure mein fit ho sake

cmd({
    on: "text" // Har text message par check karega agar session active hai
}, async (sock, message, m, { body, from, reply }) => {
    const session = downloadSession[from];
    if (!session) return; // Agar koi active download request nahi hai toh ignore karein

    if (body === "1") {
        // AUDIO DOWNLOAD (Arslan API)
        await sock.sendMessage(from, { react: { text: "🎧", key: message.key } });
        try {
            const res = await axios.get(`https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(session.url)}`);
            const audioUrl = res.data.result.download.url;
            
            await sock.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${session.title}.mp3`
            }, { quoted: message });
            
            delete downloadSession[from]; // Kaam khatam, session clear
        } catch { reply("❌ Audio API error."); }

    } else if (body === "2") {
        // VIDEO DOWNLOAD (Jawad API)
        await sock.sendMessage(from, { react: { text: "🎬", key: message.key } });
        try {
            const res = await axios.get(`https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(session.url)}`);
            const videoUrl = res.data.result.mp4;

            await sock.sendMessage(from, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: `*${session.title}*\n\n> ${FOOTER}`
            }, { quoted: message });

            delete downloadSession[from]; // Session clear
        } catch { reply("❌ Video API error."); }
    }
});
            
