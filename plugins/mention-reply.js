const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// --- Helper: Upload to Catbox ---
async function uploadToCatbox(imagePath) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fs.createReadStream(imagePath));
    const response = await axios.post('https://catbox.moe/user/api.php', formData, {
        headers: formData.getHeaders(),
        timeout: 30000
    });
    return response.data.trim();
}

// --- Helper: NoteGPT Logic ---
async function noteGptAnswer(imagePath, prompt = "Explain this image in detail.") {
    const imageUrl = await uploadToCatbox(imagePath);
    const conversationId = crypto.randomUUID();
    
    const payload = {
        message: prompt,
        language: "auto",
        model: "gemini-3-flash-preview",
        tone: "default",
        length: "moderate",
        conversation_id: conversationId,
        image_urls: [imageUrl],
        stream_url: "/api/v2/homework/stream"
    };

    const response = await axios.post('https://notegpt.io/api/v2/homework/stream', payload, {
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://notegpt.io',
            'Referer': 'https://notegpt.io/ai-answer-generator',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
        },
        timeout: 60000,
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        let fullText = '';
        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6);
                        if (!jsonStr) continue;
                        const data = JSON.parse(jsonStr);
                        if (data.text) fullText += data.text;
                        if (data.done) resolve(fullText);
                    } catch (e) {}
                }
            }
        });
        response.data.on('error', reject);
        response.data.on('end', () => fullText ? resolve(fullText) : reject(new Error('No data received')));
    });
}

// --- PROVA-MD Command ---
cmd({
    pattern: "scan",
    alias: ["identify", "whatis"],
    react: "🔍",
    desc: "Scan and identify image content using AI",
    category: "ai",
    use: ".scan <reply image + question>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    // FIX: Safe Key to prevent the 'undefined reading key' error
    const msgKey = (m && m.key) ? m.key : (mek && mek.key ? mek.key : null);
    
    try {
        const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.quotedMessage ? m.message.extendedTextMessage.contextInfo.quotedMessage : m);
        const mime = (m.quoted ? m.quoted.mimetype : m.mimetype) || (quoted.imageMessage ? "image/jpeg" : "");

        if (!mime || !mime.includes("image")) return reply("❌ Please reply to an image to scan!");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await reply("🔍 *Scanning image... please wait.*");

        // Download Image
        const stream = await downloadContentFromMessage(m.quoted ? m.quoted : m.message.imageMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        
        const tempPath = `./scan_${Date.now()}.jpg`;
        fs.writeFileSync(tempPath, buffer);

        // Get AI Answer
        const aiResponse = await noteGptAnswer(tempPath, q || "What is in this image?");

        // Send Result
        await conn.sendMessage(from, { 
            text: `🔍 *IMAGE ANALYSIS*\n\n${aiResponse}\n\n> © PROVA MD ❤️`,
            edit: waitMsg.key 
        });

        // Cleanup
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Analysis Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
            
