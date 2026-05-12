const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
};

async function getJawadDownload(url) {
    try {
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api, AXIOS_DEFAULTS);
        if (!res.data || !res.data.status || !res.data.result) return null;
        return res.data.result.mp4;
    } catch {
        return null;
    }
}

cmd({
    pattern: "video",
    alias: ["mp4"],
    desc: "Download video by name",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (sock, message, m, { q }) => {

    const query = q ? q.trim() : "";
    if (!query) {
        return await sock.sendMessage(
            message.chat,
            { text: "❌ Please provide a song/video name!" },
            { quoted: message }
        );
    }

    try {
        const search = await yts(query);
        const video = search.videos[0];

        if (!video) {
            return sock.sendMessage(
                message.chat,
                { text: "❌ Video not found! Please write a valid name." },
                { quoted: message }
            );
        }

        const footer = "⚡ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴜᴄᴋʏ-ᴍᴅ";

        const captionText = `*${video.title}*

🎥 Channel: ${video.author.name}
👁️ Views: ${video.views.toLocaleString()}
⏳ Duration: ${video.timestamp}

> *${footer}*`;

        await sock.sendMessage(message.chat, {
            image: { url: video.thumbnail },
            caption: captionText
        }, { quoted: message });

        const downUrl = await getJawadDownload(video.url);

        if (!downUrl) {
            return sock.sendMessage(
                message.chat,
                { text: "❌ Video is not available right now. Please try again!" },
                { quoted: message }
            );
        }

        await sock.sendMessage(message.chat, {
            react: { text: "✅", key: message.key }
        });

        await sock.sendMessage(message.chat, {
            video: { url: downUrl },
            mimetype: "video/mp4",
            caption: `*${video.title}*

> *${footer}*`
        }, { quoted: message });

    } catch (err) {
        console.log("Unexpected Error:", err);
        await sock.sendMessage(
            message.chat,
            { text: "❌ Something went wrong! Please try again." },
            { quoted: message }
        );
    }
});
