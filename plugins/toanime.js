const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Uploads buffer to Uguu.se to get a public URL
 */
async function uploadToUguu(buffer, filename) {
    try {
        const form = new FormData();
        form.append('files[]', buffer, { filename });

        const res = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() }
        });

        if (!res.data.files || !res.data.files[0]) throw new Error('Upload failed.');
        return res.data.files[0].url;
    } catch (e) {
        throw new Error(`Upload error: ${e.message}`);
    }
}

cmd({
    pattern: "toanime",
    alias: ["animerender", "img2anime"],
    react: "🎨",
    desc: "Convert your image into an Anime style using AI.",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, reply, isQuotedImage, isImage }) => {
    try {
        // --- VALIDATION ---
        const isImg = isImage || (m.quoted && (m.quoted.mtype === 'imageMessage'));
        if (!isImg) return reply("⚠️ Please reply to an image or send an image with the command.");

        // --- TRUE LID FIX ---
        const targetChat = conn.decodeJid(from);

        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });
        reply("⏳ *Processing your image...* Converting to Anime style. Please wait.");

        // 1. Download Media
        const quoted = m.quoted ? m.quoted : m;
        const buffer = await conn.downloadMediaMessage(quoted);
        const mime = (quoted.msg || quoted).mimetype || 'image/jpeg';
        const ext = mime.split('/')[1];

        // 2. Upload to Uguu for URL
        const imageUrl = await uploadToUguu(buffer, `img_${Date.now()}.${ext}`);

        // 3. Initiate AI Transformation
        // Note: Replace 'APIKEYMU' with your actual API key if required
        const initRes = await axios.get(`https://fgsi.dpdns.org/api/ai/image/img2anime?apikey=APIKEYMU&url=${encodeURIComponent(imageUrl)}`);
        
        if (!initRes.data || !initRes.data.data || !initRes.data.data.pollUrl) {
            throw new Error("AI service initialization failed.");
        }

        const pollUrl = initRes.data.data.pollUrl;
        let resultUrl = null;
        let attempts = 0;
        const maxAttempts = 20; // Max 60 seconds

        // 4. Polling for Result
        while (!resultUrl && attempts < maxAttempts) {
            const checkRes = await axios.get(pollUrl);
            const status = checkRes.data.data.status;

            if (status === 'Success') {
                resultUrl = checkRes.data.data.result.url;
            } else if (status === 'Failed') {
                throw new Error("AI failed to process this image.");
            } else {
                await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
                attempts++;
            }
        }

        if (!resultUrl) throw new Error("Processing timed out.");

        // 5. Send Result
        await conn.sendMessage(targetChat, { 
            image: { url: resultUrl }, 
            caption: `✨ *Anime AI Transformation* ✨\n\n*Style:* Default Anime\n*LID Fix Active - Knight Bot*` 
        }, { quoted: mek });

        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("ToAnime Error:", e);
        reply(`❌ *Error:* ${e.message || "Failed to generate Anime image."}`);
    }
});
