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
        // CRITICAL FIX: Sending only the 'audio' buffer with 'ptt: true' is the most reliable way 
        // to force the PTT format, as it bypasses complex mimetype checks.
        await conn.sendMessage(from, {
            audio: media,
            // Removing mimetype helps force PTT flag recognition in some frameworks
            ptt: true // This flag makes it a Push-to-Talk (Voice Note)
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("To Voice Command Error:", error);
        await react("❌");
        reply("❌ An error occurred while converting the media to a Voice Note.");
    }
});
