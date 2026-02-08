const { cmd } = require('../command');
const axios = require('axios');

// Store play sessions
const playSessions = new Map();

/**
 * Universal reply context getter (VERY IMPORTANT)
 */
function getReplyContext(mek) {
    return (
        mek.message?.extendedTextMessage?.contextInfo ||
        mek.message?.imageMessage?.contextInfo ||
        mek.message?.videoMessage?.contextInfo
    );
}

/**
 * Downloader API
 */
async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

cmd({
    pattern: "play",
    desc: "YouTube play downloader",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        if (!args[0]) return reply("❌ Give song name or YouTube link");

        const query = args.join(" ");

        // Search video
        const search = await axios.get(`https://kyzoymd-downloader.vercel.app/api/search?q=${encodeURIComponent(query)}`);
        const video = search.data.results[0];

        if (!video) return reply("❌ No results found");

        const caption = `
🎬 *Title:* ${video.title}
⏱ *Duration:* ${video.duration}
👁 *Views:* ${video.views}

🔗 ${video.url}

━━━━━━━━━━━━━━━
Reply the number below:

① Download Video (MP4)
② Download Audio (MP3)

© Powered By PROVA-MD
`;

        // Send image menu
        const sent = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption
        }, { quoted: mek });

        // Save session
        playSessions.set(sent.key.id, video.url);

    } catch (e) {
        console.log(e);
        reply("❌ Error occurred");
    }
});


/**
 * Reply handler (AUTO)
 */
cmd({
    on: "text"
}, async (conn, mek, m, { from, body, reply }) => {
    try {
        const ctx = getReplyContext(mek);
        const contextId = ctx?.stanzaId;

        if (!contextId) return;
        if (!playSessions.has(contextId)) return;

        const url = playSessions.get(contextId);
        const choice = body.trim();

        reply("⏳ Downloading...");

        const data = await aioDownload(url);

        if (choice === "1") {
            // MP4
            await conn.sendMessage(from, {
                video: { url: data.video },
                caption: "✅ Video Downloaded"
            }, { quoted: mek });
        }

        else if (choice === "2") {
            // MP3
            await conn.sendMessage(from, {
                audio: { url: data.audio },
                mimetype: "audio/mpeg"
            }, { quoted: mek });
        }

        playSessions.delete(contextId);

    } catch (e) {
        console.log(e);
    }
});
