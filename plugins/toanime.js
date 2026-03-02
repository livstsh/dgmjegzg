const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
    pattern: "hdvideo2",
    alias: ["hdv2", "enhance2"],
    react: "🎬",
    desc: "Enhance video quality to HD/4K.",
    category: "tools",
    use: ".hdvideo 4k (reply video)",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, command, prefix }) => {
    
    const msgKey = m?.key || mek?.key || null;

    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        const p = prefix || ".";

        // Logic for extracting resolution and URL from text
        const args = text ? text.trim().split(/\s+/) : [];
        const urlArg = args.find(v => /^https?:\/\//i.test(v)) || "";
        const resolusi = (args.find(v => /^(hd|full-hd|2k|4k)$/i.test(v)) || "hd").toLowerCase();

        let videoUrl = urlArg;

        if (!videoUrl) {
            if (!/video/.test(mime)) {
                return reply(`*🎬 HD VIDEO ENHANCER*\n\nReply to a *video* or provide a URL.\n\n*Usage:* ${p}${command} <resolusi>\n*Resolutions:* hd, full-hd, 2k, 4k`);
            }

            if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
            let waitMsg = await conn.sendMessage(from, { text: "📥 *Downloading and uploading video...*" }, { quoted: m });

            // Media Download
            const buffer = await q.download();
            
            // Upload to Uguu.se
            const form = new FormData();
            form.append('files[]', buffer, { filename: 'video.mp4' });

            const upRes = await axios.post('https://uguu.se/upload.php', form, {
                headers: { ...form.getHeaders() }
            });

            if (!upRes.data?.files?.[0]?.url) throw new Error("Video upload failed. Try again.");
            videoUrl = upRes.data.files[0].url;
            
            if (waitMsg && waitMsg.key) await conn.sendMessage(from, { delete: waitMsg.key });
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '⚙️', key: msgKey } });
        await conn.sendMessage(from, { text: `🚀 *Enhancing to ${resolusi.toUpperCase()}...* This may take a while.` }, { quoted: m });

        // API Call to Nexray
        const apiUrl = `https://api.nexray.web.id/tools/v1/hdvideo?url=${encodeURIComponent(videoUrl)}&resolusi=${encodeURIComponent(resolusi)}`;
        const res = await axios.get(apiUrl, { timeout: 300000 }); // 5 min timeout for heavy processing

        if (!res.data?.status || !res.data?.result) throw new Error("API failed to process video.");

        // Sending Result
        await conn.sendMessage(from, { 
            video: { url: res.data.result }, 
            caption: `✅ *HD VIDEO SUCCESS*\n\n*Resolution:* ${resolusi.toUpperCase()}\n\n> © ᴘʀᴏᴠᴀ-ᴍᴅ ❤️` 
        }, { quoted: m });

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                          
