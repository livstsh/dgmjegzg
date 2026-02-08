const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

// Store pending song replies
const pendingSongs = new Map();

// ---------------- SONG COMMAND ----------------

cmd({
    pattern: "song",
    alias: ["audio", "ytmp3"],
    react: "🎵",
    desc: "YouTube MP3 Downloader",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, prefix }) => {
    try {
        if (!q) return reply(`❓ Usage: ${prefix}song <name/link>`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");

        const video = search.videos[0];

        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(video.url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data.data?.url) return reply("❌ API error!");

        const caption = `
╭━━━〔 🎧 *PROVA SONG DOWNLOADER* 〕━━━⬣
┃
┃ 🎼 *Title:* ${video.title}
┃ ⏱️ *Duration:* ${video.timestamp}
┃ 🔗 ${video.url}
┃
┣━━━━━━━━━━━━━━━━━━⬣
┃ Reply with number:
┃
┃ ❶ Audio (MP3)
┃ ❷ Document File
┃ ❸ Voice Note (PTT)
┃
╰━━━━━━━━━━━━━━━━━━⬣
> © Powered By ᴘʀᴏᴠᴀ-ᴍᴅ
`;

        const sent = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption
        }, { quoted: mek });

        // Save reply context
        pendingSongs.set(sent.key.id, {
            title: video.title,
            url: data.data.url
        });

    } catch (e) {
        console.error(e);
        reply("❌ Error occurred!");
    }
});


// ---------------- GLOBAL REPLY HANDLER ----------------

cmd({
    on: "text"
},
async (conn, mek, m, { from, body, reply }) => {
    try {
        const contextId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (!contextId) return;

        const songData = pendingSongs.get(contextId);
        if (!songData) return;

        const choice = body.trim();

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        switch (choice) {
            case "1":
            case "❶":
                await conn.sendMessage(from, {
                    audio: { url: songData.url },
                    mimetype: "audio/mpeg"
                }, { quoted: mek });
                break;

            case "2":
            case "❷":
                await conn.sendMessage(from, {
                    document: { url: songData.url },
                    fileName: `${songData.title}.mp3`,
                    mimetype: "audio/mpeg"
                }, { quoted: mek });
                break;

            case "3":
            case "❸":
                await conn.sendMessage(from, {
                    audio: { url: songData.url },
                    mimetype: "audio/mp4",
                    ptt: true
                }, { quoted: mek });
                break;

            default:
                return reply("❌ Reply only with 1, 2 or 3");
        }

        pendingSongs.delete(contextId);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
    }
});
