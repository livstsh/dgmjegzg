const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

function getGoogleImageSearch(query) {
    const apis = [
        `https://api.giftedtech.co.ke/api/search/googleimage?apikey=gifted&query=${encodeURIComponent(query)}`,
        `https://api.delirius.xyz/search/gimage?query=${encodeURIComponent(query)}`,
        `https://api.siputzx.my.id/api/images?query=${encodeURIComponent(query)}`
    ];
    
    const getAll = async () => {
        for (const url of apis) {
            try {
                const res = await axios.get(url);
                const data = res.data;

                // Gifted API
                if (Array.isArray(data?.result)) {
                    const urls = data.result
                        .map(d => d.image || d.url)
                        .filter(u => typeof u === 'string' && u.startsWith('http'));
                    if (urls.length) return urls;
                }

                // Backup APIs
                if (Array.isArray(data?.data)) {
                    const urls = data.data
                        .map(d => d.url)
                        .filter(u => typeof u === 'string' && u.startsWith('http'));
                    if (urls.length) return urls;
                }

            } catch (e) {
                // Ignore errors and move to next API
            }
        }
        return [];
    };

    return { getAll };
}

cmd({
    pattern: "imagen",
    alias: ["image", "img"],
    react: "🖼️",
    desc: "Search for images",
    category: "search",
    use: ".imagen <query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`⚠️ Please type something to search for images.`);

        const res = getGoogleImageSearch(q);
        const results = await res.getAll();

        if (!results.length) return reply('❌ No images found.');

        // Only 5 photos
        const limited = results.slice(0, 5);
        const caption = `✅ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ*`;

        for (const url of limited) {
            await conn.sendMessage(from, { 
                image: { url }, 
                caption: caption
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Image Search Error:', error);
        reply(`⚠️ A problem has occurred.\n\n${error.message}`);
    }
});