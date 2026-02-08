const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    desc: "Download TikTok video without watermark",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("Please provide a TikTok video link.");
        if (!q.includes("tiktok.com")) return reply("Invalid TikTok link.");
        
        reply("Downloading video, please wait...");
        
        // 🔄 API replaced with Edith v2 API
        const apiUrl = `https://edith-apis.vercel.app/download/tiktok-v2?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);
        
        // Validate response structure
        if (!data || !data.result || !data.result.data) return reply("Failed to fetch TikTok video.");
        
        const videoData = data.result.data;
        const title = videoData.title || "No Title";
        const author = videoData.author?.nickname || "Unknown";
        const username = videoData.author?.unique_id || "Unknown";
        const likes = videoData.digg_count || 0;
        const comments = videoData.comment_count || 0;
        const shares = videoData.share_count || 0;
        const videoUrl = videoData.play || videoData.wmplay || videoData.hdplay;

        if (!videoUrl) return reply("Video link not found.");

        const caption = `🎵 *TikTok Video* 🎵\n\n` +
                        `👤 *User:* ${author} (@${username})\n` +
                        `📖 *Title:* ${title}\n` +
                        `👍 *Likes:* ${likes}\n💬 *Comments:* ${comments}\n🔁 *Shares:* ${shares}`;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });
        
    } catch (e) {
        console.error("Error in TikTok downloader command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});