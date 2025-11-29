const axios = require("axios");
// Assuming 'cmd' and 'commands' are defined in the command file as per the user's snippet
const { cmd, commands } = require("../command");

// [FIXED] The base URL has been updated to include the 'query=' parameter key.
// Pehle yeh tha: "https://delirius-apiofc.vercel.app/search/googlesearch?="
// Ab yeh hai:
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
        // Now it correctly forms: ...googlesearch?query=encoded_query
        const searchUrl = `${API_BASE_URL}${encodeURIComponent(query)}`;

        await reply("🔍 Delirius API dwara web search ho raha hai, kripya intezaar karein...");

        // 2. Make the API request
        const { data } = await axios.get(searchUrl);

        // 3. Process the response (Assuming the API returns a standard structure with results)
        // Checking for a successful status code 200 is important
        if (!data || data.status !== 200 || !data.results || data.results.length === 0) {
            // If the status is 200 but results are empty (API logic)
            return reply("Aapki query ke liye koi result nahi mila. Kripya doosra keyword try karein.");
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
            // If the error is still a 400 or another error status
            console.error("API Response Status:", error.response.status);
            console.error("API Response Data:", error.response.data);
            reply(`❌ Sorry, API se data fetch karne mein error aaya. Status Code: ${error.response.status}. Console mein detailed info dekhein.`);
        } else {
            reply("❌ Sorry, search command mein koi samasya (problem) aayi. Kripya phir se try karein.");
        }
    }
});
