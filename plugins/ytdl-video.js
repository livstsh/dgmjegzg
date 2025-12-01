// ✅ Coded by DR KAMRAN for KAMRAN MD
// ⚙️ API: https://jawad-tech.vercel.app/download/ytdl?url=

const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "drama",
    alias: ["ep", "episode"],
    desc: "Download YouTube videos interactively (Document or Video format).",
    category: "download",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.drama kabhi main kabhi tum ep5`");

        let url = q;
        let videoInfo = null;

        // --- Helper function to get video ID (defined here to be self-contained) ---
        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // 🔍 Detect URL or Search by Title
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            // Using yts search for metadata from videoId
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
            url = videoInfo.url;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            url = videoInfo.url;
        }

        // 🖼️ Send thumbnail preview and menu
        const menuCaption = `
*🎬 DRAMA DOWNLOADER*

🎞️ *Title:* ${videoInfo.title}
📺 *Channel:* ${videoInfo.author.name}
🕒 *Duration:* ${videoInfo.timestamp}

🔢 *Kripya format select karne ke liye number se reply karein:*
1 - VIDEO (Standard MP4 Media) 🎥
2 - DOCUMENT (File MP4) 📁

*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const vv = await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: menuCaption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });


        // --- LISTEN FOR USER'S REPLY ---
        conn.ev.on("messages.upsert", async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            
            // Check if it is a reply to the menu we just sent
            if (
                !msg.message || 
                !msg.message.extendedTextMessage || 
                msg.message.extendedTextMessage.contextInfo.stanzaId !== vv.key.id
            ) return;

            const selectedOption = msg.message.extendedTextMessage.text.trim();
            
            try {
                
                const validOptions = ["1", "2"]; 
                if (!validOptions.includes(selectedOption)) {
                    await conn.sendMessage(from, { react: { text: "❓", key: msg.key } });
                    return await reply("Kripya sahi option (1 ya 2) se reply karein."); 
                }

                await conn.sendMessage(from, { react: { text: "⏳", key: msg.key } });

                const sendAsDocument = selectedOption === "2";
                const mediaType = sendAsDocument ? 'Document' : 'Video';
                
                // ⚙️ Fetch from DR KAMRAN API
                const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.result?.mp4) {
                    await conn.sendMessage(from, { react: { text: "❌", key: msg.key } });
                    return await reply("❌ Failed to fetch download link! Try again later.");
                }

                const vid = data.result;
                
                // 📦 Send as requested format
                const mediaKey = sendAsDocument ? 'document' : 'video';
                
                await conn.sendMessage(from, {
                    [mediaKey]: { url: vid.mp4 },
                    fileName: `${vid.title} (${mediaType}).mp4`,
                    mimetype: 'video/mp4',
                    caption: `✅ *${vid.title}*\n*Format:* ${mediaType}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
                }, { quoted: msg });

                // ✅ React success
                await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

            } catch (error) {
                console.error("❌ Download error in .drama command:", error);
                await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
                await reply(`⚠️ Something went wrong during download! Try again later.`);
            }
        });

    } catch (e) {
        console.error("❌ Error in .drama command:", e);
        await reply(`⚠️ *Error:* ${e.message || "Unknown error occurred"}`);
    }
});
