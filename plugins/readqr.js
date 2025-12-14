const axios = require("axios");
const { cmd, commands } = require("../command");
const FormData = require('form-data'); // Node.js file uploads ke liye zaroori

// QR Code Reading API Endpoint
const API_URL = "https://api.qrserver.com/v1/read-qr-code/";

cmd({
    pattern: "readqr",
    alias: ["qrreader", "scanqr"],
    react: "📷",
    desc: "Reads and extracts the content from a QR code image.",
    category: "tools",
    filename: __filename,
},
async (conn, m, store, { from, quoted, reply, usedPrefix, command }) => {
    try {
        // 1. Check for quoted image and download the buffer
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || "";
        
        if (!mime.startsWith("image/")) {
            return reply(`*Reply atau kirim gambar QR Code*\n*Example: ${usedPrefix + command}*`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Download the image buffer (assuming conn.downloadMediaMessage works)
        const buffer = await conn.downloadMediaMessage(q);
        
        if (!buffer || buffer.length === 0) {
            throw new Error("Gagal mengunduh gambar buffer.");
        }

        // 2. Prepare FormData for file upload
        const form = new FormData();
        // Append Buffer with options
        form.append("file", buffer, {
            filename: "qrcode.png",
            contentType: mime // Use actual mime type or default to image/png
        });

        // 3. Upload the file to the QR API
        const response = await axios.post(API_URL, form, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                ...form.getHeaders() // Crucial for multipart/form-data boundary
            }
        });

        const json = response.data;
        // The API returns an array of symbol objects
        const result = json?.[0]?.symbol?.[0];

        // 4. Validate and process the result
        if (!result || result.error || !result.data) {
            console.error("QR Reader API Response Failed:", JSON.stringify(json, null, 2));
            return reply(`🍂 *Gagal membaca QR Code.*\nPastikan gambar jelas dan tidak blur. Error Status: ${result.error || 'N/A'}`);
        }
        
        if (result.data.trim().toLowerCase() === '(not found)') {
             return reply(`🍂 *Gagal membaca QR Code.*\nKoi QR code data nahi mila. Pastikan gambar mein ek hi QR code ho.`);
        }

        let output = `
📷 *QR Code Berhasil Dibaca*
━━━━━━━━━━━━━━
📄 *Isi QR:*
${result.data}
━━━━━━━━━━━━━━
        `.trim();

        await reply(output);
        
    } catch (e) {
        // Log error and send user-friendly message
        let errorMessage = `🍂 *Terjadi kesalahan saat memproses QR Code.*`;
        if (e.response) {
            errorMessage += ` API Status: ${e.response.status}.`;
        }
        console.error("❌ Error in readqr command:", e);
        reply(errorMessage);
    } finally {
        await conn.sendMessage(from, { react: { text: "", key: m.key } });
    }
});
