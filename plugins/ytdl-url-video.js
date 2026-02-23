const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

// Temporary storage for user choices
let downloadSession = {};

const FOOTER = "⚡ POWERED BY PROVA-MD";

// --- 1. SEARCH COMMAND ---
cmd({
    pattern: "song",
    alias: ["video", "play"],
    desc: "Search and select download format",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (sock, message, m, { q, from, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a name or link!");

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        // Video data ko session mein save karein
        downloadSession[from] = {
            url: video.url,
            title: video.title,
            thumbnail: video.thumbnail
        };

        const menuText = `*${video.title}*

🎥 *Channel:* ${video.author.name}
⏳ *Duration:* ${video.timestamp}

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
        reply("❌ Error during search.");
    }
});

// --- 2. REPLY HANDLER ---
// Ye part aapke message listener mein jayega
cmd({
    on: "text" 
}, async (sock, message, m, { body, from, reply }) => {
    const session = downloadSession[from];
    
    // Agar user ne '1' ya '2' likha hai aur session active hai
    if (session && (body === "1" || body === "2")) {
        
        if (body === "1") {
            // --- AUDIO DOWNLOAD (Arslan API) ---
            await sock.sendMessage(from, { react: { text: "🎧", key: message.key } });
            try {
                const res = await axios.get(`https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(session.url)}`);
                const downloadUrl = res.data.result.download.url;

                await sock.sendMessage(from, {
                    audio: { url: downloadUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${session.title}.mp3`
                }, { quoted: message });
            } catch (err) {
                reply("❌ Audio download failed.");
            }
        } 
        
        else if (body === "2") {
            // --- VIDEO DOWNLOAD (Jawad API) ---
            await sock.sendMessage(from, { react: { text: "🎬", key: message.key } });
            try {
                const res = await axios.get(`https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(session.url)}`);
                const downloadUrl = res.data.result.mp4;

                await sock.sendMessage(from, {
                    video: { url: downloadUrl },
                    mimetype: "video/mp4",
                    caption: `*${session.title}*\n\n> ${FOOTER}`
                }, { quoted: message });
            } catch (err) {
                reply("❌ Video download failed.");
            }
        }

        // Kaam khatam hone ke baad session delete kar dein
        delete downloadSession[from];
    }
});
            
