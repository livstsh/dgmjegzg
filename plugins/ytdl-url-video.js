const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "ytvid",
    alias: ["video3", "ytv"],
    react: "🎥",
    desc: "Download YouTube videos via ytdown.to proxy.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a YouTube URL!");
        if (!q.includes("youtube.com") && !q.includes("youtu.be")) return reply("❌ Invalid YouTube link!");

        await reply("⏳ *Processing your video, please wait...*");

        // Step 1: Get media items from proxy
        let a = await axios.post(
            "https://ytdown.to/proxy.php",
            `url=${encodeURIComponent(q)}`,
            {
                headers: {
                    "accept": "*/*",
                    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "x-requested-with": "XMLHttpRequest",
                    "referrer": "https://ytdown.to/en2/"
                }
            }
        );

        if (!a.data || !a.data.api || !a.data.api.mediaItems) {
            throw new Error("Could not find media items. Try another link.");
        }

        // Step 2: Filter for Video (picking the first available video item)
        let b = a.data.api.mediaItems.filter(i => i.type === "Video")[0];
        if (!b) throw new Error("Video file not found.");

        // Step 3: Get the direct file JSON
        let c = await axios.get(b.mediaUrl, {
            headers: { "Accept": "application/json" }
        });

        if (!c.data || !c.data.fileUrl) throw new Error("Failed to fetch file URL.");

        // Step 4: Download the video as Buffer
        let d = await axios.get(c.data.fileUrl, {
            responseType: "arraybuffer",
            headers: { "Range": "bytes=0-" }
        });

        // Step 5: Send the video to the user
        await conn.sendMessage(from, { 
            video: Buffer.from(d.data), 
            caption: `*✅ Video Downloaded Successfully*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`,
            mimetype: 'video/mp4'
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
