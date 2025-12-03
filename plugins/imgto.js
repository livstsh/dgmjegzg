const { cmd } = require('../command');
const fetch = require('node-fetch'); // Assuming node-fetch is available
const cheerio = require('cheerio'); // Assuming cheerio is available
const FormData = require('form-data'); // Assuming form-data is available
const Buffer = require('buffer').Buffer;
const config = require('../config');


// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, from, prefix, command }) => {
    try {
        let quoted = m.quoted ? m.quoted : m;
        let mime = (quoted.msg || quoted).mimetype || '';
        
        let buffer = null;
        let sourceUrl = null;

        // 1. Determine Input Type (Reply or URL)
        if (q && q.startsWith('http')) {
            sourceUrl = q.trim();
        } else if (m.quoted?.imageMessage || m.quoted?.videoMessage) {
            // Reply to media
            mime = (m.quoted.msg || m.quoted).mimetype;
            buffer = await conn.downloadMediaMessage(m.quoted);
        } else if (q.includes('http')) {
            sourceUrl = q.trim(); // Handle URL if not quoted
        }

        if (!buffer && !sourceUrl) {
            return reply(`❌ Kripya photo ko reply karein ya URL bhejें.\n\n*Udaharan:* ${prefix + command} https://example.com/image.jpg`);
        }

        // 2. Initial Loading
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply('⏳ Image ko ASCII art mein badla jaa raha hai. Kripya intezaar karein...');

        // 3. Define the service parameters (Using a simpler, dedicated API instead of complex scraping)
        // NOTE: We switch to a dedicated API because the original scraping logic is too unstable.
        
        let FINAL_API_URL = "https://api.deline.web.id/tools/image?type=ascii&url=";
        let finalImageUrl = sourceUrl;

        if (buffer) {
            // If buffer is present, we must upload it first (using a public telegraph host)
            try {
                const uploadResponse = await axios.post('https://telegra.ph/upload', Buffer.from(buffer, 'binary'), {
                    headers: { 'Content-Type': 'image/jpeg' }
                });
                finalImageUrl = 'https://telegra.ph' + uploadResponse.data[0].src; 
            } catch (uploadError) {
                throw new Error("Gambar ko server par upload karne mein vifal rahe.");
            }
        }
        
        if (!finalImageUrl) throw new Error("Image ka URL nahi mil paya.");

        // 4. Call the ASCII API
        const response = await fetch(FINAL_API_URL + encodeURIComponent(finalImageUrl), { timeout: 30000 });

        if (!response.ok) {
            throw new Error(`API se connection fail ho gaya. Status: ${response.status}`);
        }

        const json = await response.json();

        // Assuming API returns data in json.result.text
        if (!json.status || !json.result || !json.result.text) {
             throw new Error("API se koi ASCII natija nahi mila.");
        }
        
        const ascii = json.result.text.trim();


        // 5. Send Result
        let out = `*✨ Image To Ascii Art ✨*\n\n`;
        out += `*🖼️ Original Image URL:* ${finalImageUrl.substring(0, 50)}...\n\n`;
        out += `*📄 Hasil ASCII:*\n\`\`\`\n${ascii}\n\`\`\``;

        await conn.sendMessage(from, { text: out }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        const msg = e?.message ?? "unknown error";
        console.error("ASCII Command Error:", e);
        await reply(`*🍂 Terjadi kesalahan saat memproses gambar!* \n*Error:* ${msg}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
};

cmd({
    pattern: "imgascii",
    alias: ["imagetoasci", "ascii"],
    desc: "Photo ko ASCII art text mein badalta hai.", // Converts image to ASCII art text.
    category: "tools",
    react: "🖼️",
    filename: __filename
}, handler);

module.exports = handler;
