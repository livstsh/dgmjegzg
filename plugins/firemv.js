const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "kamran",
    alias: ["md", "xeon", "meta"],
    react: "🤖",
    desc: "Talk with AI (HangGTS API)",
    category: "ai",
    use: '.kamran <your question>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a question to ask AI.");

        // React: Processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Show "typing" presence
        await conn.sendPresenceUpdate("composing", from);

        // Fetch AI response
        const { data } = await axios.get(`https://api.hanggts.xyz/ai/chatgpt4o?text=${encodeURIComponent(q)}`);

        if (!data.status || !data.result || !data.result.data) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ AI failed to respond.");
        }

        // React: Success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // Reply with AI message
        await reply(`💬 *KAMRAN-MD:* ${data.result.data}`);

    } catch (e) {
        console.error("KAMRAN MD Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ An error occurred while talking to KAMRAN MD.");
    }
});
  
