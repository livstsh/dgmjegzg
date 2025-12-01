const axios = require("axios");
const { cmd } = require("../command");

const PRIMARY_API_URL = "https://api.privatezia.biz.id/api/downloader/fbdownload?url=";
const FALLBACK_API_URL = "https://aemt.me/fbdown?url="; // Using a common public fallback API

async function fetchVideo(url) {
    let downloadUrl = null;
    let videoTitle = null;
    let quality = '';

    // --- Attempt 1: Primary API (Privatezia) ---
    try {
        console.log("Attempt 1: Trying Primary API...");
        const apiUrl = `${PRIMARY_API_URL}${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        const data = response.data;

        if (data && data.status === true && data.result) {
            const result = data.result;
            // Prioritize HD, then SD, then generic URL
            if (result.hd) {
                downloadUrl = result.hd;
                quality = 'HD (Primary)';
            } else if (result.sd) {
                downloadUrl = result.sd;
                quality = 'SD (Primary)';
            } else if (result.url) {
                downloadUrl = result.url;
                quality = 'Standard (Primary)';
            }
            videoTitle = result.title;
            if (downloadUrl) return { downloadUrl, videoTitle, quality };
        }
    } catch (e) {
        console.warn(`Primary API failed: ${e.message}`);
    }

    // --- Attempt 2: Fallback API (AEMT) ---
    try {
        console.log("Attempt 2: Trying Fallback API...");
        const apiUrl = `${FALLBACK_API_URL}${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        const data = response.data;

        // Assuming fallback API structure has a simple direct download link field
        if (data && data.status && data.url) { 
            downloadUrl = data.url;
            quality = 'Standard (Fallback)';
            videoTitle = data.title || "Facebook Video"; 
            return { downloadUrl, videoTitle, quality };
        }
    } catch (e) {
        console.error(`Fallback API failed: ${e.message}`);
    }

    return null; // Both failed
}

cmd({
    pattern: "fb",
    alias: ["fbvid", "fbdl"],
    desc: "Downloads videos from Facebook URL with auto-quality and API fallback.", 
    category: "download",
    react: "📘",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Kripya Facebook video ka link dein."); 
        }

        if (!q.includes("facebook.com") && !q.includes("fb.watch")) {
            return reply("❌ Kripya sahi Facebook link dein."); 
        }

        await reply("⏳ Facebook link mil gaya. Video download link khoja jaa raha hai, kripya intezaar karein..."); 

        // Fetch video data using the dual-API logic
        const videoData = await fetchVideo(q);

        if (!videoData) {
            return reply("❌ Video download link prapt nahi hua. Ho sakta hai link private ho ya dono APIs kaam na kar rahi hon.");
        }

        // 4. Video file bhej dein
        await conn.sendMessage(from, {
            video: { url: videoData.downloadUrl },
            mimetype: "video/mp4",
            caption: `✅ *${videoData.videoTitle}* Downloaded Successfully!\n*Quality:* ${videoData.quality}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        // 5. Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ fb command error (General):", e.message);
        reply("⚠️ Video download karte samay ek anapekshit truti hui. Kripya link check karein."); 
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
