const { cmd } = require('../command');
const fs = require('fs'); // Need File System module for temporary file path
const path = require('path'); // Need Path module

// --- FINAL ATTEMPT: LOCAL FILE PATH FIX ---

cmd({
    pattern: "tovoice",
    alias: ["tovn", "vn"],
    desc: "Converts a replied audio or video file into a WhatsApp Voice Note (PTT) by saving and re-sending the file.",
    category: "media",
    react: "🎤",
    filename: __filename
},
async (conn, mek, m, { 
    from, 
    reply, 
    react 
}) => {
    let tempFilePath = null; // Variable to hold the temporary file path

    try {
        await react("⏳");

        // 1. Check for quoted media (Audio or Video)
        if (!m.quoted || !(m.quoted.mtype === 'audioMessage' || m.quoted.mtype === 'videoMessage')) {
            await react("❌");
            return reply("❌ *Usage:* Please reply to an audio file or a short video and type *.tovoice*.");
        }

        // 2. Get the Media Buffer (Download the media)
        const mediaBuffer = await conn.downloadMediaMessage(m.quoted);
        
        if (!mediaBuffer) {
            await react("❌");
            return reply("❌ Failed to download the media file.");
        }
        
        // 3. CRITICAL STEP: Save the buffer to a temporary file path
        // We use a common temporary directory and create a unique filename.
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const fileName = `${Date.now()}_vn_convert.mp3`;
        tempFilePath = path.join(tempDir, fileName);
        
        fs.writeFileSync(tempFilePath, mediaBuffer);
        
        // 4. Send the Media as a Voice Note (PTT) from the file path
        // Sending from a saved file path is the most reliable way to enforce the PTT flag.
        await conn.sendMessage(from, {
            audio: { url: tempFilePath }, // Send via URL pointing to the local file
            ptt: true, // This flag must be included
            mimetype: 'audio/mp4' // Use a common audio mimetype
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("To Voice Command Error:", error);
        await react("❌");
        reply("❌ An unexpected error occurred during audio conversion. Check file system permissions.");
    } finally {
        // 5. Clean up the temporary file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`[TOVOICE] Cleaned up temp file: ${tempFilePath}`);
        }
    }
});
