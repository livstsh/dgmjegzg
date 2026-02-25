const { cmd } = require('../command');
const fetch = require('node-fetch');
const { fileTypeFromBuffer } = require('file-type');

cmd({
    pattern: "aio",
    alias: ["dl", "aiodl"],
    react: "📥",
    desc: "All-in-one downloader for Instagram, TikTok, etc.",
    category: "downloader",
    use: ".aio <link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    // FIX 1: Safe Message Key to prevent "undefined reading key" crash
    const msgKey = (m && m.key) ? m.key : (mek && mek.key ? mek.key : null);

    try {
        if (!text) return reply(`*Contoh: ${usedPrefix + command} https://instagram.com/...*`);

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });

        const api = `https://api.apocalypse.web.id/download/aio?url=${encodeURIComponent(text)}`;

        let res;
        let attempts = 0;
        const maxAttempts = 3;

        // Retry logic
        while (attempts < maxAttempts) {
            try {
                res = await fetch(api);
                if (res.ok) break;
            } catch (e) {}
            attempts++;
            if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 1000));
        }

        if (!res || !res.ok) {
            return reply(`🍂 * Server API tidak merespon. (Coba lagi nanti)*`);
        }

        const json = await res.json();
        const data = json?.result;

        if (!data || !Array.isArray(data.medias)) {
            return reply(`🍂 *Media tidak ditemukan.*`);
        }

        const caption = `*AIO DOWNLOADER BY PROVA-MD*\n\n` +
            `*Source:* ${data.source || '-'}\n` +
            `*Author:* ${data.author || data.owner?.username || '-'}\n` +
            `*Title:* ${data.title ? data.title.trim() : '-'}\n` +
            `*URL:* ${text}\n\n` +
            `> © Powered by Gemini AI ❤️`;

        const medias = data.medias.filter(v => v.url);
        const images = medias.filter(v => v.type === 'image');

        // Video selection logic
        let video = medias.find(v =>
            v.type === 'video' &&
            (v.quality === 'no_watermark' || v.quality === 'hd_no_watermark')
        );
        if (!video) video = medias.find(v => v.type === 'video');

        let audio = medias.find(v => v.type === 'audio');

        // Sending Media
        if (images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await conn.sendMessage(from, {
                    image: { url: images[i].url },
                    caption: i === 0 ? caption : ''
                }, { quoted: m });
            }
        }

        if (video) {
            await conn.sendMessage(from, {
                video: { url: video.url },
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: m });
        } else if (audio) {
            try {
                await conn.sendMessage(from, {
                    audio: { url: audio.url },
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: m });
            } catch (e) {
                const audioRes = await fetch(audio.url);
                const buffer = Buffer.from(await audioRes.arrayBuffer());
                const type = await fileTypeFromBuffer(buffer);
                await conn.sendMessage(from, {
                    audio: buffer,
                    mimetype: type?.mime || 'audio/mpeg',
                    ptt: false
                }, { quoted: m });
            }
        }

        if (!video && images.length === 0 && !audio) {
            await reply(caption);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`🍂 *Terjadi kesalahan saat memproses URL.*`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
    
