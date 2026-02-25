const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ping5",
    alias: ["speed3", "latency7"],
    react: "⚡",
    desc: "Check bot and API response speed",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Safe key detection to prevent "undefined reading key" error
        const msgKey = (m && m.key) ? m.key : (mek && mek.key ? mek.key : null);
        
        const startTime = Date.now();
        
        // NeoApis Ping Request
        const response = await axios.get("https://www.neoapis.my.id/api/info/ping");
        
        const endTime = Date.now();
        const pingTime = endTime - startTime;
        const apiStatus = response.data.status ? "Online ✅" : "Offline ❌";

        let caption = `⚡ *PROVA-MD SPEED* ⚡\n\n`;
        caption += `🚀 *Latency:* ${pingTime}ms\n`;
        caption += `📡 *API Status:* ${apiStatus}\n`;
        caption += `🛰️ *Server:* NeoApis Public\n\n`;
        caption += `> © Powered by Gemini AI ❤️`;

        await conn.sendMessage(from, { text: caption }, { quoted: m });

        // Update reaction to success
        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Ping Failed:* API is currently unreachable.`);
    }
});
