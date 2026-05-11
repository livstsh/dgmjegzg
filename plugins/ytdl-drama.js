// ✅ Coded by LUCKY-HACKER   for LUCK -MD (STYLISH EDIT)

const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

function getVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

cmd({
    pattern: "drama",
    alias: ["ep", "episode"],
    desc: "Download YouTube videos as document",
    category: "download",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) {
            return reply(`🎬 Usage: ${prefix}drama <name or link>`);
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        let url = q;
        let videoInfo;

        // 🔎 URL or search
        if (q.startsWith("http")) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be"))
                return reply("❌ Invalid YouTube URL!");

            const id = getVideoId(q);
            if (!id) return reply("❌ Invalid YouTube link!");

            videoInfo = await yts({ videoId: id });
            url = videoInfo.url;
        } else {
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No results found!");
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        // 🎨 Stylish Preview Card
        const preview = `
╭━━━〔 🎬 *DRAMA DOWNLOADER* 〕━━━⬣
┃
┃ 🎥 *Title:* ${videoInfo.title}
┃ 📺 *Channel:* ${videoInfo.author.name}
┃ ⏱️ *Duration:* ${videoInfo.timestamp}
┃ 🔗 ${videoInfo.url}
┃
┣━━━━━━━━━━━━━━━━━━⬣
┃ ⏳ *Downloading your drama file...*
╰━━━━━━━━━━━━━━━━━━⬣
> © Powered By LUCKY-MD
`;

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: preview
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // ⚙️ API call
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result?.mp4) {
            return reply("❌ Failed to fetch download link!");
        }

        const vid = data.result;

        // 📦 Send as document
        await conn.sendMessage(from, {
            document: { url: vid.mp4 },
            fileName: `${vid.title}.mp4`,
            mimetype: "video/mp4",
            caption: `🎬 *${vid.title}*\n\n🚀 Enjoy your episode!`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("⚠️ Something went wrong!");
    }
});
