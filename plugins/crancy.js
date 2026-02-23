const { cmd } = require("../command");
const axios = require("axios");

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*";

cmd({
    pattern: "xnxx",
    alias: ["xvideo", "nx"],
    desc: "Search and download videos",
    category: "downloader",
    react: "🔞",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a search query or a valid link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let downloadUrl;
        let videoTitle = "X-Video";

        // Check agar input direct URL hai ya text search
        if (q.includes("xnxx.com") || q.includes("xvideos.com")) {
            // Step 1: Direct Download via URL
            const dlApi = `https://arslan-apis.vercel.app/download/xvideosDown?url=${encodeURIComponent(q)}`;
            const dlRes = await axios.get(dlApi);

            if (!dlRes.data?.status) return reply("❌ Failed to fetch video from link.");
            
            downloadUrl = dlRes.data.result.url;
            videoTitle = dlRes.data.result.title || "Downloaded Video";
        } else {
            // Step 2: Search via Text
            const searchApi = `https://arslan-apis.vercel.app/download/xnxx?text=${encodeURIComponent(q)}`;
            const searchRes = await axios.get(searchApi);

            if (!searchRes.data?.status || !searchRes.data.result || searchRes.data.result.length === 0) {
                return reply("❌ No results found for your search.");
            }

            // Pehla result pick karke uska download link nikalna
            const firstVideo = searchRes.data.result[0];
            downloadUrl = firstVideo.files?.high || firstVideo.files?.low;
            videoTitle = firstVideo.title;
        }

        if (!downloadUrl) return reply("❌ Could not find a valid download link.");

        // Step 3: Send the Video
        let caption = `🎬 *VIDEO DOWNLOADER*\n\n`;
        caption += `📌 *Title:* ${videoTitle}\n\n`;
        caption += FOOTER;

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("XNXX Error:", e);
        reply("❌ An error occurred while processing the request.");
    }
});
                      
