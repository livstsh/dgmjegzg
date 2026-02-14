const axios = require('axios');
const { cmd } = require('../command');
const yts = require('yt-search');

cmd({
    pattern: "ytmp3",
    alias: ["audio", "yta", "song"],
    react: "🎶",
    desc: "Download YouTube audio (MP3) using Mova-Nest API.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a YouTube URL!");
        
        // URL check
        const ytUrl = q.trim();
        if (!ytUrl.includes("youtube.com") && !ytUrl.includes("youtu.be")) {
            return reply("❌ Invalid YouTube link! Please provide a correct link.");
        }

        await reply("⏳ *Fetching audio data, please wait...*");

        // Step 1: Call the Mova-Nest API (as shown in your image)
        const apiUrl = `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(ytUrl)}&format=audio&bitrate=128`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if API response is successful
        if (!data.status || !data.results || !data.results.success) {
            throw new Error("API could not process this video. Please try again later.");
        }

        const title = data.results.title || "YouTube Audio";
        const downloadUrl = data.results.url; // Direct MP3 link
        const thumb = data.results.thumb;

        // Step 2: Inform user about download starting
        await conn.sendMessage(from, { 
            text: `*🎶 Title:* ${title}\n*📁 Format:* MP3 (128kbps)\n\n*Sending audio file...*` 
        }, { quoted: mek });

        // Step 3: Send the Audio File
        await conn.sendMessage(from, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "DR KAMRAN - YouTube Downloader",
                    thumbnailUrl: thumb,
                    sourceUrl: ytUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("YTMP3 Error:", e);
        reply(`❌ *Error:* ${e.message || "Failed to download audio."}`);
    }
});
                    
