const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "photoeditor",
    alias: ["editphoto", "aiimageedit", "editor"],
    react: "🎨",
    desc: "AI Photo Editor - Edit images using prompts (e.g., change shirt color).",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        // 1. Check if user replied to an image
        const mime = (quoted.msg || quoted).mimetype || '';
        if (!/image\/(png|jpe?g)/i.test(mime)) return reply("⚠️ Please reply to an *image* with a prompt.\n\n*Example:* .photoeditor change shirt color to navy");

        // 2. Check for prompt
        if (!q) return reply("❓ Please provide a prompt (instructions) to edit the photo.\n\n*Example:* .photoeditor change background to a beach");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply("⏳ *AI is editing your photo... Please wait.*");

        // 3. Download image and upload to Catbox (or get direct URL)
        // Note: API needs a direct URL. If your bot has an uploader, use it here.
        // Assuming we use your provided test URL or a public one.
        let media = await quoted.download();
        
        // --- UPLOADER LOGIC ---
        // (Yahan aapko image upload karke URL lena hoga, Example using catbox/telegra.ph)
        const { uploadtoCatbox } = require('../lib/uploader'); // Make sure you have an uploader
        const imageUrl = await uploadtoCatbox(media);
        
        const apiKey = "gifted"; // Your API Key
        const apiUrl = `https://api.giftedtech.co.ke/api/tools/photoeditor?apikey=${apiKey}&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(q)}`;

        // 4. Fetch the Edited Image
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        if (response.data) {
            await conn.sendMessage(from, { 
                image: Buffer.from(response.data), 
                caption: `✅ *Photo Edited Successfully!*\n\n*Prompt:* ${q}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*` 
            }, { quoted: mek });
            
            await conn.sendMessage(from, { react: { text: '✨', key: m.key } });
        } else {
            throw new Error("API did not return an image.");
        }

    } catch (err) {
        console.error("PhotoEditor Error:", err);
        reply(`❌ *Error:* ${err.message || "Failed to edit image. Make sure the prompt is clear."}`);
    }
});
                             
