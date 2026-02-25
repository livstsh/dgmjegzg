const { cmd } = require('../command');
const axios = require('axios');

/**
 * YouTube Downloader Scraper Logic
 */
async function oceansaver({ url, mode = 'mp3', type = 128 }) {
    try {
        const { data: dl } = await axios.get('https://p.lbserver.xyz/ajax/download.php', {
            params: {
                copyright: '0',
                ...(mode === 'mp3' ? { format: 'mp3', audio_quality: String(type) } : {}),
                ...(mode === 'mp4' ? { format: String(type) } : {}),
                url: url,
                api: '30de256ad09118bd6b60a13de631ae2cea6e5f9d'
            }
        });

        const prog = await new Promise((resolve, reject) => {
            let retries = 40;
            const interval = setInterval(async () => {
                try {
                    const { data: res } = await axios.get(dl.progress_url);
                    if (res.success && res.progress >= 1000) {
                        clearInterval(interval);
                        resolve({
                            status: true,
                            url: res.download_url,
                            ...(res.alternative_download_urls ? { alternative: res.alternative_download_urls } : {})
                        });
                    }
                    if (--retries <= 0) {
                        clearInterval(interval);
                        reject(new Error("Timeout: Download link generation failed."));
                    }
                } catch (e) {
                    clearInterval(interval);
                    reject(e);
                }
            }, 1500);
        });

        return { status: true, ...dl.info, ...prog };
    } catch (e) {
        return { status: false, msg: e.message };
    }
}

// --- PROVA-MD Command Registration ---
cmd({
    pattern: "ytmp3",
    alias: ["ytmp4", "ytsong", "ytvid"],
    react: "📥",
    desc: "Download YouTube Audio or Video",
    category: "downloader",
    use: ".ytmp3 <link> | .ytmp4 <link>, <quality>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, command }) => {
    // FIX 1: Safe Message Key to avoid "reading key" error
    const msgKey = (m && m.key) ? m.key : (mek && mek.key ? mek.key : null);

    try {
        if (!text || !text.includes('youtu')) {
            return reply(command === "ytmp3" ? '⚠️ Masukan Link YouTube\n\nContoh: .ytmp3 <link>' : '⚠️ Masukan Link YouTube aur format,\n\nContoh: .ytmp4 <link>, 720');
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        const isVideo = (command === "ytmp4" || command === "ytvid");
        let downloadConfig;

        if (isVideo) {
            const [link, f] = text.split(', ');
            const format = f || "720";
            const allowedFormats = ["144", "240", "360", "720", "1080"];
            if (!allowedFormats.includes(format)) return reply(`⚠️ Format Tersedia: ${allowedFormats.join(', ')}`);
            downloadConfig = { url: link, mode: "mp4", type: format };
        } else {
            downloadConfig = { url: text, mode: 'mp3', type: 128 };
        }

        // Fetching Data
        const res = await oceansaver(downloadConfig);
        if (!res.status) throw new Error(res.msg);

        // Downloading to Buffer
        const { data: buffer } = await axios.get(res.url, { responseType: 'arraybuffer' });
        const fileSizeMB = buffer.length / (1024 * 1024);
        const fileName = `${encodeURIComponent(res.title)}.${isVideo ? 'mp4' : 'mp3'}`;

        if (isVideo) {
            // Document mode if file is large (>30MB)
            if (fileSizeMB > 30) {
                await conn.sendMessage(from, { document: buffer, mimetype: 'video/mp4', fileName: fileName }, { quoted: m });
            } else {
                await conn.sendMessage(from, { video: buffer, mimetype: 'video/mp4', caption: res.title }, { quoted: m });
            }
        } else {
            // Document mode if file is large (>100MB)
            if (fileSizeMB > 100) {
                await conn.sendMessage(from, { document: buffer, mimetype: 'audio/mpeg', fileName: fileName }, { quoted: m });
            } else {
                await conn.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', fileName: fileName }, { quoted: m });
            }
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
        reply(`❌ Error: ${e.message || "Gomene, try again later."}`);
    }
});
                                         
