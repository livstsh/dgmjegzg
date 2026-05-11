const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "qr",
    alias: ["getqr", "botqr"],
    react: "🔰",
    desc: "Fetch and send QR code from LUCKY-MD bot",
    category: "download",
    use: ".qr",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const url = "https://adeel-xtech1-4c8d84be2a96.herokuapp.com/qr"; // direct QR endpoint

        // Fetch QR image as arraybuffer
        const res = await axios.get(url, { responseType: "arraybuffer" });

        // Convert response to buffer
        const imageBuffer = Buffer.from(res.data, "binary");

        // Send QR image to WhatsApp
        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: "🔰 LUCKY-MD QR Code"
        });

    } catch (err) {
        console.error("QR plugin error:", err);
        await reply("❌ Failed to load QR image. Make sure the /qr endpoint returns an actual image or PNG.");
    }
});