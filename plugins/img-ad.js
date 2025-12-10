const { cmd } = require('../command');
const axios = require("axios");
const crypto = require("crypto");
// Assuming 'getBuffer' and 'sleep' functions are provided by the user's framework or defined locally.

// Local sleep function to replace the external import
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

cmd({
    pattern: "editimg",
    alias: ["aiedit", "aipaint"],
    desc: "Reply ki gayi photo ko AI prompt se edit karta hai.", // Edits the replied photo using an AI prompt.
    category: "ai",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command }) => {
    try {
        let quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Ensure we are replying to a message containing media info
        if (!quoted) {
            return reply(`❌ Kripya us photo ko reply karein jise aap edit karna chahte hain.\n\n*Udaharan:* Photo ko reply karein aur likhein: ${prefix + command} [prompt]`);
        }

        // Get mime type of the quoted message (if it's image or video)
        let mime = quoted.imageMessage ? quoted.imageMessage.mimetype : quoted.videoMessage ? quoted.videoMessage.mimetype : null;

        if (!mime || !/image|video/.test(mime)) {
            return reply(`❌ Kripya photo ya video ko reply karein.\n\n*Udaharan:* ${prefix + command} [prompt]`);
        }
        
        // Extract prompt from the command text
        let prompt = q.trim();
        if (!prompt) return reply("❌ Kripya likhein ki aap photo mein kya badlav chahte hain!");

        await reply("⏳ Aapki photo upload aur edit hone ke liye process ki jaa rahi hai...");

        // Download the media buffer
        let buffer = await conn.downloadMediaMessage(quoted);

        // --- Setup Axios instance for nanobananas API ---
        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                origin: 'https://nanobananas.pro',
                referer: 'https://nanobananas.pro/editor',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 1. Upload Presigned URL Request
        const { data: up } = await inst.post('/upload/presigned', {
            filename: Date.now() + ".jpg",
            contentType: "image/jpeg"
        });

        // 2. Upload the actual image buffer
        await axios.put(up.data.uploadUrl, buffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Length': buffer.length
            }
        });

        // 3. Bypass Cloudflare (Turnstile Token)
        const { data: cf } = await axios.post(
            "https://api.nekolabs.web.id/tools/bypass/cf-turnstile",
            {
                url: "https://nanobananas.pro/editor",
                siteKey: "0x4AAAAAAB8ClzQTJhVDd_pU"
            }
        );
        
        if (!cf.result) throw new Error("Cloudflare token bypass failed.");

        // 4. Create Edit Task
        const { data: task } = await inst.post('/edit', {
            prompt,
            image_urls: [up.data.fileUrl],
            turnstileToken: cf.result,
            uploadIds: [up.data.uploadId],
            userUUID: crypto.randomUUID(),
            // Ensure buffer is used for hash calculation
            imageHash: crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 64) 
        });
        
        if (!task.data.taskId) throw new Error("Failed to create AI task.");


        // 5. Poll/Wait for Result
        let resultUrl = null;
        for (let i = 0; i < 30; i++) { // Max 30 retries (approx 24 seconds)
            await sleep(800);
            let cek = await inst.get(`/task/${task.data.taskId}`);
            
            if (cek.data.data.status === "completed") {
                resultUrl = cek.data.data.result[0];
                break;
            }
            if (cek.data.data.status === "failed") {
                throw new Error("AI editing task failed or timed out on server.");
            }
        }
        
        if (!resultUrl) throw new Error("AI result link nahi mila.");

        // 6. Download and Send Result
        let edited = await axios.get(resultUrl, { responseType: "arraybuffer" });
        
        return conn.sendMessage(from, {
            image: Buffer.from(edited.data),
            caption: `✔️ *Edit Pura Hua!* 🎨\n\n🖼 Prompt: ${prompt}`
        }, { quoted: mek });

    } catch (e) {
        console.error("AI Edit Command Error:", e);
        reply(`⚠️ Process failed. Kripya dobara koshish karein. Error: ${e.message || 'Unknown API Error'}`);
    }
});
