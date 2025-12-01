const axios = require("axios");
const { cmd } = require("../command");

const REMINI_API_URL = "https://api.privatezia.biz.id/api/generator/remini?url=";

// Utility function to extract the image URL from a replied message (Simplified approach)
function getQuotedImageUrl(quotedMsg) {
    // Check if the replied message contains an image and try to extract the URL/ID.
    // NOTE: Replace this logic with your bot's actual media retrieval system if needed.
    const image = quotedMsg?.imageMessage || quotedMsg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    
    // In many simple frameworks, the media URL is available here.
    if (image) {
        // We return the URL directly for the external API call
        return image.url || null; 
    }
    return null;
}

cmd({
    pattern: "remini",
    alias: ["enhance", "hd", "aihd"],
    desc: "Bheji gayi photo ki quality Remini API se behtar karta hai.", // Enhances image quality using Remini API.
    category: "ai",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // 1. Check if the message is a reply to an image
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isReplyToImage = quoted?.imageMessage || (quoted?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage);

        if (!isReplyToImage) {
            return reply("❌ Kripya us *photo* ko reply karein jise aap behtar (enhance) karna chahte hain."); // Please reply to the photo.
        }
        
        // 2. Extract the Image URL
        const imageUrl = getQuotedImageUrl(mek.message.extendedTextMessage.contextInfo.quotedMessage);

        if (!imageUrl) {
            return reply("❌ Photo ka URL nahi mil paya. Kripya nishchit karein ki yeh seedhi photo hai (link nahi)."); // Failed to get image URL.
        }
        
        await reply("⏳ Photo mil gayi. Remini AI se quality behtar ki jaa rahi hai, kripya intezaar karein..."); // Enhancing image, please wait...

        // 3. Construct API URL and call
        const apiUrl = `${REMINI_API_URL}${encodeURIComponent(imageUrl)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;
        
        // 4. Check API response (Assuming API returns the final image URL in data.result)
        if (!data || data.status !== true || !data.result) {
            console.error("Remini API response:", data);
            return reply("❌ Photo quality behtar nahi ho payi. Ho sakta hai API busy ho ya photo ka format sahi na ho."); // Enhancement failed.
        }

        const enhancedImageUrl = data.result;

        // 5. Send the enhanced image back
        await conn.sendMessage(from, {
            image: { url: enhancedImageUrl },
            caption: `✅ *Photo Quality Behtar Hui!* ✨\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ remini command error:", e.message);
        reply("⚠️ Photo behtar karte samay ek truti hui. Kripya koshish karein ki photo bahut badi na ho."); // An error occurred during enhancement.
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
