const axios = require("axios");
const { cmd } = require("../command");

// The base URL for the multi-platform downloader API
const API_BASE_URL = "https://jawad-tech.vercel.app/downloader";

cmd({
    pattern: "alldown",
    alias: ["dl", "getmedia", "getvid"],
    react: "⬇️",
    desc: "Downloads videos/media from various platforms (FB, IG, TikTok, X, etc.) using the URL.",
    category: "downloader",
    filename: __filename
}, async (conn, m, store, { from, quoted, args, q, reply }) => {
    try {
        const videoUrl = args[0]; // Assuming the user provides the URL as the first argument
        
        if (!videoUrl) {
            return reply("❎ Kripya video download karne ke liye URL dein!\n\n*Example:* .download https://www.instagram.com/p/ExamplePost");
        }

        // Basic URL validation (can be more robust)
        if (!videoUrl.startsWith('http')) {
            return reply("❌ Invalid URL. Kripya ek poora aur sahi URL dein (jo 'http' ya 'https' se shuru ho).");
        }

        await reply("⬇️ Video download ki jaa rahi hai, kripya intezaar karein...");

        // 1. Construct the full API URL with the encoded target URL
        // Assuming the API expects the video URL in a query parameter named 'url'
        const apiUrl = `${API_BASE_URL}?url=${encodeURIComponent(videoUrl)}`;

        // 2. Make the API request
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        // --- DEBUGGING: API Response ko check karne ke liye log karein ---
        console.log("--- Downloader API Response (For Debugging) ---");
        console.log("Full Data Structure:", data);
        console.log("------------------------------------------");
        // -----------------------------------------------------------------

        // 3. Process the response
        // Assuming the API returns a status and an array of downloadable links in data.data
        if (!data.status || !data.data || data.data.length === 0) {
             console.error("API returned status false or empty data array.");
            return reply("❌ Download karne mein error aaya ya is URL ke liye koi media nahi mila. Kripya doosra URL try karein.");
        }

        // We choose the best quality/first available link (assuming it's video)
        // The API might return multiple qualities; we'll pick the first one.
        const downloadItem = data.data[0];
        const mediaUrl = downloadItem.url || downloadItem.link;
        const mediaType = downloadItem.type || 'video/mp4'; // Default to video/mp4

        if (!mediaUrl) {
            return reply("❌ Download link API response mein nahi mila.");
        }
        
        // 4. Send the media as a document/video
        // We use document for flexibility, but video for direct display.
        await conn.sendMessage(
            from,
            {
                document: { url: mediaUrl },
                mimetype: mediaType,
                fileName: `downloaded_media_${Date.now()}.${mediaType.split('/')[1] || 'mp4'}`,
                caption: `✅ *Download Successful!* Platform: ${downloadItem.platform || 'Unknown'}
Quality: ${downloadItem.quality || 'N/A'}`
            },
            { quoted: m }
        );
        
    } catch (error) {
        console.error("❌ Error in download command:", error);
        if (error.response) {
            reply(`⚠️ API se data fetch karte samay error aaya. Status: ${error.response.status}`);
        } else {
            reply("⚠️ An error occurred while processing the download command.");
        }
    }
});
