const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch'); // Required for fetching media
const Buffer = require('buffer').Buffer;
// NOTE: sharp import has been removed as it causes framework crash.

// --- API Endpoint ---
const BRAT_API_BASE = 'https://api.zenzxz.my.id/api/maker/bratvid?text='; 


let handler = async (conn, mek, m, { q, reply, usedPrefix, command, from }) => {
    try {
        let text = q.trim();

        if (!text) return reply(`❌ Kripya text dein.\n\n*Udaharan:*\n${usedPrefix + command} Hello World`);

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply(`⏳ *Brat* animation taiyaar kiya jaa raha hai...`);

        // 1. Fetch Video/GIF Buffer
        const url = `${BRAT_API_BASE}${encodeURIComponent(text)}`;
        const res = await fetch(url, { timeout: 30000 });
        
        if (!res.ok) throw new Error(`API se video data lene mein vifal rahe. Status: ${res.status}`);

        const gif = Buffer.from(await res.arrayBuffer());

        // 2. Send the result as a video/GIF (Avoiding sharp for sticker conversion)
        await conn.sendMessage(m.chat, {
            video: gif,
            mimetype: 'video/mp4',
            caption: `✅ *Animation Taiyaar!* (Sticker conversion available only if 'sharp' is installed on server)`,
            gifPlayback: true // Play as GIF loop
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("BratGIF Command Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Gagal membuat sticker Brat: ${e.message}`);
    } 
};

cmd({
    pattern: "bratgif",
    alias: ["bratvid"],
    desc: "Text ko animated video/GIF mein badalta hai.", // Converts text to animated video/GIF.
    category: "maker",
    react: "🎬",
    filename: __filename,
    limit: true
}, handler);

module.exports = handler;
