const axios = require("axios");
// Assuming 'cmd' and 'commands' are defined in the command file as per the user's snippet
const { cmd, commands } = require("../command");

// [FIXED] The base URL has been updated to include the 'query=' parameter key.
const API_BASE_URL = "https://delirius-apiofc.vercel.app/search/googlesearch?query=";

cmd({
    pattern: "dsearch",
    alias: ["deliriussearch", "dgoogle"],
    desc: "Performs a Google Search using the Delirius API endpoint.",
    react: "🔍",
    category: "external",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("Kripya search karne ke liye koi query dein! Example: .dsearch Chandrayaan-3 latest updates");
        }

        // 1. Construct the full API URL with the encoded query
        const searchUrl = `${API_BASE_URL}${encodeURIComponent(query)}`;

        await reply("🔍 Delirius API dwara web search ho raha hai, kripya intezaar karein...");

        // 2. Make the API request
        const { data } = await axios.get(searchUrl);

        // --- DEBUGGING: API Response ko check karne ke liye log karein ---
        console.log("--- Delirius API Response (For Debugging) ---");
        console.log("Status:", data.status);
        console.log("Full Data Structure:", data);
        console.log("-----------------------------------------------");
        // -----------------------------------------------------------------

        // 3. Process the response
        if (!data || data.status !== 200 || !data.results || data.results.length === 0) {
            
            // Log a specific message if no results are found
            if (data && data.status === 200 && (!data.results || data.results.length === 0)) {
                console.error("API returned Status 200 but the 'results' array was empty or missing.");
            } else if (data && data.status !== 200) {
                console.error(`API returned a non-200 status code: ${data.status}. Assuming failure.`);
            }

            return reply("Aapki query ke liye koi result nahi mila ya API ka response galat hai. Kripya doosra keyword ya query try karein.");
        }

        // Assuming the first result contains the main snippet or answer
        const firstResult = data.results[0];

        let responseText = `*🔍 Delirius Google Search Result:*\n\n`;

        // Check if there's a main answer/snippet
        if (data.answer) {
            responseText += `*Answer:* ${data.answer}\n\n`;
        }

        responseText += `*Title:* ${firstResult.title}\n`;
        responseText += `*Source:* ${firstResult.source}\n`;
        responseText += `*Snippet:* ${firstResult.snippet}\n\n`;

        responseText += `*Link:* ${firstResult.url}`;


        // 4. Send the final formatted message
        await reply(responseText);
        
    } catch (error) {
        // Log detailed error for debugging
        console.error("Error in dsearch command:", error);
        if (error.response) {
            // If the error is a status code outside the 2xx range
            console.error("API Response Status (Catch Block):", error.response.status);
            console.error("API Response Data (Catch Block):", error.response.data);
            reply(`❌ Sorry, API se data fetch karne mein error aaya. Status Code: ${error.response.status}. Console mein detailed info dekhein.`);
        } else {
            reply("❌ Sorry, search command mein koi samasya (problem) aayi. Kripya phir se try karein.");
        }
    }
});
