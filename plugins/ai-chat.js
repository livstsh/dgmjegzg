const axios = require('axios');
const { cmd } = require('../command');

// --- Helper Function for GPT-4 API ---
async function fetchGPT4(prompt) {
    const modelData = {
        api: 'https://stablediffusion.fr/gpt4/predict2',
        referer: 'https://stablediffusion.fr/chatgpt4'
    };

    // Pehle referer page se cookies lene ke liye GET request
    const hmm = await axios.get(modelData.referer);
    const cookies = hmm.headers['set-cookie'] ? hmm.headers['set-cookie'].join('; ') : '';

    const { data } = await axios.post(modelData.api, { prompt }, {
        headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'origin': 'https://stablediffusion.fr',
            'referer': modelData.referer,
            'cookie': cookies,
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36'
        }
    });

    return data.message;
}

// --- Bot Command ---
cmd({
    pattern: "ai",
    alias: ["gpt4", "chatgpt"],
    react: "✨",
    desc: "Chat with GPT-4 AI.",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Contoh penggunaan: .gpt Apa itu machine learning?");

        // Initial reaction and message
        await reply("✨ *Processing your request...*");

        // Fetch response from GPT API
        const content = await fetchGPT4(q);

        // Success reply with Ad-Reply style and branding
        await conn.sendMessage(from, {
            text: `*✦ GPT-4 AI RESPONSE ✦*\n\n${content}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ*`,
            contextInfo: {
                externalAdReply: {
                    title: 'GPT-4 CHAT ASSISTANT',
                    body: 'Powered by ᴘʀᴏᴠᴀ-ᴍᴅ',
                    mediaType: 1,
                    thumbnailUrl: 'https://files.catbox.moe/4rnbtb.jpg',
                    sourceUrl: 'https://github.com/KAMRAN-SMD', // Aapka link yahan aa sakta hai
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        // Update reaction to Success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("GPT-4 Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *Gagal mengambil respons:* ${e.message || e}`);
    }
});
                      
