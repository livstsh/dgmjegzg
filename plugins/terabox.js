const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "terabox",
    alias: ["taradl", "teradl"],
    desc: "Download from Terabox and other supported sites",
    category: "download",
    react: "📦",
    filename: __filename
}, async (conn, mek, m, { args, reply, q }) => {
    try {
        if (!q) return reply("🔗 *Please provide a valid link!*");

        const apiUrl = `https://rynekoo-api.vercel.app/dwn/aio/v1`;
        
        // Sending POST request with JSON body
        const response = await axios.post(apiUrl, 
            { url: q }, 
            { headers: { "Content-Type": "application/json" } }
        );

        const data = response.data;

        // Handling the error response you provided
        if (!data.success || (data.result && data.result.error)) {
            const errorMsg = data.result && data.result.message ? data.result.message : "Service Error";
            return reply(`⚠️ *Error:* ${errorMsg}\n\n_Please make sure the link is valid and supported._`);
        }

        const res = data.result;
        const title = res.title || "Downloaded File";
        const downloadUrl = res.videoUrl || res.url || res.downloadUrl;

        let caption = `📦 *AIO DOWNLOADER*\n\n`;
        caption += `📝 *Title:* ${title}\n\n`;
        caption += `🪸 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ* 🪸`;

        // Sending the media
        await conn.sendMessage(
            mek.chat,
            {
                video: { url: downloadUrl },
                caption: caption
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error('API Error:', e.message);
        reply("❌ *API Connection Error! Please try again later.*");
    }
});
