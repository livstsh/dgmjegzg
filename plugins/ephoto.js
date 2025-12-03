const { cmd } = require('../command');
const axios = require('axios');

// --- API Endpoint Configuration ---
const EPHOTO_BASE_URL = 'https://api.nekolabs.web.id/ephoto/';

// Map of available effects (Only the ones provided by the user)
const EFFECTS = [
    { id: 1, name: "Galaxy Wallpaper Text", path: "galaxy-wallpaper", react: "🌌" },
    { id: 2, name: "Glitch Text", path: "glitch-text", react: "👾" },
    { id: 3, name: "Glowing Text", path: "glowing-text", react: "✨" },
    { id: 4, name: "Luxury Gold Text", path: "luxury-gold-text", react: "👑" },
    { id: 5, name: "Neon Text", path: "neon-text", react: " neon" },
    { id: 6, name: "3D Nigeria Flag Text", path: "nigeria-3d-flag", react: "🇳🇬" }
];

// Global cache for interactive context (not strictly needed here but kept for consistency)
const ephotoCache = new Map();


// --- MAIN COMMAND HANDLER ---
cmd({
    pattern: "ephoto",
    alias: ["textmaker", "logogen"],
    desc: "Vibhinn stylish backgrounds par text logo generate karta hai.", // Generates text logo on various stylish backgrounds.
    category: "ai",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    
    // --- Step 1: Show Menu if no input is given ---
    if (!q || !q.includes('|')) {
        let menu = `
*✨ E-Photo Logo Generator (${EFFECTS.length} Styles)* ✨
----------------------------------------
*Kripya effect number aur text dein:*

*Format:* \`${prefix + command} [number] | [text]\`

*Available Effects:*
${EFFECTS.map(e => `[${e.id}] ${e.react} ${e.name}`).join('\n')}

*Udaharan:* \`${prefix + command} 4 | DR KAMRAN\`
`;
        return reply(menu);
    }

    // --- Step 2: Parse Input ---
    const [numStr, textInput] = q.split('|').map(s => s.trim());
    const selectedId = parseInt(numStr);
    const selectedEffect = EFFECTS.find(e => e.id === selectedId);
    
    if (!selectedEffect) {
        return reply("❌ Kripya sahi effect number (1-6) chunein.");
    }
    if (!textInput) {
        return reply("❌ Kripya text likhein jise aap logo mein badalna chahte hain.");
    }

    await conn.sendMessage(from, { react: { text: selectedEffect.react.trim() || '⏳', key: m.key } });
    await reply(`⏳ *${selectedEffect.name}* logo taiyaar kiya jaa raha hai...`);

    try {
        // --- Step 3: Call API ---
        const apiUrl = `${EPHOTO_BASE_URL}${selectedEffect.path}?text=${encodeURIComponent(textInput)}`;
        
        const { data } = await axios.get(apiUrl, { timeout: 30000 });
        
        // Assuming the API returns the image URL directly or in a 'result' field
        const imageUrl = data.result || data.url; 

        if (!imageUrl || !imageUrl.startsWith('http')) {
            throw new Error('API se koi valid image link nahi mila.');
        }

        // --- Step 4: Send Result ---
        const caption = `
✅ *Logo Taiyaar!*
*Effect:* ${selectedEffect.name}
*Text:* ${textInput}

_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_
`;

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Ephoto Command Error:", e.message);
        reply(`⚠️ Logo generate karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
