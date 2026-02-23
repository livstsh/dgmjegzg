//---------------------------------------------------------------------------
// KAMRAN-MD - PHOTO EDITOR AI (FULL DEBUG FIX)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');

const API = "https://api.giftedtech.co.ke/api/tools/photoeditor";
const API_KEY = "gifted"; // ⚠ Agar ye free key expired ho to apni key lagao

async function uploadToTelegraph(buffer) {
    const form = new FormData();
    form.append("file", buffer, "image.jpg");

    const res = await fetch("https://telegra.ph/upload", {
        method: "POST",
        body: form
    });

    const data = await res.json();

    if (!data[0]?.src) throw "Telegraph upload failed";

    return "https://telegra.ph" + data[0].src;
}

cmd({
    pattern: "photoedit",
    desc: "Edit photo using AI prompt.",
    category: "ai",
    use: ".photoedit <prompt>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image/'))
            return reply(`Reply to an image.\nExample:\n${prefix + command} change shirt color to black`);

        if (!q) return reply("Provide editing prompt.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("Uploading & Editing...");

        const buffer = await quoted.download();
        if (!buffer) throw "Image download failed";

        // Upload
        const publicUrl = await uploadToTelegraph(buffer);
        console.log("Public URL:", publicUrl);

        // API URL
        const apiUrl = `${API}?apikey=${API_KEY}&url=${encodeURIComponent(publicUrl)}&prompt=${encodeURIComponent(q)}`;

        console.log("API URL:", apiUrl);

        // Check API response first
        const check = await fetch(apiUrl);
        const contentType = check.headers.get("content-type");

        if (!contentType.startsWith("image")) {
            const text = await check.text();
            console.log("API Error:", text);
            throw "API did not return image. Check API key.";
        }

        // Send image
        await conn.sendMessage(from, {
            image: { url: apiUrl },
            caption: `✅ Edited Successfully\nPrompt: ${q}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("PHOTO EDIT ERROR:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error while editing image.\nCheck console for details.");
    }
});
