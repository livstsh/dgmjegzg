const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// --- Configuration & Helpers ---
const API = 'https://api.unblurimage.ai';
const SITE = 'https://unblurimage.ai';
const CDN = 'https://cdn.unblurimage.ai';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getSerial() {
    try {
        const { data: html } = await axios.get(SITE + '/ai-unblur-video/', { timeout: 15000 });
        const sm = html.match(/src="([^"]*app\.[a-z0-9]+\.js)"/);
        if (sm) {
            let jsUrl = sm[1].startsWith('http') ? sm[1] : SITE + sm[1];
            const { data: js } = await axios.get(jsUrl, { timeout: 15000 });
            const m = js.match(/"product-serial"\s*:\s*"([a-f0-9]{32})"/i);
            if (m) return m[1];
        }
    } catch (e) { console.error("Serial Fetch Error:", e.message); }
    return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
}

// --- Main Command ---
cmd({
    pattern: "unblur",
    alias: ["enhancevid", "hdvideo", "upscalevid"],
    react: "🎬",
    desc: "AI Video Enhancer (Unblur & Upscale to 2K/4K)",
    category: "ai",
    use: ".unblur <reply video | link> [2k/4k]",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || "";
        const isVideo = mime.startsWith("video/");
        const isLink = q && q.match(/https?:\/\/[^\s]+/);

        if (!isVideo && !isLink) return reply("❌ Please reply to a video or provide a video link!");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const waitMsg = await reply("🎬 *AI VIDEO ENHANCER*\n\nStep 1: Downloading & Initializing Session...");

        // 1. Session Setup
        const serial = await getSerial();
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
        const commonHeaders = { 'product-serial': serial, 'user-agent': ua, 'Referer': SITE + '/' };

        // 2. Get Video Buffer
        let videoBuffer, ext;
        if (isVideo) {
            const stream = await downloadContentFromMessage(quoted.msg || quoted, "video");
            let chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            videoBuffer = Buffer.concat(chunks);
            ext = mime.split('/')[1] || 'mp4';
        } else {
            const res = await axios.get(isLink[0], { responseType: 'arraybuffer' });
            videoBuffer = Buffer.from(res.data);
            ext = isLink[0].split('.').pop().split('?')[0] || 'mp4';
        }

        // 3. Register & Upload to OSS
        const fileName = `${crypto.randomBytes(3).toString('hex')}_video.${ext}`;
        const formReg = new FormData();
        formReg.append('video_file_name', fileName);
        
        const regRes = await axios.post(`${API}/api/upscaler/v1/ai-video-enhancer/upload-video`, formReg, {
            headers: { ...commonHeaders, ...formReg.getHeaders() }
        });

        const { url: ossUrl, object_name: objectName } = regRes.data.result;
        await axios.put(ossUrl, videoBuffer, { headers: { 'Content-Type': `video/${ext}` } });

        // 4. Create Job
        const resType = q.includes('4k') ? '4k' : '2k';
        await conn.sendMessage(from, { text: `✅ Uploaded! Starting AI Enhancement (${resType})...`, edit: waitMsg.key });

        const formJob = new FormData();
        formJob.append('original_video_file', `${CDN}/${objectName}`);
        formJob.append('resolution', resType);
        formJob.append('is_preview', 'false');

        const jobRes = await axios.post(`${API}/api/upscaler/v2/ai-video-enhancer/create-job`, formJob, {
            headers: { ...commonHeaders, ...formJob.getHeaders() }
        });

        const jobId = jobRes.data.result.job_id;
        if (!jobId) throw new Error("Failed to create Job ID");

        // 5. Polling Result
        let resultUrl = null;
        for (let i = 0; i < 60; i++) { // Max 5 mins
            const poll = await axios.get(`${API}/api/upscaler/v2/ai-video-enhancer/get-job/${jobId}`, { headers: commonHeaders });
            if (poll.data?.result?.output_url) {
                resultUrl = poll.data.result.output_url;
                break;
            }
            process.stdout.write('.'); // Server console logging
            await sleep(5000);
        }

        if (!resultUrl) throw new Error("Enhancement Timeout! AI server is taking too long.");

        // 6. Send Final Result
        await conn.sendMessage(from, {
            video: { url: resultUrl },
            caption: `🎬 *AI VIDEO ENHANCED*\n\n📈 *Resolution:* ${resType}\n🛠️ *Model:* UnblurImage AI\n\n> © PROVA-MD ❤️`,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Failed:* ${e.message}`);
    }
});
            
