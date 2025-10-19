/*const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "song",
    alias: ["play", "music"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: "<query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube URL!");

        let videoUrl, title, thumbnail;

        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("> ⏳ Processing your request...");

        const apiKeys = [
            "f642c433-9f7d-4534-9437-abeffb42579f",
            "70274fdf-52c5-4eaf-a95b-14da69559e96",
            "e74518f3-a81f-4b55-be54-4a52f736fa23",
            "16ac0f6e-8b00-4195-ac10-ea742f262ec2",
            "a6b16fea-f3ba-41ab-98f2-e3660552537f",
            "adb523bb-74e0-4aa0-a0f2-31a41ab56cf1"
        ];

        let audioData = null;

        for (const key of apiKeys) {
            try {
                const url = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=${key}`;
                const { data } = await axios.get(url);
                if (data.download_url) {
                    audioData = data;
                    break;
                }
            } catch (err) {
                // Try next key
                continue;
            }
        }

        if (!audioData) return reply("❌ All API keys failed or limit exceeded!");

        await conn.sendMessage(from, {
            audio: { url: audioData.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${audioData.title}.mp3`.replace(/[^\w\s.-]/g, ''),
            contextInfo: {
                externalAdReply: {
                    title: audioData.title,
                    body: `🏮 Downloaded By Subzero 🏮`,
                    thumbnail: await axios.get(audioData.thumbnail || thumbnail, { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Song download error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
*/

const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "song",
    alias: ["play", "music"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: "<query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube URL!");

        let videoUrl, title, thumbnail;

        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("⏳ Processing your request...");

        const apiKeys = [
            "f642c433-9f7d-4534-9437-abeffb42579f",
            "70274fdf-52c5-4eaf-a95b-14da69559e96",
            "e74518f3-a81f-4b55-be54-4a52f736fa23",
            "16ac0f6e-8b00-4195-ac10-ea742f262ec2",
            "a6b16fea-f3ba-41ab-98f2-e3660552537f",
            "adb523bb-74e0-4aa0-a0f2-31a41ab56cf1"
        ];

        let audioData = null;

        for (const key of apiKeys) {
            try {
                const url = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=${key}`;
                const { data } = await axios.get(url);
                if (data.download_url) {
                    audioData = data;
                    break;
                }
            } catch (err) {
                // Try next key
                continue;
            }
        }

        if (!audioData) return reply("❌ All API keys failed or limit exceeded!");

        await conn.sendMessage(from, {
            audio: { url: audioData.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${audioData.title}.mp3`.replace(/[^\w\s.-]/g, ''),
            contextInfo: {
                externalAdReply: {
                    title: audioData.title,
                    body: `🏮 Downloaded By Subzero 🏮`,
                    thumbnail: await axios.get(audioData.thumbnail || thumbnail, { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Song download error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
cmd({
    pattern: "video8",
    alias: ["vid", "ytvideo"],
    react: "🎬",
    desc: "Download YouTube video with quality options",
    category: "download",
    use: "<query/url> [quality]",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a video name or YouTube URL!\nExample: .video https://youtu.be/ox4tmEV6-QU 720\nOr: .video Alan Walker Lily 360");

        // Extract quality (default to 360p if not specified)
        const parts = q.split(/\s+/);
        let videoQuery, quality = "360";
        
        // Check if last part is a quality specification
        if (["360", "480", "720", "1080"].includes(parts[parts.length - 1])) {
            quality = parts.pop();
            videoQuery = parts.join(" ");
        } else {
            videoQuery = q;
        }

        let videoUrl, title, thumbnail;
        
        // Check if it's a URL
        if (videoQuery.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = videoQuery;
            const videoInfo = await yts({ videoId: videoQuery.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(videoQuery);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply(`⏳ Processing ${quality}p video...`);

        // Use Kaiz API to get video
        const apiUrl = `https://kaiz-apis.gleeze.com/api/yt-down?url=${encodeURIComponent(videoUrl)}&apikey=f642c433-9f7d-4534-9437-abeffb42579f`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data?.response || !data.response[`${quality}p`]) {
            const availableQualities = Object.keys(data?.response || {}).join(", ");
            return reply(`❌ ${quality}p not available!\nAvailable qualities: ${availableQualities || 'none'}`);
        }

        const videoData = data.response[`${quality}p`];

        // Download thumbnail
        let thumbnailBuffer;
        try {
            const thumbResponse = await axios.get(thumbnail, { 
                responseType: 'arraybuffer',
                timeout: 10000 
            });
            thumbnailBuffer = thumbResponse.data;
        } catch (e) {
            thumbnailBuffer = null;
        }

        // Get sender name safely
        let senderName = "User";
        try {
            senderName = await conn.getName(from.split('@')[0]) || "User";
        } catch (e) {
            console.error("Error getting sender name:", e);
        }

        // Send the video with metadata
        await conn.sendMessage(from, {
            video: { url: videoData.download_url },
            mimetype: 'video/mp4',
            fileName: videoData.title.replace(/[^\w\s.-]/gi, ''),
            caption: `*${data.author || 'YouTube Video'}*\n` +
                     `📌 Title: ${videoData.title.split('(')[0].trim()}\n` +
                     `🖥️ Quality: ${quality}p\n` +
                     `⬇️ Downloaded by ${senderName}`,
            thumbnail: thumbnailBuffer
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Video download error:", error);
        try {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        } catch (e) {
            console.error("Failed to send error reaction:", e);
        }
        
        let errorMsg = "❌ Error: ";
        if (error.code === 'ECONNABORTED') {
            errorMsg += "Request timed out. Try again.";
        } else if (error.response?.status === 429) {
            errorMsg += "API limit reached. Try again later.";
        } else if (error.message.includes('store')) {
            errorMsg += "Configuration error. Please contact bot admin.";
        } else {
            errorMsg += "Failed to download video. Try different quality.";
        }
        
        reply(errorMsg);
    }
});

/*
cmd({
    pattern: "video7",
    alias: ["vid", "ytvideo"],
    react: "🎬",
    desc: "Download YouTube video with quality options",
    category: "download",
    use: "<query/url> [quality]",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a video name or YouTube URL!\nExample: .video https://youtu.be/ox4tmEV6-QU 720\nOr: .video Alan Walker Lily 360");

        // Extract quality (default to 360p if not specified)
        const parts = q.split(/\s+/);
        let videoQuery, quality = "360";
        
        // Check if last part is a quality specification
        if (["360", "480", "720", "1080"].includes(parts[parts.length - 1])) {
            quality = parts.pop();
            videoQuery = parts.join(" ");
        } else {
            videoQuery = q;
        }

        let videoUrl, title, thumbnail;
        
        // Check if it's a URL
        if (videoQuery.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = videoQuery;
            const videoInfo = await yts({ videoId: videoQuery.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(videoQuery);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply(`⏳ Processing ${quality}p video...`);

        // Use Kaiz API to get video
        const apiUrl = `https://kaiz-apis.gleeze.com/api/yt-down?url=${encodeURIComponent(videoUrl)}&apikey=f642c433-9f7d-4534-9437-abeffb42579f`;
        const { data } = await axios.get(apiUrl);

        if (!data.response || !data.response[quality + "p"]) {
            const availableQualities = Object.keys(data.response || {}).join(", ");
            return reply(`❌ ${quality}p not available!\nAvailable qualities: ${availableQualities || 'none'}`);
        }

        const videoData = data.response[quality + "p"];

        // Download thumbnail
        let thumbnailBuffer;
        try {
            const thumbResponse = await axios.get(thumbnail, { responseType: 'arraybuffer' });
            thumbnailBuffer = thumbResponse.data;
        } catch (e) {
            thumbnailBuffer = null;
        }

        // Send the video with metadata
        await conn.sendMessage(from, {
            video: { url: videoData.download_url },
            mimetype: 'video/mp4',
            fileName: videoData.title.replace(/[^\w\s.-]/gi, ''),
            caption: `*${data.author || 'YouTube Video'}*\n` +
                     `📌 *Title:* ${videoData.title.split('(')[0].trim()}\n` +
                     `🖥️ *Quality:* ${quality}p\n` +
                     `⬇️ *Downloaded by* ${conn.getName(from.split('@')[0])}`,
            thumbnail: thumbnailBuffer
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Video download error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}\nTry a different quality or video.`);
    }
});
*/

cmd({
    pattern: "song4",
    alias: ["play4", "mp3dl"],
    react: "🎶",
    desc: "Download high quality YouTube audio",
    category: "download",
    use: "<query/url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("🎵 *Usage:* .song2 <song name or YouTube URL>\nExample: .song2 Alan Walker Lily\nOr: .song2 https://youtu.be/ox4tmEV6-QU");

        // Send processing reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let videoUrl, title, thumbnail;
        
        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return reply("🔍 No results found for your search!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("🚀 Processing audio download...");

        // Use Kaiz API to get high quality audio
        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytdown-mp3?url=${encodeURIComponent(videoUrl)}&apikey=f642c433-9f7d-4534-9437-abeffb42579f`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data.download_url) {
            return reply("❌ Failed to get download link. The video may be restricted.");
        }

        // Download thumbnail
        let thumbnailBuffer;
        try {
            const thumbResponse = await axios.get(data.thumbnail || thumbnail, { 
                responseType: 'arraybuffer',
                timeout: 10000
            });
            thumbnailBuffer = thumbResponse.data;
        } catch (e) {
            thumbnailBuffer = null;
        }

        // Send the audio file with rich metadata
        await conn.sendMessage(from, {
            audio: { url: data.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${data.title.replace(/[^\w\s.-]/gi, '')}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: data.title.split('-')[0].trim(),
                    body: `🎤 ${data.authorr || '🏷️ Mr Frank OFC'}`,
                    thumbnail: thumbnailBuffer,
                    mediaType: 2,
                    mediaUrl: videoUrl,
                    sourceUrl: videoUrl
                }
            }
        }, { quoted: mek });

        // Send success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Song2 download error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        
        let errorMsg = "🎵 Download failed: ";
        if (error.code === 'ECONNABORTED') {
            errorMsg += "Request timed out. Try a shorter song.";
        } else if (error.response?.status === 429) {
            errorMsg += "API limit reached. Try again later.";
        } else {
            errorMsg += error.message.includes('404') ? "Video not found." : "Please try again.";
        }
        
        reply(errorMsg);
    }
});
/*

cmd({
    pattern: "video",
    alias: ["vid", "ytvideo"],
    react: "🎬",
    desc: "Download YouTube video",
    category: "download",
    use: "<query or url> [quality]",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a video name or YouTube URL!");

        // Extract quality if provided (default to 720)
        const [query, quality = "360"] = q.split("|").map(item => item.trim());
        
        let videoUrl, title, thumbnail;
        
        // Check if it's a URL
        if (query.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = query;
            const videoInfo = await yts({ videoId: query.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("⏳ Processing your video request...");

        // Use Kaiz API to get video
        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
        const { data } = await axios.get(apiUrl);

        if (!data.download_url) return reply("❌ Failed to get video download link!");

        // Send the video with metadata
        await conn.sendMessage(from, {
            video: { url: data.download_url },
            mimetype: 'video/mp4',
            fileName: `${data.title}.mp4`.replace(/[^\w\s.-]/g, ''),
            caption: `*${data.title}*\nQuality: ${data.quality}p\n\n> DOWNLOADED BY SUBZERO`,
            thumbnail: await axios.get(data.thumbnail || thumbnail, { responseType: 'arraybuffer' })
                .then(res => res.data)
                .catch(() => null)
        }, { quoted: mek });

    } catch (error) {
        console.error("Video download error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
*/
