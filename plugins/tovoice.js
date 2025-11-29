const { cmd } = require('../command');

cmd({
    pattern: "tovoice",
    alias: ["tovn", "vn"],
    desc: "Converts a replied audio or video file into a WhatsApp Voice Note (PTT).",
    category: "media",
    react: "🎤",
    filename: __filename
},
async (conn, mek, m, { 
    from, 
    reply, 
    react 
}) => {
    try {
        await react("⏳");

        // 1. Check for quoted media (Audio or Video)
        // Check if the user replied and if the replied message contains audio or video media
        if (!m.quoted || !(m.quoted.mtype === 'audioMessage' || m.quoted.mtype === 'videoMessage')) {
            await react("❌");
            return reply("❌ *Usage:* Please reply to an audio file or a short video and type *.tovoice*.");
        }

        // 2. Get the Media Buffer (Download the media)
        const media = await conn.downloadMediaMessage(m.quoted);
        
        if (!media) {
            await react("❌");
            return reply("❌ Failed to download the media file.");
        }

        // 3. Send the Media as a Voice Note (PTT)
        // CRITICAL: The 'ptt: true' flag tells WhatsApp to display this audio file as a Voice Note.
        await conn.sendMessage(from, {
            audio: media,
            mimetype: 'audio/mp4', // Use a compatible audio mimetype
            ptt: true // This flag makes it a Push-to-Talk (Voice Note)
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("To Voice Command Error:", error);
        await react("❌");
        reply("❌ An error occurred while converting the media to a Voice Note.");
    }
});
