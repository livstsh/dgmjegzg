const axios = require('axios');
const { cmd } = require('../command');

// --- Helper Function: Gemini API ---
async function fetchGemini(query, session = null) {
    // aHR0cHM6Ly9keHotYWkudmVyY2VsLmFwcC9hcGkvZ2VtaW5p -> https://dxz-ai.vercel.app/api/gemini
    const finalApiUrl = Buffer.from("aHR0cHM6Ly9keHotYWkudmVyY2VsLmFwcC9hcGkvZ2VtaW5p", 'base64').toString('utf8');

    const params = { text: query };
    if (session) params.session = session;

    const { data } = await axios.get(finalApiUrl, {
        params,
        headers: { "User-Agent": "Postify/1.0.0" },
        timeout: 30000
    });

    return data;
}

// Global object to store sessions per user
if (!global.geminiSessions) global.geminiSessions = {};

// --- Bot Command ---
cmd({
    pattern: "gemini",
    alias: ["googleai", "ai2"],
    react: "🧠",
    desc: "Chat with Gemini AI (with session memory).",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply("🤖 *Hai! Saya Gemini AI.*\n\nSilakan masukkan pertanyaan Anda.\n*Contoh:* .gemini cara membuat kopi");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Get existing session for this user
        const userSession = global.geminiSessions[sender] || null;

        // Fetch response from API
        const response = await fetchGemini(q, userSession);

        if (response.ok) {
            // Save/Update session for continuity
            if (response.session) {
                global.geminiSessions[sender] = response.session;
            }

            const caption = `*✦ GEMINI AI RESPONSE ✦*\n\n${response.message.trim()}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

            await conn.sendMessage(from, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: "GEMINI CHAT ASSISTANT",
                        body: "Powered by Google Gemini Pro",
                        thumbnailUrl: "https://files.catbox.moe/iw4tzb.jpg", // Aap apni choice ki image laga sakte hain
                        sourceUrl: "https://github.com/KAMRAN-SMD",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            throw new Error(response.message || "API returned an error");
        }

    } catch (e) {
        console.error("Gemini Error:", e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *Gemini API Error:* ${e.message}`);
    }
});
