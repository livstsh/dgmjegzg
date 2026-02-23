//---------------------------------------------------------------------------
// KAMRAN-MD - YT MP3 DOWNLOADER
//---------------------------------------------------------------------------

const axios = require('axios');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
    pattern: "ytmp3",
    desc: "Download YouTube video as MP3",
    category: "downloader",
    use: ".ytmp3 <YouTube link>",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) 
            return reply("❌ Provide YouTube link.\nExample: .ytmp3 https://youtu.be/xxxx");

        const ytUrl = text.trim();
        const apiUrl = `https://api.dyysilence.biz.id/api/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}&quality=256`;

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("🔎 Fetching MP3...");

        const res = await fetch(apiUrl);
        const json = await res.json();

        if (!json || !json.result || !json.result.download) 
            return reply("❌ Failed to get MP3 link.");

        const mp3Url = json.result.download;

        // Send MP3
        await conn.sendMessage(from, {
            audio: { url: mp3Url },
            fileName: `${json.result.title || "audio"}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("YTMP3 ERROR:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error while downloading MP3.");
    }
});
