const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "media",
    alias: ["video5", "yt2", "fb7", "ig4"],
    react: "📥",
    desc: "Download media from various social platforms.",
    category: "download",
    use: ".media <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // SAFE KEY: Crash rokne ke liye
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔗 Please provide a social media link (YouTube/FB/IG)!");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Step 1: Loading Message
        const waitMsg = await conn.sendMessage(from, { text: "🔄 *Fetching media info from Movanest...*" }, { quoted: m });

        // Note: Direct API of movanest is needed here. 
        // For now, using a general scraper logic as per site structure
        const apiUrl = `https://api.movanest.xyz/download?url=${encodeURIComponent(text)}`;
        const res = await axios.get(apiUrl).catch(() => null);

        if (!res || !res.data || res.data.status !== 'success') {
            throw new Error("Could not fetch media. Please check the URL or try again later.");
        }

        const media = res.data.result;
        let resultMsg = `📥 *MEDIA DOWNLOADER*\n\n`;
        resultMsg += `📝 *Title:* ${media.title || "N/A"}\n`;
        resultMsg += `🎥 *Quality:* ${media.quality || "720p"}\n\n`;
        resultMsg += `🔗 *Download Link:* ${media.download_url}\n\n`;
        resultMsg += `> © PROVA MD ❤️`;

        // Safe Edit
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: resultMsg, edit: waitMsg.key });
        } else {
            await reply(resultMsg);
        }

        // Optional: Send the file directly if size is small
        if (media.download_url) {
            await conn.sendMessage(from, { video: { url: media.download_url }, caption: media.title }, { quoted: m });
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
            
