const axios = require("axios");
const { cmd, commands } = require("../command");

// The base URL for the Al-Quran search API
const API_BASE_URL = "https://api.nexoracle.com/islamic/al-quran?q=";

cmd({
    pattern: "quran",
    alias: ["alquran", "islamicsearch"],
    desc: "Search for verses (Ayat) in the Al-Quran by keyword or phrase.",
    react: "📖",
    category: "islamic",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(" ");
        
        if (!query) {
            return reply("Kripya khojne ke liye koi keyword ya phrase dein! Example: .quran Jannat ka zikr");
        }

        // 1. Construct the full API URL with the encoded query
        const searchUrl = `${API_BASE_URL}${encodeURIComponent(query)}`;

        await reply("📖 Al-Quran mein khoj ho rahi hai, kripya intezaar karein...");

        // 2. Make the API request
        const { data } = await axios.get(searchUrl);

        // 3. Process the response (Assuming results are in data.data array)
        if (!data || data.status !== 200 || !data.data || data.data.length === 0) {
            // Log for debugging if the structure is unexpected
            console.error("Quran API returned insufficient data or non-200 status:", data);
            
            return reply(`Aapki query ("${query}") ke liye Quran mein koi Ayat nahi mili. Kripya doosra keyword try karein.`);
        }

        // Only display the top 3 results to keep the message brief
        const topResults = data.data.slice(0, 3);
        
        let responseText = `*📖 Al-Quran Search Results for: "${query}"*\n\n`;

        topResults.forEach((result, index) => {
            // Ensure translation exists, as it's the main informative part
            if (result.translation && result.arabic_text) {
                responseText += `*--- Result ${index + 1} ---\n`;
                // Assuming result has surah_name, surah_number, and ayah_number
                responseText += `*Surah:* ${result.surah_name || 'N/A'} (No. ${result.surah_number}), *Ayah:* ${result.ayah_number}\n`;
                // Use a separator for the Arabic text
                responseText += `\n*Arabic Text:*\n${result.arabic_text}\n`;
                responseText += `\n*Translation:*\n${result.translation}\n\n`;
            }
        });
        
        if (data.data.length > 3) {
            responseText += `_... Aur ${data.data.length - 3} aur results uplabdh hain._`;
        }
        
        // 4. Send the final formatted message
        await reply(responseText);
        
    } catch (error) {
        // Log detailed error for debugging
        console.error("Error in quran command:", error);
        if (error.response) {
            console.error("API Response Status:", error.response.status);
            reply(`❌ Sorry, Quran API se data fetch karne mein error aaya. Status Code: ${error.response.status}`);
        } else {
            reply("❌ Sorry, quran search command mein koi samasya (problem) aayi. Kripya phir se try karein.");
        }
    }
});
