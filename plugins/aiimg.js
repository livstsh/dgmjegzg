const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const cheerio = require('cheerio');

// --- Helper Functions (Logic from your script) ---
const _headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'origin': 'https://pixwith.ai',
    'referer': 'https://pixwith.ai/'
};

const gensesi = () => {
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s + '0';
};

const genmail = () => {
    let s = '';
    for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 36).toString(36);
    return s + '@akunlama.com';
};

// --- Main Scraper Logic ---
async function pixwith(imgpath, prompt) {
    const tempSession = gensesi();
    const email = genmail();
    const username = email.split('@')[0];

    // Request OTP
    await axios.post('https://api.pixwith.ai/api/user/send_email_code', { email }, { headers: { ..._headers, 'x-session-token': tempSession } });

    // Polling for OTP
    let otp;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const res = await axios.get(`https://akunlama.com/api/v1/mail/list?recipient=${username}`);
        if (res.data && res.data.length > 0) {
            const r = await axios.get(`https://akunlama.com/api/v1/mail/getHtml?region=${res.data[0].storage.region}&key=${res.data[0].storage.key}`);
            const $ = cheerio.load(r.data);
            const match = $('body').text().match(/Verification code:\s*([A-Z0-9]+)/);
            if (match) { otp = match[1]; break; }
        }
    }

    if (!otp) throw new Error('OTP Timeout! Website is slow.');

    // Verify and Get Token
    const v = await axios.post('https://api.pixwith.ai/api/user/verify_email_code', { email, code: otp }, { headers: { ..._headers, 'x-session-token': tempSession } });
    const ex = await axios.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyAoRsni0q79r831sDrUjUTynjAEG2ai-EY', { token: v.data.data.custom_token, returnSecureToken: true });
    const l = await axios.post('https://api.pixwith.ai/api/user/get_user', { token: ex.data.idToken, ref: "-1" }, { headers: { ..._headers, 'x-session-token': tempSession } });
    const sessionToken = l.data.data.session_token;

    // Upload and Process
    const preUrl = await axios.post('https://api.pixwith.ai/api/chats/pre_url', { image_name: 'input.jpg', content_type: 'image/jpeg' }, { headers: { ..._headers, 'x-session-token': sessionToken } });
    const uploadData = preUrl.data.data;

    const form = new FormData();
    Object.entries(uploadData.fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', fs.createReadStream(imgpath));
    await axios.post(uploadData.url, form, { headers: form.getHeaders() });

    await axios.post('https://api.pixwith.ai/api/items/create', {
        images: { image1: uploadData.fields.key },
        prompt,
        options: { prompt_optimization: true, num_outputs: 1, aspect_ratio: '0' },
        model_id: '1-10'
    }, { headers: { ..._headers, 'x-session-token': sessionToken } });

    // Poll for Result
    let result;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const history = await axios.post('https://api.pixwith.ai/api/items/history', { tool_type: "1", tag: "", page: 0, page_size: 12 }, { headers: { ..._headers, 'x-session-token': sessionToken } });
        result = history.data.data.items[0];
        if (result && result.status === 2) break;
    }

    return result.result_urls.find(u => !u.is_input).hd;
}

// --- BOT COMMAND ---
cmd({
    pattern: "hitamkan",
    alias: ["blackskin", "darken"],
    react: "⏳",
    desc: "AI to darken skin color in images.",
    category: "ai",
    use: "Reply to an image",
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
    const msgKey = m?.key || mek?.key || null;
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    if (!/image/.test(mime)) return reply("📸 Please reply to an image!");

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const filePath = path.join(tmpDir, `${Date.now()}.jpg`);

    try {
        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        let waitMsg = await conn.sendMessage(from, { text: "🏮 *AI is processing your image...* (This takes ~1 min)" }, { quoted: m });

        const media = await q.download();
        fs.writeFileSync(filePath, media);

        const imageUrl = await pixwith(filePath, 'make the person skin color very dark black, keep everything else exactly the same');

        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { delete: waitMsg.key });
        }

        await conn.sendMessage(from, { 
            image: { url: imageUrl }, 
            caption: "✅ *AI Process Completed!*" 
        }, { quoted: m });

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *AI Error:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});


