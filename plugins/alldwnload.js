const { cmd } = require('../command');
const axios = require('axios');
const Buffer = require('buffer').Buffer;
const fetch = require('node-fetch'); // Assuming node-fetch is available

// --- API Endpoint ---
const HDR_API = "https://hookrestapi.vercel.app/tools/hdr?url=";


// --- Helper function to upload image to Telegraph (Public Host) ---
async function uploadImageToTelegraph(imageBuffer) {
    try {
        const uploadResponse = await axios.post('https://telegra.ph/upload', Buffer.from(imageBuffer, 'binary'), {
            headers: { 'Content-Type': 'image/jpeg' },
            timeout: 15000
        });
        
        // Assuming telegraph returns an array of file objects
        if (uploadResponse.data && uploadResponse.data[0] && uploadResponse.data[0].src) {
             return 'https://telegra.ph' + uploadResponse.data[0].src; 
        }
        throw new Error("Telegraph upload se link nahi mila.");
    } catch (uploadError) {
        throw new Error("❌ Photo ko server par upload karne mein dikkat aayi.");
    }
}


// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, usedPrefix, command }) => {
    try {
        // Use m.quoted for robust handling
        let quoted = m.quoted ? m.quoted : m; 
        let mime = (quoted.msg || quoted).mimetype || '';

        if (!/image/.test(mime))
            return reply(`❌ Kripya photo ko reply karein ya photo ke saath command use karein:\n\n*Udaharan:* Reply photo se ya link bhejkar \`${usedPrefix + command}\``);

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        await reply("⏳ Photo ko HDR quality mein badla jaa raha hai...");

        // 1. Download the image buffer
        let imageBuffer = await conn.downloadMediaMessage(quoted);

        // 2. Upload to Telegraph to get a public URL
        let publicImageUrl = await uploadImageToTelegraph(imageBuffer);
        
        // 3. Request HDR API
        let api = `${HDR_API}${encodeURIComponent(publicImageUrl)}`;
        
        let hasil = await axios.get(api, { responseType: "arraybuffer", timeout: 30000 });

        if (!hasil.data || hasil.data.byteLength === 0) {
            throw new Error("API ne koi sahi photo wapas nahi ki.");
        }

        // 4. Kirim hasil HDR
        return conn.sendMessage(m.chat, {
            image: Buffer.from(hasil.data),
            caption: "*✅ HDR Image Taiyaar!*"
        }, { quoted: m });

    } catch (e) {
        console.error("HDR Command Error:", e);
        let errorMsg = e.message.includes('upload') ? e.message : '❌ Gagal memproses gambar. Link ya format check karein.';
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await reply(errorMsg);
    }
};

// --- Command Wrapper ---
cmd({
    pattern: "hdr",
    alias: ["hd", "enhance"],
    desc: "Photo ki quality ko HDR (High Dynamic Range) mein badalta hai.",
    category: "tools",
    react: "🖼️",
    filename: __filename
}, handler);

module.exports = handler;
