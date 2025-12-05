const { cmd } = require('../command');
const axios = require('axios');
const Buffer = require('buffer').Buffer;

// --- API Endpoints ---
const CARBON_API_BASE = 'https://www.restwave.my.id/maker/carbon?code='; 

let handler = async (conn, mek, m, { q, reply, from, prefix, command }) => {
    let code = '';

    // 1. Determine Input Source (Text or Quoted Message)
    if (q) {
        code = q;
    } else if (m.quoted && m.quoted.text) {
        code = m.quoted.text;
    } else {
        return reply(`❌ Kripya woh code likhein jise aap Carbon art mein badalna chahte hain.\n\n*Udaharan:*\n${prefix + command} console.log('hello world')\n*Ya* code ko reply karein.`);
    }

    // 2. Validate Input Length
    if (code.trim().length < 3) return reply('❌ Code bahut chota hai.');

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    await reply('⏳ Code ko *Carbon* art mein badla jaa raha hai...');

    try {
        // 3. Construct API URL and Fetch Image Buffer
        const url = `${CARBON_API_BASE}${encodeURIComponent(code)}`;
        
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });

        if (!data || data.byteLength === 0) {
             throw new Error('API se koi image data nahi mila.');
        }

        const caption = `
✅ *Carbon Art Taiyaar!* 🖼️

\`\`\`Code successfully converted.\`\`\`
        `.trim();

        // 4. Send the image file
        await conn.sendMessage(from, {
            image: Buffer.from(data),
            caption: caption,
            fileName: 'carbon.png',
            mimetype: 'image/png'
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('Carbon Command Error:', e);
        reply('❌ Gagal memproses Carbon art. Kripya code check karein ya server error hai.');
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
};

cmd({
    pattern: "carbon",
    alias: ["carb"],
    desc: "Code ko Carbon style image mein badalta hai.", // Converts code to Carbon style image.
    category: "maker",
    react: "💻",
    filename: __filename
}, handler);

module.exports = handler;
