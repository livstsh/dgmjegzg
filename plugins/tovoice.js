const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs'); // We'll simulate file operations if needed

// --- FINAL ATTEMPT: API ASSISTED CONVERSION ---

cmd({
    pattern: "tovoice",
    alias: ["tovn", "vn"],
    desc: "Converts a replied audio or video file into a WhatsApp Voice Note (PTT) using a converter service.",
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

        // 1. Check for quoted media
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
        
        // Convert Buffer to Base64 for API transmission
        const base64Audio = mediaBuffer.toString('base64');
        
        // 3. --- API CALL TO CONVERSION SERVICE ---
        // 🚨 IMPORTANT: Replace this API with a working service that converts audio to a compatible format (like OGG or MP3) and returns the output URL or Base64.
        const CONVERTER_API = "https://api.converter-service.com/convert/tovn"; 
        
        // Prepare payload for the converter API
        const payload = {
            audio_base64: base64Audio,
            output_format: 'ogg', // OGG is often the most compatible format for VN
            ptt: true
        };

        const apiResponse = await axios.post(CONVERTER_API, payload);

        // Check for the final output URL
        const finalAudioUrl = apiResponse.data.audio_url || apiResponse.data.url; 
        
        if (!finalAudioUrl) {
            await react("❌");
            return reply("❌ Conversion API failed: Could not get the final converted audio URL.");
        }


        // 4. Send the Media as a Voice Note (PTT)
        // We send the URL of the converted file.
        await conn.sendMessage(from, {
            // Using { url: ... } is generally more reliable for sending large files
            audio: { url: finalAudioUrl },
            ptt: true 
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("To Voice Command Error:", error);
        await react("❌");
        
        if (error.response && error.response.status === 404) {
             reply("❌ Conversion API not found or service is down.");
        } else {
             reply("❌ An unexpected error occurred during audio conversion.");
        }
    }
});
