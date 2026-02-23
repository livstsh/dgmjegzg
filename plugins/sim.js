const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = "⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ";

cmd({
    pattern: "database",
    alias: ["details", "numinfo", "check"],
    desc: "Fetch details for a specific phone number",
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (sock, message, m, { q, reply }) => {
    try {
        // Input validation: Check if number is provided
        if (!q) {
            return reply("❌ Please provide a phone number.\nExample: *.database 92300xxxxxxx*");
        }

        // Clean the number (remove spaces, +, or dashes if user adds them)
        const cleanNumber = q.replace(/[^0-9]/g, '');

        // Arslan Database API URL
        const apiUrl = `https://arslan-apis.vercel.app/more/database?number=${cleanNumber}`;

        // Loading message
        await sock.sendMessage(message.chat, { react: { text: "⏳", key: message.key } });

        const res = await axios.get(apiUrl);

        // Check if data exists in response
        if (!res.data || res.data.status === false) {
            return reply("❌ No records found for this number in the database.");
        }

        const data = res.data.result;

        // Formatted Response
        let responseText = `📑 *NUMBER DATABASE INFO*\n\n`;
        responseText += `👤 *Name:* ${data.name || "N/A"}\n`;
        responseText += `🆔 *CNIC:* ${data.cnic || "N/A"}\n`;
        responseText += `📱 *Number:* ${data.number || cleanNumber}\n`;
        responseText += `🏠 *Address:* ${data.address || "N/A"}\n`;
        responseText += `📅 *Date:* ${data.date || "N/A"}\n\n`;
        responseText += `> ${FOOTER}`;

        await sock.sendMessage(message.chat, {
            text: responseText
        }, { quoted: message });

        await sock.sendMessage(message.chat, { react: { text: "✅", key: message.key } });

    } catch (e) {
        console.error("Database API Error:", e);
        reply("❌ API Error! Make sure the service is online or try again later.");
    }
});
            
