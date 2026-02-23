//---------------------------------------------------------------------------
//           KAMRAN-MD - PHOTO EDITOR AI (GIFTED TECH)
//---------------------------------------------------------------------------
//  🎨 EDIT PHOTO USING PROMPT (Shirt color, background, etc.)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');

const GIFTED_API = "https://api.giftedtech.co.ke/api/tools/photoeditor";
const API_KEY = "gifted"; // Apna premium key ho to yahan change kar dena

cmd({
    pattern: "photoedit",
    alias: ["editphoto", "editimg2"],
    desc: "Edit photo using AI prompt.",
    category: "ai",
    use: ".photoedit <prompt>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image/')) {
            return reply(`📸 *Photo Editor AI*\n\nReply to an image with a prompt.\n\nExample:\n${prefix + command} Change his shirt color to navy blue`);
        }

        if (!q) return reply("❌ Please provide an editing prompt.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("_🤖 Editing image... Please wait..._");

        // Download Image
        const buffer = await quoted.download();
        if (!buffer) throw "Image download failed.";

        // Upload image to temp hosting (WhatsApp media direct use nahi hota)
        const uploadRes = await conn.sendMessage(from, { 
            document: buffer,
            mimetype: "image/jpeg",
            fileName: "temp.jpg"
        });

        const imageUrl = uploadRes?.message?.documentMessage?.url;
        if (!imageUrl) throw "Failed to get image URL.";

        // Encode URL & Prompt
        const encodedUrl = encodeURIComponent(imageUrl);
        const encodedPrompt = encodeURIComponent(q);

        const apiUrl = `${GIFTED_API}?apikey=${API_KEY}&url=${encodedUrl}&prompt=${encodedPrompt}`;

        // Send Result
        await conn.sendMessage(from, {
            image: { url: apiUrl },
            caption: `✅ *Photo Edited Successfully!*\n🎨 *Prompt:* ${q}\n\n🚀 *Powered by KAMRAN-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Photo Editor Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error while editing image.");
    }
});
