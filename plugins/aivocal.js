const axios = require("axios");
const { cmd, commands } = require("../command");
// Node.js environments mein multipart/form-data ke liye yeh library sabse bharosemand hai
const FormData = require('form-data'); // <-- Explicitly require form-data library

// --- API Configuration ---
const API_UPLOAD_URL = "https://aivocalremover.com/api/v2/FileUpload";
const API_PROCESS_URL = "https://aivocalremover.com/api/v2/ProcessFile";
// API key:
const API_KEY = "X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn"; 

cmd({
    pattern: "vocalremover",
    alias: ["aivocal"],
    react: "🎶",
    desc: "Separates vocals and instrumental tracks from an audio file.",
    category: "tools",
    filename: __filename,
},
async (conn, m, store, { from, quoted, reply, usedPrefix, command }) => {
    try {
        // 1. Check for quoted audio message and download the buffer
        if (!m.quoted || !/audio/.test(m.quoted.mimetype || "")) {
            return reply(`*Example: reply to an audio with the command ${usedPrefix + command}*`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        
        // Download the audio buffer (assuming conn.downloadMediaMessage works)
        const buffer = await conn.downloadMediaMessage(m.quoted);

        if (!buffer || buffer.length === 0) {
            throw new Error("Gagal mengunduh audio buffer (Buffer is empty).");
        }
        
        // --- STEP 1: UPLOAD FILE ---
        
        // 2. Prepare FormData using the required library
        const form = new FormData();
        
        // Append Buffer with options
        form.append("fileName", buffer, {
            filename: "audio.mp3",
            contentType: "audio/mpeg"
        });

        // 3. Upload the file to the API
        const uploadResponse = await axios.post(API_UPLOAD_URL, form, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                ...form.getHeaders() // Crucial: getHeaders sets the correct Content-Type with boundary
            }
        });

        const upload = uploadResponse.data;

        if (!upload?.file_name) {
            console.error("Upload API Response (Failed):", JSON.stringify(upload, null, 2));
            throw new Error("Upload audio failed. Check console for API response details.");
        }
        
        // --- STEP 2: PROCESS FILE ---

        // 4. Process the file
        const body = new URLSearchParams({
            file_name: upload.file_name,
            action: "watermark_video",
            key: API_KEY,
            web: "web"
        });

        const processResponse = await axios.post(API_PROCESS_URL, body.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": "https://aivocalremover.com",
                "Referer": "https://aivocalremover.com/"
            }
        });

        const process = processResponse.data;

        if (!process?.instrumental_path || !process?.vocal_path) {
            console.error("Process API Response (Failed):", JSON.stringify(process, null, 2));
            throw new Error("Proses pemisahan audio gagal. Check console for API response details.");
        }

        // 5. Send Instrumental Track
        await conn.sendMessage(
            from,
            {
                audio: { url: process.instrumental_path },
                mimetype: "audio/mpeg",
                ptt: false, 
                fileName: "instrumental.mp3",
                caption: "*🎶 Instrumental Track*"
            },
            { quoted: m }
        );

        // 6. Send Vocal Track
        await conn.sendMessage(
            from,
            {
                audio: { url: process.vocal_path },
                mimetype: "audio/mpeg",
                ptt: false, 
                fileName: "vocal.mp3",
                caption: "*🎤 Vocal Track*"
            },
            { quoted: m }
        );

        await reply(`*✅ KAMRAN-SMD memisahkan audio!* 🎶✨\n\n*• Instrumental*\n*• Vocal*`);

    } catch (e) {
        // Remove the loading reaction and reply with error
        await conn.sendMessage(from, { react: { text: "", key: m.key } });
        
        let errorMessage = "Gagal memproses audio 🍂. ";
        if (e.response && e.response.status) {
            errorMessage += `API Error Status: ${e.response.status}.`;
            console.error("API Error Response Data:", e.response.data);
        } else {
             errorMessage += `General Error: ${e.message}.`;
        }
        
        console.error("❌ Error in vocalremover command:", e);
        reply(errorMessage);
    }
});
