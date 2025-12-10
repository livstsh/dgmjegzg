const { cmd } = require('../command');
const fetch = require('node-fetch'); 
const config = require('../config');

// --- API Endpoints and Key Management ---
const REACT_API_BASE = 'https://react.whyux-xec.my.id/api/rch';
const API_KEY = config.CHANNEL_REACT_KEY || 'YOUR_API_KEY_HERE'; // Key must be set in config.js

cmd({
    pattern: "rch",
    alias: ["reactchannel", "channelreact"],
    desc: "WhatsApp Channel ke link par emoji reaction bhejta hai.", // Sends an emoji reaction to a WhatsApp Channel link.
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command }) => {
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        return reply("❌ API Key Missing: Kripya is command ko chalaane se pehle config mein CHANNEL_REACT_KEY set karein.");
    }

    if (!q || !q.includes('|')) {
        return reply(`❌ Kripya channel link aur emoji ko '|' se alag karke dein.\n\n*Format:* ${prefix + command} [Channel Link] | [Emoji]\n*Udaharan:* ${prefix + command} https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O | 🔥`);
    }
    
    const [link, emoji] = q.split('|').map(s => s.trim());
    
    if (!link || !emoji || !link.includes('whatsapp.com/channel')) {
        return reply("❌ Format ya Channel Link galat hai. Kripya sahi link aur ek emoji dein.");
    }
    
    const encodedLink = encodeURIComponent(link);
    const encodedEmoji = encodeURIComponent(emoji);

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await reply(`⏳ Reaction *${emoji}* ko channel par bheja ja raha hai...`);

    try {
        const url = `${REACT_API_BASE}?link=${encodedLink}&emoji=${encodedEmoji}`;
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": API_KEY,
                "User-Agent": "WhatsApp-Bot-Reaction-Client"
            },
            timeout: 20000
        });
        
        const rawText = await response.text();
        let result;

        try {
            // Attempt to parse JSON
            result = JSON.parse(rawText);
        } catch {
            // If JSON parsing fails (e.g., raw error text or non-JSON response)
            console.error("RAW API RESPONSE (Non-JSON):", rawText);
            return reply(`⚠️ API se anjaan jawab mila. (Raw: ${rawText.substring(0, 50)}...)`);
        }

        if (result && result.success === true) { 
            await reply(`✅ React safaltapoorvak bhej diya gaya!\n🌟 Emoji: ${emoji}`);
        } else {
            console.error("API ERROR:", result);
            const errMsg = result?.error || result?.message || "Galti hui, reaction nahi bheja ja saka.";
            await reply(`⚠️ Reaction bhejne mein vifal: ${errMsg}`);
        }

    } catch (err) {
        console.error("FETCH ERROR:", err);
        await reply("⚠️ Network error ya API server down hai. Kripya dobara prayas karein.");
    } finally {
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    }
});
