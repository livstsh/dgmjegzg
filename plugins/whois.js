const axios = require("axios");
const { cmd, commands } = require("../command");

// The base URL for the Waifu API
const API_BASE_URL = "https://theresapis.vercel.app/anime/waifu";

cmd({
    pattern: "wai",
    alias: ["animegirl", "husbando"],
    desc: "Fetches a random Waifu image from the API.",
    react: "💖",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        await reply("💖 Searching for a random Waifu, please wait...");

        // 1. Make the API request
        const response = await axios.get(API_BASE_URL);
        const data = response.data;
        
        // --- DEBUGGING: API Response ko check karne ke liye log karein ---
        console.log("--- Waifu API Response (For Debugging) ---");
        console.log("Full Data Structure:", data);
        console.log("------------------------------------------");
        // -----------------------------------------------------------------

        // 2. Process the response (Assuming the link is in 'url' or 'image' field)
        let imageUrl = data.url || data.image || data.link;

        if (!imageUrl) {
            return reply("❌ Image link API se nahi mila. Ho sakta hai API ka structure badal gaya ho ya response galat ho.");
        }
        
        // 3. Send the image message
        await conn.sendMessage(
            from,
            {
                image: { url: imageUrl },
                caption: "*Anime Waifu:* Enjoy this random pick! 💖",
            },
            { quoted: m }
        );
        
    } catch (error) {
        // Log detailed error for debugging
        console.error("Error in waifu command:", error);
        if (error.response) {
            console.error("API Response Status:", error.response.status);
            reply(`❌ Sorry, Waifu API se data fetch karne mein error aaya. Status Code: ${error.response.status}`);
        } else {
            reply("❌ Sorry, waifu command mein koi samasya (problem) aayi. Kripya phir se try karein.");
        }
    }
});
