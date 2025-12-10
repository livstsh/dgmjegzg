const { cmd } = require('../command');
const fetch = require('node-fetch'); // Assuming node-fetch is available
const axios = require('axios');

// --- API Endpoints ---
const CHARACTER_API = 'https://api.ootaizumi.web.id/random/livechart-karakter';

// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, from, prefix, command }) => {
    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply('⏳ *Anime Character* khoja jaa raha hai...');

        // 1. Fetch data from the API
        const url = CHARACTER_API;
        let res = await fetch(url, { timeout: 15000 });
        
        if (!res.ok) {
             throw new Error(`API se connection fail ho gaya. Status: ${res.status}`);
        }
        
        let json = await res.json();
        
        if (!json.status || !json.result) {
            throw new Error('API se koi data nahi mila.');
        }

        let r = json.result;

        // 2. Format the caption
        let caption =
            `┌─ *Anime Character Details* ─┐\n\n` +
            
            `│ • *Naam:* ${r.name || 'N/A'}\n` +
            `│ • *Japanese Naam:* ${r.japaneseName || '-'}\n` +
            `│ • *Anime Title:* ${r.title || 'N/A'}\n` +
            `│ • *Tags:* ${r.tags?.join(', ') || '-'}\n\n` +
            
            `└─ ˚୨୧⋆｡˚ ⋆\n\n_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;
            
        // 3. Send the image with caption
        await conn.sendMessage(from, {
            image: { url: r.image },
            caption
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Random Character Error:", e);
        await reply(`❌ *Galti hui:* ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
};

cmd({
    pattern: "charanim",
    alias: ["char", "animechar"],
    desc: "Random anime character ki jaankari aur photo deta hai.", // Gives random anime character info and photo.
    category: "random",
    react: "🎭",
    filename: __filename
}, handler);

module.exports = handler;
