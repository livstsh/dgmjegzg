const { cmd } = require("../command");
const axios = require("axios");

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
        responseMsg += `_You can use these numbers for OTP verification._\n\n`;

        // Pehle 10 numbers dikhane ke liye
        numbers.slice(0, 10).forEach((item, index) => {
            responseMsg += `*${index + 1}.* 📱 +${item.number}\n`;
            responseMsg += `🌍 *Country:* ${item.country || "International"}\n`;
            responseMsg += `🔗 *Check Messages:* ${item.url || "N/A"}\n\n`;
        });

        responseMsg += `> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*`;

        await conn.sendMessage(from, { 
            text: responseMsg,
            contextInfo: {
                externalAdReply: {
                    title: "PROVA-MD TEMP NUMBER SERVICE",
                    body: "Get free virtual numbers",
                    thumbnailUrl: "https://i.ibb.co/vz6V0vB/temp-num.jpg", // Aap apni marzi ki image link dal sakte hain
                    sourceUrl: "https://arslan-apis.vercel.app",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Temp Number Error:", e);
        reply("❌ Service is currently busy. Try again later.");
    }
});
