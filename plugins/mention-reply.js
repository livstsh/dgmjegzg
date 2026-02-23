//---------------------------------------------------------------------------
//           KAMRAN-MD - PHOTO EDITOR AI (FIXED)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');

const API = "https://api.giftedtech.co.ke/api/tools/photoeditor";
const API_KEY = "gifted";

// 🔹 Telegraph Uploader
async function uploadToTelegraph(buffer) {
    const form = new FormData();
    form.append("file", buffer, "image.jpg");

    const res = await fetch("https://telegra.ph/upload", {
        method: "POST",
        body: form
    });

    const data = await res.json();
    return "https://telegra.ph" + data[0].src;
}

cmd({
    pattern: "photoedit",
    alias: ["editphoto", "editimg"],
    desc: "Edit photo using AI prompt.",
    category: "ai",
    use: ".photoedit <prompt>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image/')) {
            return reply(`📸 Reply to an image with a prompt.\n\nExample:\n${prefix + command} change shirt color to black`);
        }

        if (!q) return reply("❌ Please provide an editing prompt.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("🤖 Uploading & Editing... Please wait...");

        // 1️⃣ Download Image
        const buffer = await quoted.download();
        if (!buffer) throw "Image download failed.";

        // 2️⃣ Upload to Telegraph
        const publicUrl = await uploadToTelegraph(buffer);

        // 3️⃣ Create API URL
        const apiUrl = `${API}?apikey=${API_KEY}&url=${encodeURIComponent(publicUrl)}&prompt=${encodeURIComponent(q)}`;

        // 4️⃣ Send Edited Image
        await conn.sendMessage(from, {
            image: { url: apiUrl },
            caption: `✅ *Photo Edited Successfully!*\n🎨 *Prompt:* ${q}\n\n🚀 Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Photo Editor Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error while editing image.");
    }
});
