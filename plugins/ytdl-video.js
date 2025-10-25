const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "song2",
    alias: ["play2", "music2"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: "<query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube URL!");

        // Get YouTube URL from query if needed
        let videoUrl = q;
        if (!q.match(/(youtube\.com|youtu\.be)/)) {
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
        }

        await reply("⏳ Processing your request...");

        // API Request with proper error handling
        const apiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}&apikey=adb523bb-74e0-4aa0-a0f2-31a41ab56cf1`;
        
        const { data } = await axios.get(apiUrl, {
            validateStatus: function (status) {
                return status < 500; // Reject only if status is 500 or above
            }
        });

        if (!data?.download_url) {
            if (data?.message) {
                return reply(`❌ API Error: ${data.message}`);
            }
            return reply("❌ Failed to get download link from API");
        }

        // Send the audio file
        await conn.sendMessage(from, {  
            audio: { url: data.download_url },  
            mimetype: 'audio/mpeg',
            fileName: (data.title || "audio").replace(/[^\w\s.-]/g, '') + '.mp3',
            contextInfo: {  
                externalAdReply: {  
                    title: data.title || "YouTube Audio",
                    body: data.author ? `By ${data.author}` : "Downloaded via Kaiz API",
                    mediaType: 2,
                    mediaUrl: videoUrl
                }  
            }  
        }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);
        if (error.response?.data?.message) {
            reply(`❌ API Error: ${error.response.data.message}`);
        } else {
            reply(`❌ Error: ${error.message}`);
        }
    }
});


cmd({
    pattern: "ytmp3",
    alias: ["song3", "play3"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: "<YouTube link or search query>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a YouTube link or search query");

        // Get YouTube URL
        let videoUrl = q;
        if (!q.match(/youtu(be\.com|\.be)/)) {
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No videos found");
            videoUrl = search.videos[0].url;
        }

        await reply("⬇️ Downloading audio...");

        // API request
        const apiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}&apikey=adb523bb-74e0-4aa0-a0f2-31a41ab56cf1`;
        const { data } = await axios.get(apiUrl);

        if (!data?.download_url) {
            return reply("❌ Failed to get download URL");
        }

        // Send as document for better quality
        await conn.sendMessage(from, {
            document: { url: data.download_url },
            fileName: `${data.title || 'audio'}.mp3`.replace(/[^\w\s.-]/g, ''),
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: data.title || "YouTube Audio",
                    body: `Duration: ${data.duration || 'N/A'}`,
                    thumbnail: await axios.get(data.thumbnail || '', { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);
        reply(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
});
      
