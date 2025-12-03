const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch');
const Buffer = require('buffer').Buffer; // Ensure Buffer is available

// --- API Endpoints ---
const FALLBACK_API = "https://api.deline.web.id/tools/image?type=";

const wait = '⏳';
const eror = '❌';
const success = '✅';

// Handler function signature adjusted for compatibility
let handler = async (conn, mek, m, { text, usedPrefix, command, reply }) => {
    
    // Use m.quoted for robust handling, consistent with user's style
    const q = m.quoted ? m.quoted : m; 
    const mime = (q.msg || q).mimetype || '';
    const subCommand = text.split(' ')[0]?.toLowerCase();

    const helpMessage = `*🖼️ Pixelcut Image Tools!*` +
        `\n\n*⚠️ Penggunaan:*\nKripya photo ko reply karein aur likhein:\n` +
        `  \`${usedPrefix}${command} removebg\` - Latar (Background) hatane ke liye.\n` +
        `  \`${usedPrefix}${command} upscale\` - Resolution badhane ke liye.\n\n` +
        `*Udaharan:*\nPhoto ko reply karein aur likhein \`${usedPrefix}${command} removebg\``;

    if (!subCommand || (subCommand !== 'removebg' && subCommand !== 'upscale')) {
        return reply(`*❌ Perintah (Command) sahi nahi hai.* ${helpMessage}`);
    }

    if (!/image/.test(mime)) {
        return reply(`*❌ Harap balas gambar (Image) ka upyog karein.* ${helpMessage}`);
    }

    // Send processing reaction
    await conn.sendMessage(m.chat, { react: { text: wait, key: m.key } });

    try {
        // 1. Download the image buffer
        const imageBuffer = await conn.downloadMediaMessage(q);
        
        let publicImageUrl = '';
        
        // --- Step 1: Upload to Telegraph (Simplified public upload) ---
        try {
            // NOTE: Replacing with a common, simple file upload logic for public link generation
            const uploadResponse = await axios.post('https://telegra.ph/upload', Buffer.from(imageBuffer, 'binary'), {
                headers: { 'Content-Type': 'image/jpeg' }
            });
            // Assuming telegraph returns an array of file objects
            publicImageUrl = 'https://telegra.ph' + uploadResponse.data[0].src; 
        } catch (uploadError) {
            console.error("Upload Error:", uploadError.message);
            throw new Error("Gambar ko server par upload karne mein dikkat aayi.");
        }


        // 2. Determine API type and call the fallback API
        const apiType = subCommand === 'removebg' ? 'removebg' : 'upscale';
        const apiUrl = `${FALLBACK_API}${apiType}&url=${encodeURIComponent(publicImageUrl)}`;
        
        let fileName = subCommand === 'removebg' ? 'image_removebg.png' : 'image_upscaled.png';
        let caption = subCommand === 'removebg' ? `*✅ Latar (Background) safalta poorvak hataya gaya!*` : `*✅ Resolution safalta poorvak badhaya gaya!*`;
        
        
        const response = await fetch(apiUrl, { timeout: 30000 });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API response error: ${response.status} - ${errorText.substring(0, 50)}`);
        }

        // 3. Send the resulting image buffer
        const resultBuffer = await response.arrayBuffer();

        if (resultBuffer && resultBuffer.byteLength > 0) {
            // Use conn.sendFile and m.chat for sending, consistent with user's style
            await conn.sendFile(m.chat, Buffer.from(resultBuffer), fileName, caption, m); 
            await conn.sendMessage(m.chat, { react: { text: success, key: m.key } });
        } else {
            throw new Error("API se koi photo wapas nahi aayi.");
        }

    } catch (e) {
        console.error("Pixelcut command handler Error:", e);
        await conn.sendMessage(m.chat, { react: { text: eror, key: m.key } });
        const replyMessage = `❌ *Tasveer process karne mein truti:* ${e.message || "Anjaan galti hui."}. Kripya dobara koshish karein. 😥`;
        await reply(replyMessage);
    }
};

// --- FIX: Added 'pattern' property to the cmd wrapper ---
cmd({
    pattern: "pixelcut", // <-- FIX APPLIED HERE
    alias: ["pixeledit"],
    help: ["pixelcut <removebg|upscale> (reply image)"],
    tags: ["ai"],
    command: /^(pixelcut)$/i, // This regex is already handled by the cmd system but kept for reference
    desc: "AI tools for image enhancement and background removal.",
    category: "ai",
    limit: true,
    filename: __filename
}, handler);

module.exports = handler; 
