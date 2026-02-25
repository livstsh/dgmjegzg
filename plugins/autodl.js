const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');

// --- Configuration ---
const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Content-Type': 'application/json',
    'origin': 'https://pixwith.ai',
    'referer': 'https://pixwith.ai/',
};

// Helper functions for Session and Mail
function gensesi() { return Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('') + '0'; }
function genmail() { return Math.random().toString(36).substring(2, 14) + '@akunlama.com'; }

async function getPixWithSession() {
    const tempSession = gensesi();
    const email = genmail();
    const username = email.split('@')[0];

    await axios.post('https://api.pixwith.ai/api/user/send_email_code', { email }, { headers: { ...headers, 'x-session-token': tempSession } });

    let otp = null;
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const res = await axios.get(`https://akunlama.com/api/v1/mail/list?recipient=${username}`);
        if (res.data?.length > 0) {
            const r = await axios.get(`https://akunlama.com/api/v1/mail/getHtml?region=${res.data[0].storage.region}&key=${res.data[0].storage.key}`);
            const $ = cheerio.load(r.data);
            const match = $('body').text().match(/Verification code:\s*([A-Z0-9]+)/);
            if (match) { otp = match[1]; break; }
        }
    }
    if (!otp) throw new Error("OTP Verification Timeout. Please try again.");

    const v = await axios.post('https://api.pixwith.ai/api/user/verify_email_code', { email, code: otp }, { headers: { ...headers, 'x-session-token': tempSession } });
    const ex = await axios.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyAoRsni0q79r831sDrUjUTynjAEG2ai-EY', { token: v.data.data.custom_token, returnSecureToken: true });
    const l = await axios.post('https://api.pixwith.ai/api/user/get_user', { token: ex.data.idToken, ref: "-1" }, { headers: { ...headers, 'x-session-token': tempSession } });
    
    return l.data.data.session_token;
}

// --- Main Command ---
cmd({
    pattern: "pixwith",
    alias: ["reimage", "editai"],
    react: "🎨",
    desc: "AI Image to Image transformation",
    category: "ai",
    use: ".pixwith <reply image + prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    
    // FIX: Essential Safe Key logic to stop the 'reading key' error
    const msgKey = (m && m.key) ? m.key : (mek && mek.key ? mek.key : null);
    
    try {
        const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.quotedMessage ? m.message.extendedTextMessage.contextInfo.quotedMessage : m);
        const mime = (m.quoted ? m.quoted.mimetype : m.mimetype) || (quoted.imageMessage ? "image/jpeg" : "");

        if (!mime.includes("image")) return reply("❌ Please reply to an image!");
        if (!q) return reply("📝 Please provide a prompt (e.g., .pixwith make it like a cyber-punk style)");

        // Initializing reaction safely
        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        const waitMsg = await conn.sendMessage(from, { text: "🎨 *AI EDITING...*\n\nStep 1: Authenticating & Generating Session..." }, { quoted: m });

        // 1. Session Setup
        const sessionToken = await getPixWithSession();
        
        // 2. Download Image Buffer
        const stream = await downloadContentFromMessage(m.quoted ? m.quoted : m.message.imageMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        
        const tempPath = `./temp_edit_${Date.now()}.jpg`;
        fs.writeFileSync(tempPath, buffer);

        await conn.sendMessage(from, { text: "Step 2: Uploading image & creating job...", edit: waitMsg.key });

        // 3. Upload to S3
        const preUrlRes = await axios.post('https://api.pixwith.ai/api/chats/pre_url', { image_name: 'input.jpg', content_type: 'image/jpeg' }, { headers: { ...headers, 'x-session-token': sessionToken } });
        const uploadData = preUrlRes.data.data.url;
        
        const form = new FormData();
        Object.entries(uploadData.fields).forEach(([k, v]) => form.append(k, v));
        form.append('file', fs.createReadStream(tempPath));
        await axios.post(uploadData.url, form, { headers: form.getHeaders() });

        // 4. Create Job (using nanobanana model)
        await axios.post('https://api.pixwith.ai/api/items/create', {
            images: { image1: uploadData.fields.key },
            prompt: q,
            options: { prompt_optimization: true, num_outputs: 1, aspect_ratio: '0' },
            model_id: '1-10'
        }, { headers: { ...headers, 'x-session-token': sessionToken } });

        // 5. Polling Result
        let result;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const history = await axios.post('https://api.pixwith.ai/api/items/history', { tool_type: "1", tag: "", page: 0, page_size: 5 }, { headers: { ...headers, 'x-session-token': sessionToken } });
            result = history.data.data.items[0];
            if (result && result.status === 2) break;
        }

        if (!result || result.status !== 2) throw new Error("Processing failed or timeout from AI server.");

        const finalImageUrl = result.result_urls.find(u => !u.is_input).hd;

        // 6. Send Result & Clean Up
        await conn.sendMessage(from, {
            image: { url: finalImageUrl },
            caption: `🎨 *AI TRANSFORMATION DONE*\n\n📝 *Prompt:* ${q}\n\n> © PROVA MD ❤️`
        }, { quoted: m });

        fs.unlinkSync(tempPath);
        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        // Using direct text to avoid further 'key' errors if waitMsg failed
        await conn.sendMessage(from, { text: `❌ *Failed:* ${e.message}` }, { quoted: m });
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                          
