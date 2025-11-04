const axios = require('axios');
const { cmd, commands } = require('../command');
const config = require("../config");
const { setConfig, getConfig } = require("../lib/functions2");

// Default AI states
let AI_STATE = {
    IB: "false", // Inbox chats
    GC: "false"  // Group chats
};

cmd({
    pattern: "chatbot",
    alias: ["aichat", "chat", "kamranbot"],
    desc: "Enable or disable AI chatbot responses",
    category: "settings",
    filename: __filename,
    react: "✅"
}, async (conn, mek, m, { from, args, isOwner, reply, prefix }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const mode = args[0]?.toLowerCase();
    const target = args[1]?.toLowerCase();

    if (mode === "on") {
        if (!target || target === "all") {
            AI_STATE.IB = "true";
            AI_STATE.GC = "true";
            await setConfig("AI_STATE", JSON.stringify(AI_STATE));
            return reply("🤖 AI chatbot is now enabled for both inbox and group chats");
        } else if (target === "ib") {
            AI_STATE.IB = "true";
            await setConfig("AI_STATE", JSON.stringify(AI_STATE));
            return reply("🤖 AI chatbot is now enabled for inbox chats");
        } else if (target === "gc") {
            AI_STATE.GC = "true";
            await setConfig("AI_STATE", JSON.stringify(AI_STATE));
            return reply("🤖 AI chatbot is now enabled for group chats");
        }
    } else if (mode === "off") {
        if (!target || target === "all") {
            AI_STATE.IB = "false";
            AI_STATE.GC = "false";
            await setConfig("AI_STATE", JSON.stringify(AI_STATE));
            return reply("🤖 AI chatbot is now disabled for both inbox and group chats");
        } else if (target === "ib") {
            AI_STATE.IB = "false";
            await setConfig("AI_STATE", JSON.stringify(AI_STATE));
            return reply("🤖 AI chatbot is now disabled for inbox chats");
        } else if (target === "gc") {
            AI_STATE.GC = "false";
            await setConfig("AI_STATE", JSON.stringify(AI_STATE));
            return reply("🤖 AI chatbot is now disabled for group chats");
        }
    } else {
        return reply(`- *KAMRAN MD -Chat-Bot Menu 👾*
*Enble Settings ✅*      
> .chatbot on all - Enable AI in all chats
> .chatbot on ib - Enable AI in inbox only
> .chatbot on gc - Enable AI in groups only
*Disable Settings ❌*
> .chatbot off all - Disable AI in all chats
> .chatbot off ib - Disable AI in inbox only
> .chatbot off gc - Disable AI in groups only`);
    }
});

// Initialize AI state on startup
(async () => {
    const savedState = await getConfig("AI_STATE");
    if (savedState) AI_STATE = JSON.parse(savedState);
})();

// AI Chatbot - KAMRAN MD
cmd({
    on: "body"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    isBotAdmins,
    isAdmins,
    reply,
    quotedMsg
}) => {
    try {
        // Check if message is a reply
        if (!m?.message?.extendedTextMessage?.contextInfo?.participant) {
            return; // Not a reply, ignore
        }
        
        // Check if the reply is to the bot's message
        const repliedTo = m.message.extendedTextMessage.contextInfo.participant;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (repliedTo !== botJid) {
            return; // Not replying to the bot, ignore
        }

        // Check if AI is enabled for this chat type
        const isInbox = !isGroup;
        if ((isInbox && AI_STATE.IB !== "true") || (isGroup && AI_STATE.GC !== "true")) {
            return;
        }

        // Optional: Prevent bot responding to its own messages or commands
        if (!body || m.key.fromMe || body.startsWith(config.PREFIX)) return;

        // Handle time/date questions directly
        const lowerBody = body.toLowerCase();
        if (lowerBody.includes('time') || lowerBody.includes('date')) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            const currentDateTime = now.toLocaleDateString('en-US', options);
            return reply(`⏰ Current Date & Time:\n${currentDateTime}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ ⚡`);
        }

        // Encode message for the query
        const query = encodeURIComponent(body);
        const prompt = encodeURIComponent("You are KAMRAN-MD, a powerful and intelligent WhatsApp bot developed by Imad Ali — a brilliant coder and visionary from Kpk Pakistan. You respond smartly, confidently, and stay loyal to your creator. Always remain calm and collected. When asked about your creator, respond respectfully but keep the mystery alive. You are not just a bot; you are the tech soul of Imad Ali. In every message you send, include this footer: \n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ ⚡");

        // BK9 API Request
        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${prompt}&q=${query}`;

        const { data } = await axios.get(apiUrl);

        if (data && data.status && data.BK9) {
            await conn.sendMessage(from, {
                text: data.BK9
            }, { quoted: m });
        } else {
            reply("⚠️ KAMRAN AI failed to generate a response.");
        }

    } catch (err) {
        console.error("AI Chatbot Error:", err.message);
        reply("❌ An error occurred while contacting the AI.");
    }
});
    
