const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

// Conversation storage to keep memory per user
let conversationMemory = {};

cmd({
    pattern: "deepseek",
    alias: ["deep", "chatdeep"],
    react: "🧠",
    desc: "Chat with DeepSeek AI (chat-deep.ai).",
    category: "ai",
    use: ".deep seek for knowledge",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, sender }) => {
    
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("❓ Please provide a message for DeepSeek!");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Start showing typing or loading state
        let waitMsg = await conn.sendMessage(from, { text: "🤖 *DeepSeek is thinking...*" }, { quoted: m });

        const formData = new FormData();
        formData.append('action', 'deepseek_chat');
        formData.append('message', text);
        formData.append('model', 'default');
        formData.append('nonce', '7df78b0165'); // Note: This nonce might expire, keep it updated
        formData.append('save_conversation', '0');
        formData.append('session_only', '1');
        
        // Add memory for the specific user
        if (conversationMemory[sender]) {
            formData.append('conversation_id', conversationMemory[sender]);
        }

        const response = await axios.post('https://chat-deep.ai/wp-admin/admin-ajax.php', formData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                ...formData.getHeaders()
            },
            timeout: 60000 // 1 minute timeout as AI can be slow
        });

        // Save conversation ID for next time
        if (response.data?.success && response.data.data?.conversation_id) {
            conversationMemory[sender] = response.data.data.conversation_id;
        }

        const result = response.data?.data?.response || '❌ DeepAI did not respond.';
        let finalMsg = `🤖 *DEEPSEEK AI*\n\n${result}\n\n> © ᴘʀᴏᴠᴀ-ᴍᴅ ❤️`;

        // Safe Edit logic to update the loading message
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: finalMsg, edit: waitMsg.key });
        } else {
            await reply(finalMsg);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error("DeepSeek Error:", e);
        reply(`❌ *AI Error:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});


