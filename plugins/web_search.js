const axios = require("axios");
// Assuming 'cmd' and 'commands' are defined in the command file as per the user's snippet
const { cmd, commands } = require("../command");

// --- API Configuration and Helper Functions ---

// The API key is assumed to be provided by the runtime environment.
const apiKey = "";
const apiUrl = `https://delirius-apiofc.vercel.app/search/googlesearch?query=}`;

/**
 * Parses the Gemini API response to extract text and grounding sources.
 * @param {object} result - The parsed JSON response from the API.
 * @returns {object} - Object containing the generated text and an array of sources.
 */
function processResponse(result) {
    const candidate = result.candidates?.[0];
    let text = "Could not generate content. Please try again.";
    let sources = [];

    if (candidate && candidate.content?.parts?.[0]?.text) {
        text = candidate.content.parts[0].text;

        const groundingMetadata = candidate.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingAttributions) {
            sources = groundingMetadata.groundingAttributions
                .map(attribution => ({
                    uri: attribution.web?.uri,
                    title: attribution.web?.title,
                }))
                .filter(source => source.uri && source.title);
        }
    }
    return { text, sources };
}

/**
 * Fetches data from the Gemini API with exponential backoff for retries.
 * @param {object} payload - The request body for the API.
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<object>} - The processed response data (text and sources).
 */
async function fetchWithRetry(payload, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.post(apiUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            return processResponse(response.data);
        } catch (error) {
            if (i < maxRetries - 1) {
                // Exponential backoff
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                // Do not log retry attempts in the console as an error
            } else {
                throw new Error("Failed to fetch content from the API after multiple retries.");
            }
        }
    }
}


// --- Command Definition ---

cmd({
    pattern: "sech",
    alias: ["gsearch", "web", "google"],
    desc: "Performs a Google-grounded web search using the Gemini API for current information.",
    react: "🌐",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const userQuery = args.join(" ");
        if (!userQuery) {
            return reply("Please provide a search query! Example: .search What are the latest tech stock market movements?");
        }

        // 1. Construct the API payload for Google Search Grounding
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            // Enable Google Search grounding tool
            tools: [{ "google_search": {} }],
            // Optional: System instruction to guide the model's response format
            systemInstruction: {
                parts: [{ text: "You are a concise and helpful web search assistant. Summarize the search results directly and clearly." }]
            },
        };

        await reply("🌐 Searching the web, please wait...");

        // 2. Fetch the data
        const { text, sources } = await fetchWithRetry(payload);

        let responseText = `*🌐 Google Search Results:*\n\n${text}\n\n`;

        // 3. Append Sources/Citations
        if (sources.length > 0) {
            responseText += `\n\n*📚 Sources:*\n`;
            // Limit to top 5 sources for brevity
            sources.slice(0, 5).forEach((source, index) => {
                responseText += `${index + 1}. *Title:* ${source.title}\n   *URL:* ${source.uri}\n`;
            });
            if (sources.length > 5) {
                 responseText += `...and ${sources.length - 5} more sources.\n`;
            }
        }

        // 4. Send the final formatted message
        await reply(responseText);

    } catch (error) {
        console.error("Error in web search command:", error);
        reply("❌ Sorry, I encountered an error while processing the web search. This might be due to a connection issue or an API problem.");
    }
});
