const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// --- Configuration ---
const TERMAI_API_KEY = "AIzaBj7z2z3xBjsk";
const TERMAI_API_URL = "https://c.termai.cc/api/upload";

/**
 * Helper: Upload buffer to Termai Storage
 */
async function uploadToTermai(buffer, mimeType, fileName) {
    try {
        const form = new FormData();
        form.append("file", buffer, { filename: fileName, contentType: mimeType });

        const response = await fetch(`${TERMAI_API_URL}?key=${TERMAI_API_KEY}`, {
            method: "POST",
            body: form,
            headers: form.getHeaders()
        });

        const json = await response.json();
        if (json.status && json.path) {
            return json.path.startsWith('http') ? json.path : `https://c.termai.cc${json.path}`;
        }
        throw new Error("Path not found in response");
    } catch (e) {
        throw new Error(`Upload Failed: ${e.message}`);
    }
}

// --- Main Command ---
cmd({
    pattern: "grokvideo",
    alias: ["ai-video", "grokvid"],
    react: "🎬",
    desc: "Generate AI video from an image using Grok AI",
    category: "ai",
    use: ".grokvideo <reply/caption image + prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, config }) => {
    try {
        // Validation: Text check
        if (!q) return reply("🎬 *GROK AI VIDEO GENERATOR*\n\nKirim/Reply gambar dengan caption:\n.grokvideo Anime girl running in rain");

        // Media Detection
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || "";
        
        if (!mime.startsWith("image/")) return reply("❌ Please reply to or send an image with this command!");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const waitMsg = await reply("🎬 *Processing...*\n\n📤 Uploading image to AI server...");

        // Download Image Buffer
        const stream = await downloadContentFromMessage(quoted.msg || quoted, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Upload to Termai
        const fileName = `grok-${Date.now()}.jpg`;
        const imageUrl = await uploadToTermai(buffer, mime, fileName);

        // Edit waiting message
        await conn.sendMessage(from, { 
            text: `✅ *Image Uploaded!*\n🔄 Generating Video (2-5 mins)...\n📝 *Prompt:* ${q}`, 
            edit: waitMsg.key 
        });

        // Request to DyySilence API (Using your provided URL/Key)
        const dyyKey = "dyy"; // Default key as per your snippet
        const fullUrl = `https://api.dyysilence.biz.id/api/ai-video/grokai`;

        const response = await axios.get(fullUrl, {
            params: { url: imageUrl, prompt: q, apikey: dyyKey },
            timeout: 300000 // 5 minutes
        });

        const resultUrl = response.data.result_url || response.data.url || response.data.data?.url;

        if (!resultUrl) throw new Error("AI Server did not return a video link.");

        // Send Final Video
        await conn.sendMessage(from, {
            video: { url: resultUrl },
            caption: `🎬 *GROK AI VIDEO DONE*\n\n📝 *Prompt:* ${q}\n⏱️ Durasi: ~5s\n\n> © PROVA-MD ❤️`,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        const errType = e.message.includes("timeout") ? "⏱️ Timeout! Server busy." : `❌ Error: ${e.message}`;
        reply(errType);
    }
});
            
