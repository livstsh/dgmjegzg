const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "shion",
    alias: ["shionai", "hazel"],
    react: "🎀",
    desc: "Chat with Shion AI (Roleplay Character).",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Text validation
        if (!q) return reply("Hai! Masukkan percakapanmu, contoh: .shion Hai Shion, apa kabar?");

        // Loading message
        await reply("✨ *Shion is thinking...*");

        // API Request using the source you provided
        const url = `https://zelapioffciall.koyeb.app/ai/shion?text=${encodeURIComponent(q)}`;
        const res = await axios.get(url);
        const data = res.data;

        // Check if API response is valid
        if (!data.status || !data.result) {
            throw new Error(data.message || "Tidak ada hasil ditemukan.");
        }

        // Extracting content from API result
        const hasil = data.result.content;

        // Final Response with Branding
        const finalMsg = `*🎀 SHION AI 🎀*\n\n${hasil.trim()}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

        await conn.sendMessage(from, { 
            text: finalMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'PROVA-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Shion AI Error:", error);
        const errorMsg = error.response?.data?.message || error.message || error;
        reply(`❌ *Terjadi kesalahan:* ${errorMsg}`);
    }
});
            
