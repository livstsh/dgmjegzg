const { exec } = require('child_process');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { cmd } = require('../command');

cmd({
    pattern: "csong",
    alias: ["channelsong", "sendchannel"],
    react: "🎵",
    desc: "Search and send a song to a specific WhatsApp Channel.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Validation: Expecting ".csong channelJid songName"
        if (!q) return reply("❗ Example: .csong 120363xxxx@newsletter song name");
        
        let args = q.split(" ");
        let channelJid = args[0];
        let query = args.slice(1).join(" ");

        if (!channelJid.includes("@")) return reply("❗ Please provide a valid channel JID (e.g., @newsletter).");
        if (!query) return reply("❗ Please enter the song name.");

        await reply("⏳ *Processing and sending to channel...*");

        // 🔍 Step 1: Search YouTube
        const search = await yts(query);
        if (!search.videos.length) return reply("❌ No results found on YouTube.");
        
        const video = search.videos[0];
        const videoUrl = video.url;
        const duration = video.timestamp;

        // 🌐 Step 2: Get Download Link from Movanest API
        const apiUrl = `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(videoUrl)}&format=audio`;
        const res = await axios.get(apiUrl);
        const json = res.data;

        if (!json?.status || !json?.results?.success || !json?.results?.url) {
            throw new Error('API did not return a valid download link');
        }

        const dlUrl = json.results.url;
        const title = json.results.title || video.title;
        let thumb = json.results.thumb || video.thumbnail;

        // 📂 Step 3: Temp File Handling for FFmpeg
        const tempMp3 = path.join(os.tmpdir(), `${Date.now()}_input.mp3`);
        const tempOpus = path.join(os.tmpdir(), `${Date.now()}_output.opus`);

        // Download MP3
        const mp3Res = await axios.get(dlUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(tempMp3, Buffer.from(mp3Res.data));

        // 🔄 Step 4: Convert MP3 to Opus (OGG) for Voice Note style
        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${tempMp3}" -c:a libopus -b:a 128k -vbr on -compression_level 10 "${tempOpus}"`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const opusBuffer = fs.readFileSync(tempOpus);

        // 🎨 Step 5: Prepare Channel Post
        const caption = `*🪸 DR KAMRAN - Channel Post!!*\n\n` +
                        `> _*🧃Title*_ : \`${title}\`\n` +
                        `> _*🪺 Duration*_ : \`${duration}\`\n\n` +
                        `> _*Thnk For Check Our Bot!! 😌✨*_`;

        // 1. Send Image + Caption to Channel
        await conn.sendMessage(channelJid, {
            image: { url: thumb },
            caption: caption
        });

        // 2. Send Audio (Voice Note style) to Channel
        await conn.sendMessage(channelJid, {
            audio: opusBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
            fileName: `${title}.opus`
        });

        // 🧹 Cleanup Temp Files
        if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
        if (fs.existsSync(tempOpus)) fs.unlinkSync(tempOpus);

        await reply("✅ *Sent to channel successfully!*");
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("CSONG Error:", error);
        reply("⚠️ *Error:* " + (error.message || "Something went wrong"));
    }
});
