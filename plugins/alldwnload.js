const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch');
const Buffer = require('buffer').Buffer;

// --- API Endpoints ---
// Using a common, simple file upload API (Telegraph) and a recognition API.
const UPLOAD_API = 'https://telegra.ph/upload';
const RECOGNITION_API = "https://api.deline.web.id/tools/music-recognition"; // Assuming a stable recognition endpoint

// Helper function to convert milliseconds to mm:ss format
function toTime(ms) {
    if (typeof ms !== 'number' || ms < 0) return '00:00';
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    return [m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

// Helper function to upload audio buffer to a public link
async function uploadAudioToPublicHost(audioBuffer) {
    try {
        // NOTE: We cannot use telegraph for audio. Using a generic uploader or direct data send.
        // For simplicity and stability, we use a different uploader or rely on direct data (if API supports).
        
        // Since direct upload of audio buffer is required for recognition, 
        // we'll try to send Base64 data if the API supports it. 
        // However, this API likely expects a URL. We stick to the safest method:

        // --- STICK TO SAFER LOGIC: Upload to public host ---
        
        const form = new FormData();
        form.append('file', audioBuffer, { filename: 'audio.mp3', contentType: 'audio/mp3' });

        const response = await axios.post(
            'https://api.anonfiles.com/upload', // Trying a different public uploader
            form, 
            {
                headers: form.getHeaders(),
                timeout: 30000 
            }
        );
        
        // Check anonfiles structure for direct link
        if (response.data?.status && response.data?.data?.file?.url?.full) {
             return response.data.data.file.url.full;
        }
        
        throw new Error("Public host par upload fail.");
        
    } catch (uploadError) {
        console.error("Audio Upload Error:", uploadError.message);
        throw new Error("❌ Audio file ko server par upload karne mein dikkat aayi.");
    }
}

// Core function to recognize music via API
async function whatmusic(url) {
    try {
        // API expects URL and returns JSON result
        const apiUrl = `${RECOGNITION_API}?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl, { timeout: 30000 });
        const data = await response.json();
        
        // Assuming API returns results in a 'result' or 'matches' array
        if (data.status && data.result && data.result.length > 0) {
            const match = data.result[0];
            return {
                title: match.title || "Unknown",
                artist: match.artist || "Unknown",
                duration: toTime(match.duration_ms || 0),
                url: match.spotify_url || match.youtube_url || ''
            };
        }
        
        throw new Error("Gaane ka data nahi mila.");
        
    } catch (err) {
        throw new Error(`Recognition fail ho gaya: ${err.message}`);
    }
}

let handler = async (conn, mek, m, { reply, from }) => {
    // Determine the target message (reply or current message if it contains audio)
    const target = m.quoted ? m.quoted : m; 
    
    // Check if the target message is audio
    const isAudio = target.mimetype && /audio/.test(target.mimetype);

    if (!isAudio) {
        return reply(`*❌ Oops!* Kripya us audio file ya voice note ko reply karein jiska gaana aap pehchanna chahte hain.`);
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await reply('⏳ Audio analysis shuru ho gaya hai...');

    try {
        // 1. Download the audio buffer
        const buffer = await conn.downloadMediaMessage(target);
        
        // 2. Upload the audio buffer to get a public URL
        const audioUrl = await uploadAudioToPublicHost(buffer);
        
        // 3. Perform music recognition using the public URL
        const result = await whatmusic(audioUrl);

        let caption = `*🎤 Gaana Pehchana Gaya!* 🎶\n\n`;
        caption += `*Judul:* ${result.title}\n`;
        caption += `*Artis:* ${result.artist}\n`;
        caption += `*Durasi:* ${result.duration}\n`;
        caption += `*Sumber:* ${result.url || "Koi link nahi mila"}\n\n`;
        
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("Shazam Command Error:", err);
        // Custom error message for the user
        let errorMessage = err.message.includes('upload') ? err.message : `❌ Maaf! ${err.message}`;
        await reply(errorMessage);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
};

cmd({
    pattern: "shazam",
    alias: ["whatmusic", "acrmusic"],
    desc: "Reply kiye gaye audio se gaane ka naam pehchanta hai.", // Recognizes song title from replied audio.
    category: "tools",
    react: "🎵",
    filename: __filename
}, handler);

module.exports = handler;
