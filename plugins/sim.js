const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "sim",
    alias: ["database", "numinfo", "check"],
    desc: "Fetch details for a specific phone number",
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a phone number.\nExample: *.sim 92300xxxxxxx*");

        // Clean number (sirf digits rakhta hai)
        const cleanNumber = q.replace(/[^0-9]/g, '');

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Call
        const apiUrl = `https://arslan-apis.vercel.app/more/database?number=${cleanNumber}`;
        const res = await axios.get(apiUrl, { timeout: 20000 });

        if (!res.data || res.data.status === false || !res.data.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No records found for this number.");
        }

        const data = res.data.result;

        // Message Formatting
        let responseText = `📑 *SIM DATABASE INFO*\n\n`;
        responseText += `👤 *Name:* ${data.name || "N/A"}\n`;
        responseText += `🆔 *CNIC:* ${data.cnic || "N/A"}\n`;
        responseText += `📱 *Number:* ${data.number || cleanNumber}\n`;
        responseText += `🏠 *Address:* ${data.address || "N/A"}\n`;
        responseText += `📅 *Date:* ${data.date || "N/A"}\n\n`;
        responseText += `> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("SIM command error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ An error occurred while fetching data.");
    }
});
