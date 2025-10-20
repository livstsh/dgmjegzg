// ✅ Coded by DR KAMRAN for KAMRAN MD

const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "drama",
    alias: ["video", "song", "ytv"],
    desc: "Download YouTube videos",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.video alone marshmello`");

        let url = q;
        let videoInfo = null;
        
        // 🔍 Check if query is a URL or title
        if (q.startsWith('http://') || q.startsWith('https://')) {
            // It's a URL - use directly and fetch info
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            // Fetch video info for URL
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            const searchFromUrl = await yts({ videoId: videoId });
            videoInfo = searchFromUrl;
        } else {
            // It's a title - search for video
            const search = await yts(q);
            if (!search.videos || search.videos.length === 0) {
                return await reply("❌ No video results found!");
            }
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        // Helper function to extract video ID from URL
        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // 📸 Send thumbnail with title and downloading status
        if (videoInfo) {
            await conn.sendMessage(from, {
                image: { url: videoInfo.thumbnail },
                caption: `🎬 *${videoInfo.title}*\n⏰ *Duration:* ${videoInfo.timestamp}\n👀 *Views:* ${videoInfo.views}\n📥 Status: Downloading Please Wait...\n\n⏳ This may take a few seconds...`
            }, { quoted: mek });
        }

        // 🎬 Fetch video from API - CORRECTED API STRUCTURE
        const api = `https://universe-api-mocha.vercel.app/api/youtube/download?url=${encodeURIComponent(url)}&quality=360`;
        const res = await axios.get(api);
        const data = res.data;

        // Check the actual API response structure
        if (!data?.status) {
            return await reply("❌ Failed to fetch download link from API!");
        }

        // Use the correct response structure based on your example
        const downloadUrl = data.download;
        const metadata = data.metadata;

        if (!downloadUrl) {
            return await reply("❌ No download URL found in API response!");
        }

        // 🧾 Send video with proper error handling
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🎬 *${metadata?.title || videoInfo?.title || 'YouTube Video'}*\n📥 *Quality:* ${data.quality || '360'}p\n🕒 *Duration:* ${metadata?.duration || videoInfo?.duration?.seconds || 'N/A'}s\n\n✅ KAMRAN - MD Download Completed!\n\n> Powered by *DrKamran ⚡*`
        }, { quoted: mek });

        // ✅ React success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytmp4:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
