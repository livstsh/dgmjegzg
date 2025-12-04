const { cmd } = require('../command');
const axios = require('axios');
const Buffer = require('buffer').Buffer;
const fetch = require('node-fetch'); 
const FormData = require('form-data'); // Required for Catbox upload

// --- API Endpoint ---
const HDR_API = "https://hookrestapi.vercel.app/tools/hdr?url=";


// --- Helper function to upload image to Catbox (Public Host) ---
async function uploadImageToPublicHost(imageBuffer) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', imageBuffer, 'image.jpg'); // Upload buffer as a file

        const response = await axios.post(
            'https://catbox.moe/user/api.php', 
            form, 
            {
                headers: form.getHeaders(),
                timeout: 20000 
            }
        );
        
        const url = response.data.trim();

        if (!url.startsWith('http')) throw new Error(`Catbox se sahi link nahi mila: ${url.substring(0, 50)}`);
        
        return url;
    } catch (uploadError) {
        console.error("Catbox Upload Error:", uploadError.message);
        throw new Error("❌ Photo ko Catbox par upload karne mein vifal rahe.");
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
        await reply("⏳ Photo ko HDR quality mein badla jaa raha hai (Host: Catbox)...");

        // 1. Download the image buffer
        let imageBuffer = await conn.downloadMediaMessage(quoted);

        // 2. Upload to Catbox to get a public URL
        let publicImageUrl = await uploadImageToPublicHost(imageBuffer);
        
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
