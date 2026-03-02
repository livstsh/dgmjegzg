const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const cheerio = require('cheerio');

// --- Updated Scraper Logic with Longer Timeout ---
async function pixwith(imgpath, prompt) {
    const tempSession = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).padEnd(32, '0') + '0';
    const username = Math.random().toString(36).slice(2);
    const email = `${username}@akunlama.com`;

    const _headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'x-session-token': tempSession
    };

    // 1. Request OTP
    await axios.post('https://api.pixwith.ai/api/user/send_email_code', { email }, { headers: _headers });

    // 2. Poll for OTP (Increased attempts for slow websites)
    let otp;
    for (let i = 0; i < 20; i++) { // 20 attempts x 6 seconds = 2 Minutes wait
        await new Promise(r => setTimeout(r, 6000));
        try {
            const res = await axios.get(`https://akunlama.com/api/v1/mail/list?recipient=${username}`);
            if (res.data && res.data.length > 0) {
                const r = await axios.get(`https://akunlama.com/api/v1/mail/getHtml?region=${res.data[0].storage.region}&key=${res.data[0].storage.key}`);
                const $ = cheerio.load(r.data);
                const match = $('body').text().match(/Verification code:\s*([A-Z0-9]+)/);
                if (match) { otp = match[1]; break; }
            }
        } catch (e) { continue; }
    }

    if (!otp) throw new Error('OTP Timeout! Website is very slow today. Please try again in 5 minutes.');

    // 3. Verify & Login
    const v = await axios.post('https://api.pixwith.ai/api/user/verify_email_code', { email, code: otp }, { headers: _headers });
    const ex = await axios.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyAoRsni0q79r831sDrUjUTynjAEG2ai-EY', { token: v.data.data.custom_token, returnSecureToken: true });
    const userRes = await axios.post('https://api.pixwith.ai/api/user/get_user', { token: ex.data.idToken, ref: "-1" }, { headers: _headers });
    const sessionToken = userRes.data.data.session_token;

    // 4. Upload Image
    const preUrl = await axios.post('https://api.pixwith.ai/api/chats/pre_url', { image_name: 'input.jpg', content_type: 'image/jpeg' }, { headers: { ..._headers, 'x-session-token': sessionToken } });
    const uploadData = preUrl.data.data;

    const form = new FormData();
    Object.entries(uploadData.fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', fs.createReadStream(imgpath));
    await axios.post(uploadData.url, form, { headers: form.getHeaders() });

    // 5. Generate
    await axios.post('https://api.pixwith.ai/api/items/create', {
        images: { image1: uploadData.fields.key },
        prompt,
        options: { prompt_optimization: true, num_outputs: 1, aspect_ratio: '0' },
        model_id: '1-10'
    }, { headers: { ..._headers, 'x-session-token': sessionToken } });

    // 6. Poll for HD Result
    let result;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const history = await axios.post('https://api.pixwith.ai/api/items/history', { tool_type: "1", tag: "", page: 0, page_size: 12 }, { headers: { ..._headers, 'x-session-token': sessionToken } });
        result = history.data.data.items[0];
        if (result && result.status === 2) break;
    }

    return result.result_urls.find(u => !u.is_input).hd;
}

// --- COMMAND ---
cmd({
    pattern: "blackskin",
    alias: ["hitamkan"],
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const q = m.quoted ? m.quoted : m;
    if (!/image/.test(q.mimetype || '')) return reply("📸 Please reply to an image!");

    const msgKey = m?.key || mek?.key || null;
    const filePath = `./tmp/${Date.now()}.jpg`;
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await conn.sendMessage(from, { text: "🏮 *AI is working... Waiting for OTP and Image processing.*" }, { quoted: m });

        const media = await q.download();
        fs.writeFileSync(filePath, media);

        const imageUrl = await pixwith(filePath, 'make the person skin color very dark black, cinematic lighting');

        await conn.sendMessage(from, { image: { url: imageUrl }, caption: "✅ *Processed by AI*" }, { quoted: m });
        if (waitMsg && waitMsg.key) await conn.sendMessage(from, { delete: waitMsg.key });

    } catch (e) {
        reply(`❌ *AI Error:* ${e.message}`);
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});
