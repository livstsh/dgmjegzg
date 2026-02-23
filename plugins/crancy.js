const { cmd } = require("../command");
const axios = require("axios");

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*";

cmd({
    pattern: "xnxx",
    alias: ["xvideo", "nx", "xv"],
    desc: "Download videos by name or URL",
    category: "downloader",
    react: "🔞",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Video Name or Link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let downloadUrl;
        let videoTitle;

        // --- Case 1: Agar user ne Direct URL diya hai ---
        if (q.includes("xnxx.com") || q.includes("xvideos.com")) {
            const dlApi = `https://arslan-apis.vercel.app/download/xvideosDown?url=${encodeURIComponent(q)}`;
            const dlRes = await axios.get(dlApi);

            if (!dlRes.data?.status) return reply("❌ Link is invalid or expired.");
            
            downloadUrl = dlRes.data.result.url;
            videoTitle = dlRes.data.result.title || "Downloaded Video";
        } 
        
        // --- Case 2: Agar user ne Name/Text search kiya hai ---
        else {
            // Hum pehle xnxx search API use karenge
            const searchApi = `https://arslan-apis.vercel.app/download/xnxx?text=${encodeURIComponent(q)}`;
            const searchRes = await axios.get(searchApi);

            if (!searchRes.data?.status || !searchRes.data.result?.length) {
                return reply("❌ No results found for this name.");
            }

            // Pehla result uthayenge (Top Match)
            const firstVideo = searchRes.data.result[0];
            videoTitle = firstVideo.title;
            
            // Files check karenge (High quality prefer)
            downloadUrl = firstVideo.files?.high || firstVideo.files?.low;

            // Agar search result mein direct download link nahi hai, toh link se fetch karenge
            if (!downloadUrl && firstVideo.link) {
                const retryDl = await axios.get(`https://arslan-apis.vercel.app/download/xvideosDown?url=${encodeURIComponent(firstVideo.link)}`);
                downloadUrl = retryDl.data?.result?.url;
            }
        }

        if (!downloadUrl) return reply("❌ Video download link not found.");

        // --- Step 3: Video Deliver karna ---
        let caption = `🎬 *VIDEO DOWNLOADER*\n\n`;
        caption += `📌 *Title:* ${videoTitle}\n`;
        caption += `🎥 *Format:* MP4\n\n`;
        caption += FOOTER;

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Download Error:", e);
        reply("❌ Error occurred while downloading.");
    }
});
        
