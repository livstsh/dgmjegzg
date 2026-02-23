const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "play4",
    alias: ["song", "music", "ytmp3"],
    react: "🎶",
    desc: "Download YouTube Audio via Arslan API",
    category: "download",
    use: ".play <song name>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube link!");

        // Search Reaction
        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Step 1: YouTube Search
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found for your query.");
        const video = search.videos[0];
        const videoUrl = video.url;

        // Step 2: Fetch from Arslan API
        const apiUrl = `https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // API Response Check (Assuming 'data.download_url' or 'data.result')
        const dlUrl = data.download_url || data.result || data.url;

        if (!dlUrl) {
            return reply("❌ API failed to provide a download link. Try again later.");
        }

        // Step 3: Send Audio Info
        let caption = `🎶 *PROVA-MD PLAYER*\n\n`;
        caption += `📌 *Title:* ${video.title}\n`;
        caption += `🕒 *Duration:* ${video.timestamp}\n`;
        caption += `👁‍🗨 *Views:* ${video.views.toLocaleString()}\n`;
        caption += `🔗 *Link:* ${videoUrl}\n\n`;
        caption += `> © PROVA-MD ❤️`;

        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: caption
        }, { quoted: mek });

        // Step 4: Send Audio File (Fixed PTT/Voice Note)
        await conn.sendMessage(from, { react: { text: '📥', key: mek.key } });

        // Sending as a standard audio file first
        await conn.sendMessage(from, {
            audio: { url: dlUrl },
            mimetype: "audio/mpeg",
            fileName: `${video.title}.mp3`
        }, { quoted: mek });

        // OPTIONAL: Sending as Voice Note (PTT)
        // Agat aapko sirf voice note chahiye toh upar wala audio block delete kar dein
        await conn.sendMessage(from, {
            audio: { url: dlUrl },
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Play Error:", e);
        reply(`❌ Error: ${e.message || "API connection failed"}`);
    }
});
            
