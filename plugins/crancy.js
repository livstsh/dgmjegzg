const { cmd } = require("../command");
const axios = require("axios");

// Temporary storage for session handling
let tempSessions = {};

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*";

// --- 1. COMMAND TO LIST NUMBERS ---
cmd({
    pattern: "tempnum",
    alias: ["tempnumber", "otpnum"],
    desc: "Get temporary phone numbers and fetch OTP",
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
        responseMsg += `_Numbers select karein aur un par OTP bhejne ke baad isi message par us number ko reply karein taaki message show ho sake._\n\n`;

        numbers.slice(0, 10).forEach((item, index) => {
            responseMsg += `*${index + 1}.* 📱 *Number:* \`${item.number}\`\n`;
            responseMsg += `🌍 *Country:* ${item.country}\n\n`;
        });

        responseMsg += FOOTER;

        // Session mein numbers save kar rahe hain taaki reply handle ho sake
        tempSessions[from] = numbers.slice(0, 10);

        await conn.sendMessage(from, { text: responseMsg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Service error.");
    }
});

// --- 2. REPLY HANDLER TO SHOW MESSAGES/OTP ---
cmd({
    on: "text"
}, async (conn, mek, m, { from, body, reply }) => {
    // Check agar user ne kisi phone number ko reply kiya hai
    if (tempSessions[from]) {
        const cleanInput = body.replace(/[^0-9]/g, '');
        
        // Agar input ek phone number jaisa hai
        if (cleanInput.length > 5) {
            await conn.sendMessage(from, { react: { text: "📩", key: mek.key } });

            try {
                // API to fetch messages for specific number
                // Note: Agar aapki API ka link alag hai messages ke liye toh yahan change karein
                const msgApi = `https://arslan-apis.vercel.app/more/tempnumber/messages?number=${cleanInput}`;
                const res = await axios.get(msgApi);

                if (!res.data || !res.data.result || res.data.result.length === 0) {
                    return reply("❌ Abhi tak koi message nahi aaya. 1-2 minute baad dobara check karein.");
                }

                let otpDisplay = `📩 *LATEST MESSAGES FOR:* +${cleanInput}\n\n`;
                
                res.data.result.slice(0, 3).forEach((sms, i) => {
                    otpDisplay += `*${i + 1}. From:* ${sms.from}\n`;
                    otpDisplay += `💬 *Message:* ${sms.message}\n`;
                    otpDisplay += `⏰ *Time:* ${sms.time}\n`;
                    otpDisplay += `──────────────\n`;
                });

                otpDisplay += FOOTER;
                await reply(otpDisplay);

            } catch (err) {
                // Agar direct messages API kaam nahi kar rahi, toh hum manual check ka mashwara denge
                reply("❌ Messages fetch nahi ho sake. Please link par click karke check karein.");
            }
        }
    }
});
