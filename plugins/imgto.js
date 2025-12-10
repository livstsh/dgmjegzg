const axios = require("axios");
const FormData = require("form-data");
// Note: Using 'file-type' library for CJS compatibility, assuming it's available.
// The provided code used 'fileTypeFromBuffer', which I'll assume is imported globally or from a package like 'file-type'.
const { fromBuffer } = require('file-type'); 
const { cmd } = require("../command"); 

const API_URL = "https://api2.pixelcut.app/image/matte/v1";
const HEADERS = {
    "x-client-version": "web",
    "User-Agent": "Mozilla/5.0",
    "Origin": "https://douyin-drab-nu.vercel.app",
    "Referer": "https://douyin-drab-nu.vercel.app/"
};

/**
 * Core logic to remove the background from an image buffer using PixelCut API.
 * @param {Buffer} image - The image data buffer.
 * @returns {Promise<Buffer>} The resulting image buffer with a transparent background.
 */
async function removeBackground(image) {
    if (!Buffer.isBuffer(image)) {
        throw new Error("Input must be a media buffer.");
    }

    try {
        const form = new FormData();
        
        // Use fromBuffer to determine mime type, falling back to png
        const fileInfo = await fromBuffer(image) || { ext: "png", mime: "image/png" };
        
        // Append image buffer to form data
        form.append("image", image, { filename: `image.${fileInfo.ext}`, contentType: fileInfo.mime });
        
        // Set output format
        form.append("format", "png");

        const res = await axios.post(API_URL, form, {
            headers: { ...HEADERS, ...form.getHeaders() },
            responseType: "arraybuffer", // Expecting raw image data
            timeout: 25000 // 25 seconds timeout
        });

        // Ensure status is 200 before returning
        if (res.status !== 200) {
            throw new Error(`API returned status ${res.status}.`);
        }

        return Buffer.from(res.data);

    } catch (err) {
        console.error(`[❌ ERROR] PixelCut API call failed: ${err.message}`);
        throw new Error("Gagal remove background! (Failed to remove background)");
    }
}


cmd({
    pattern: "removebg",
    alias: ["nobg", "bgremove"],
    desc: "Removes background from an image using PixelCut AI.",
    react: '✂️',
    category: 'tools',
    limit: true,
    filename: __filename
}, async (conn, m, store, { reply, usedPrefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        // Check both m.mimetype and q.mimetype for robust detection
        const mime = q.mimetype || q.msg?.mimetype || m.mimetype || "";

        if (!/image\/(png|jpe?g|webp)/i.test(mime)) {
            await store.react('❌');
            return reply(
`⚠️ Reply atau kirim foto lalu ketik:

> *${usedPrefix + command}*`
            );
        }

        // 1. Download buffer
        const buff = await q.download();

        // 2. Set processing reaction and send waiting message
        await store.react("⏳");
        await reply("⏳ *Processing... Tunggu bentar ya!*");

        // 3. Process image
        const result = await removeBackground(buff);

        // 4. Send final result
        await conn.sendMessage(m.chat, {
            image: result,
            fileName: "no_bg.png",
            mimetype: "image/png",
            caption: "✅ Background berhasil dihapus! (Background successfully removed!)"
        }, { quoted: m });
        
        await store.react('✅');

    } catch (e) {
        console.error("RemoveBG Command Error:", e);
        await store.react('❌');
        reply("❌ Error: Gagal menghapus background.\nCoba lagi nanti. (Failed to remove background. Try again later.)");
    }
});
