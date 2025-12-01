const axios = require("axios");
const { cmd } = require("../command");

const FACEBOOK_API_URL = "https://api.privatezia.biz.id/api/downloader/fbdownload?url=";

cmd({
    pattern: "fb",
    alias: ["fbvid", "fbdl"],
    desc: "Downloads videos from Facebook URL.", // Facebook URL se video download karta hai.
    category: "download",
    react: "📘",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Kripya Facebook video ka link dein."); // Please provide a Facebook video link.
        }

        if (!q.includes("facebook.com") && !q.includes("fb.watch")) {
            return reply("❌ Kripya sahi Facebook link dein."); // Please provide a valid Facebook link.
        }

        await reply("⏳ Facebook link mil gaya. Video download link khoja jaa raha hai, kripya intezaar karein..."); // Searching for download link, please wait...

        // 1. API URL banao
        const apiUrl = `${FACEBOOK_API_URL}${encodeURIComponent(q)}`;

        // 2. API call karo
        const response = await axios.get(apiUrl, { timeout: 20000 });
        const data = response.data;

        // 3. Result check karo (Assuming API returns status and result with HD/SD links)
        if (!data || data.status !== true || !data.result) {
            console.error("FB API response:", data);
            return reply("❌ Video download link prapt nahi hua. Ho sakta hai link private ho ya API kaam na kar rahi ho."); // Failed to get download link. Link might be private or API is down.
        }

        const result = data.result;
        let downloadUrl = null;
        let quality = '';

        // Prioritize HD, then SD, then generic URL
        if (result.hd) {
            downloadUrl = result.hd;
            quality = 'HD';
        } else if (result.sd) {
            downloadUrl = result.sd;
            quality = 'SD';
        } else if (result.url) { // Some APIs return a single generic 'url' field
            downloadUrl = result.url;
            quality = 'Standard';
        }

        if (!downloadUrl) {
            return reply("❌ Video download karne ka koi link nahi mil paaya."); // No download link found.
        }
        
        const videoTitle = result.title || "Facebook Video";

        // 4. Video file bhej dein
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            caption: `✅ *${videoTitle}* Downloaded Successfully!\n*Quality:* ${quality}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        // 5. Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ fb command error:", e.message);
        reply("⚠️ Video download karte samay ek truti hui. Kripya link check karein."); // An error occurred while downloading. Please check the link.
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
