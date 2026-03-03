const { cmd } = require('../command'); // Aapke bot ka command handler
const axios = require('axios');

// Download logic function
async function aioDownload(url) {
  const res = await axios.get(
    `https://savevideoid.vercel.app/api/download?url=${encodeURIComponent(url)}`
  );
  return res.data;
}

cmd({
    pattern: "aio",
    alias: ["dl", "down"],
    react: "📥",
    desc: "Download video/audio from various platforms.",
    category: "downloader",
    use: ".aio https://link",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    if (!text) return reply(`Contoh:\n${usedPrefix}${command} https://link`);

    try {
        await reply("⏳ *Downloading media, please wait...*");

        const data = await aioDownload(text);
        if (!data.success) return reply("❌ *Gagal download!*");

        const results = data.results || [];
        if (!results.length) return reply("❌ *Media tidak ditemukan*");

        for (let r of results) {
            let videoUrl = r.hd_url || r.download_url;
            let audioUrl = r.music;
            let thumb = r.thumbnail;

            let caption = `📥 *PROVA-MD AIO Downloader*\n\n`;
            caption += `🌐 *Platform:* ${data.platform}\n`;
            caption += `📌 *Title:* ${r.title || "-"}\n`;
            caption += `⏱ *Duration:* ${r.duration || "-"} sec\n`;
            caption += `🔗 *Source:* ${data.original_url}\n\n`;
            caption += `> © ᴘʀᴏᴠᴀ-ᴍᴅ ꜱʏꜱᴛᴇᴍ 🛡️`;

            // ================= VIDEO =================
            if (videoUrl) {
                await conn.sendMessage(from, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });
            }

            // ================= AUDIO =================
            if (audioUrl) {
                await conn.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${r.title || 'audio'}.mp3`
                }, { quoted: mek });
            }

            // ================= THUMBNAIL =================
            if (thumb && !videoUrl) { // Agar video nahi hai toh thumb bhejein
                await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: "🖼 *Thumbnail*"
                }, { quoted: mek });
            }
        }

    } catch (e) {
        console.error(e);
        reply("❌ *Error AIO Downloader. API may be down.*");
    }
});
      
