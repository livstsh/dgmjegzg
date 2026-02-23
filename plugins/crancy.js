const { cmd } = require("../command");
const axios = require("axios");

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*";

// --- 1. Command to List Numbers ---
cmd({
    pattern: "tempnum",
    alias: ["tempnumber", "otpnum"],
    desc: "Get temporary phone numbers for OTP",
    category: "tools",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://arslan-apis.vercel.app/more/tempnumber`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.status || !res.data.result) {
            return reply("❌ Failed to fetch temporary numbers.");
        }

        const numbers = res.data.result;
        let responseMsg = `🌐 *VIRTUAL TEMP NUMBERS* 🌐\n\n`;
        responseMsg += `*How to get OTP?*\nCopy the number and use command:\n*.getotp [number]*\n\n`;

        // Pehle 10 numbers dikhane ke liye
        numbers.slice(0, 10).forEach((item, index) => {
            // Screenshot ke mutabiq 'number' field use ho rahi hai
            responseMsg += `*${index + 1}.* 📱 *Number:* \`${item.number}\`\n`;
            responseMsg += `🌍 *Country:* ${item.country}\n\n`;
        });

        responseMsg += FOOTER;

        await conn.sendMessage(from, { text: responseMsg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Service is currently busy.");
    }
});

// --- 2. Command to Get OTP/Messages ---
cmd({
    pattern: "getotp",
    alias: ["checkotp", "readsm"],
    desc: "Check incoming OTP/SMS for a temp number",
    category: "tools",
    react: "📩",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide the number to check OTP.\nExample: *.getotp 16142642074*");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Clean number (remove + or spaces)
        const cleanNumber = q.replace(/[^0-9]/g, '');
        
        // API endpoint to fetch messages for specific number
        const apiUrl = `https://arslan-apis.vercel.app/more/tempnumber/messages?number=${cleanNumber}`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.status || !res.data.result || res.data.result.length === 0) {
            return reply("❌ No messages found yet. Please wait 1-2 minutes and try again.");
        }

        let otpMsg = `📩 *INCOMING MESSAGES FOR:* +${cleanNumber}\n\n`;

        // Latest 5 messages dikhane ke liye
        res.data.result.slice(0, 5).forEach((msg, index) => {
            otpMsg += `*${index + 1}. FROM:* ${msg.from}\n`;
            otpMsg += `💬 *MESSAGE:* ${msg.message}\n`;
            otpMsg += `⏰ *TIME:* ${msg.time}\n`;
            otpMsg += `──────────────\n`;
        });

        otpMsg += FOOTER;

        await conn.sendMessage(from, { text: otpMsg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Error fetching messages. Make sure the number is correct.");
    }
});
            
