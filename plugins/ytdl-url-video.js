const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "mikuvoice",
    alias: ["miku", "tts-miku", "miku-voice"],
    react: "🎤",
    desc: "Convert text to Hatsune Miku's voice.",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Text validation
        if (!q) return reply("Please provide text to convert to voice! Example: .mikuvoice Hello Kamran!");

        await reply("🎶 *Miku is warming up her voice...*");

        // API request options
        const options = {
            method: "POST",
            url: "https://shinoa.us.kg/api/voice/voice-miku",
            headers: {
                "accept": "*/*",
                "api_key": "free",
                "Content-Type": "application/json"
            },
            data: { text: q }
        };

        // API request using axios
        const response = await axios(options);
        const result = response.data;

        // Extracting audio URL from the first element of the data array
        if (result.status && result.data && result.data.length > 0) {
            const audioUrl = result.data[0].miku;

            // Sending the audio as a voice note (PTT)
            await conn.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            throw new Error("Failed to generate voice. Please try again.");
        }

    } catch (error) {
        console.error("Miku Voice Error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ *Error:* Miku voice generate karne mein masla hua. " + (error.message || ""));
    }
});
            
