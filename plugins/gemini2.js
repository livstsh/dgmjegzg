const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const TERMAI_API_KEY = "AIzaBj7z2z3xBjsk";
const TERMAI_API_URL = "https://c.termai.cc/api/upload";

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
        throw new Error("Path not found");
    } catch (e) { throw new Error(`Upload Failed: ${e.message}`); }
}

cmd({
    pattern: "grokvid",
    alias: ["grokvideo", "ai-video"],
    react: "🎬",
    desc: "Generate AI video from image",
    category: "ai",
    use: ".grokvid <reply image + prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, config }) => {
    try {
        // FIX 1: Safe Message Key detection to avoid "reading key" error
        const msgKey = mek ? mek.key : (m ? m.key : null);
        if (!msgKey) throw new Error("Message key not found");

        if (!q) return reply("🎬 *GROK AI VIDEO GENERATOR*\n\nReply image with prompt:\n.grokvid Anime girl dancing");

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || "";
        if (!mime.startsWith("image/")) return reply("❌ Please reply to an image!");

        // FIX 2: Safe API Key Handling
        const dyyKey = (config && config.dyysilence) ? config.dyysilence.key : "dyy";
        const fullUrl = `https://api.dyysilence.biz.id/api/ai-video/grokai`;

        await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await reply("🎬 *Processing...*\n\n📤 Uploading image...");

        const stream = await downloadContentFromMessage(quoted.msg || quoted, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

        const imageUrl = await uploadToTermai(buffer, mime, `grok-${Date.now()}.jpg`);

        await conn.sendMessage(from, { 
            text: `✅ *Uploaded!*\n🔄 Generating Video (2-5 mins)...\n📝 *Prompt:* ${q}`, 
            edit: waitMsg.key 
        });

        const response = await axios.get(fullUrl, {
            params: { url: imageUrl, prompt: q, apikey: dyyKey },
            timeout: 300000 
        });

        const resultUrl = response.data.result_url || response.data.url || response.data.data?.url;
        if (!resultUrl) throw new Error("AI Server did not return video.");

        await conn.sendMessage(from, {
            video: { url: resultUrl },
            caption: `🎬 *GROK AI VIDEO DONE*\n\n📝 *Prompt:* ${q}\n\n> © PROVA-MD ❤️`,
            mimetype: 'video/mp4'
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        // FIX 3: Safe error reporting
        const fallbackKey = mek ? mek.key : (m ? m.key : null);
        if (fallbackKey) await conn.sendMessage(from, { react: { text: '❌', key: fallbackKey } });
        reply(`❌ *Failed:* ${e.message}`);
    }
});
    
