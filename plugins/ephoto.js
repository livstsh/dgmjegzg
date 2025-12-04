const { cmd } = require("../command");
const axios = require("axios");
const Buffer = require('buffer').Buffer;
const fetch = require('node-fetch'); // Required for uploading image buffer

// --- API Endpoints ---
const REMINI_API_BASE = "https://edith-apis.vercel.app/imagecreator/remini?url=";

// --- Helper function to get Image URL (using a reliable upload service) ---
async function uploadImageAndGetUrl(imageBuffer) {
    try {
        // Upload the image buffer to a public host (e.g., Telegraph)
        const uploadResponse = await axios.post('https://telegra.ph/upload', Buffer.from(imageBuffer, 'binary'), {
            headers: { 'Content-Type': 'image/jpeg' },
            timeout: 15000
        });
        
        // Assuming telegraph returns an array of file objects
        const imageUrl = 'https://telegra.ph' + uploadResponse.data[0].src; 
        
        if (!imageUrl) throw new Error("Telegraph upload se link nahi mila.");
        return imageUrl;
        
    } catch (uploadError) {
        console.error("Upload Error:", uploadError.message);
        throw new Error("❌ Photo ko server par upload karne mein dikkat aayi.");
    }
}

cmd({
    pattern: "remini",
    alias: ["enhance", "hd", "aihd"],
    desc: "Reply ki gayi photo ki quality Remini API se behtar karta hai.", // Enhances image quality using Remini API.
    category: "ai",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        // Get the quoted message object (most reliable object for media download)
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || mek.message;
        
        // Check if the quoted message contains an image
        const quotedImageMessage = quoted?.imageMessage || quoted?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!quotedImageMessage) {
            return reply(`❌ Kripya us *photo* ko reply karein jise aap behtar (enhance) karna chahte hain.`); 
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply("⏳ Photo mil gayi. Remini AI se quality behtar ki jaa rahi hai, kripya intezaar karein...");

        // 2. Download the image buffer using the specific message object that contains the media key
        // We use the entire quoted message object as the parameter for download
        const imageBuffer = await conn.downloadMediaMessage(quotedImageMessage);

        if (!imageBuffer || imageBuffer.length === 0) {
             throw new Error("Download kiya gaya buffer empty hai. Media key galat hai.");
        }
        
        // 3. Upload image to get a direct public URL
        const publicImageUrl = await uploadImageAndGetUrl(imageBuffer);

        // 4. Construct API URL and call the new endpoint
        const apiUrl = `${REMINI_API_BASE}${encodeURIComponent(publicImageUrl)}`;

        const response = await axios.get(apiUrl, { timeout: 45000 }); // Extended timeout
        const data = response.data;
        
        // 5. Check API response
        if (!data || data.status !== true || !data.result) {
            console.error("Remini API response:", data);
            throw new Error(data.message || "Photo quality behtar nahi ho payi. Ho sakta hai API busy ho."); // Enhancement failed.
        }

        const enhancedImageUrl = data.result;

        // 6. Send the enhanced image back
        await conn.sendMessage(from, {
            image: { url: enhancedImageUrl },
            caption: `✅ *Photo Quality Behtar Hui!* ✨\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        // Specific check for the 'media key' error
        if (e.message.includes('media key')) {
            reply(`⚠️ Photo behtar karte samay truti aayi: Download mein dikkat. Kripya nischit karein ki aap *seedhi photo* (forwarded nahi) ko reply kar rahe hain.`);
        } else {
            reply(`⚠️ Photo behtar karte samay truti aayi: ${e.message}`);
        }
        console.error("Remini command error:", e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
