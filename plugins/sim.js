const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "sim",
    alias: ["database", "info", "find"],
    desc: "Fetch SIM owner details from database",
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a phone number.\nExample: *.sim 3147168309*");

        // Sirf numbers filter karein
        const num = q.replace(/[^0-9]/g, '');

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://arslan-apis.vercel.app/more/database?number=${num}`;
        const res = await axios.get(apiUrl);

        // Check if data is found in the result array
        if (!res.data || !res.data.status || !res.data.result || res.data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No data found for this number in Arslan database.");
        }

        // Pehla result pick karein (jaisa screenshot mein hai)
        const data = res.data.result[0];

        let resultMsg = `🔍 *Fetched Data from KamranMD:*\n\n`;
        resultMsg += `👤 *Full Name:* ${data.full_name || "Not Found"}\n`;
        resultMsg += `📱 *Phone:* ${data.phone || num}\n`;
        resultMsg += `🆔 *CNIC:* ${data.cnic || "Not Found"}\n`;
        resultMsg += `🏠 *Address:* ${data.address || "Not Found"}\n\n`;
        resultMsg += `> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*`;

        await conn.sendMessage(from, {
            text: resultMsg
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ API connection error. Please try again later.");
    }
});

