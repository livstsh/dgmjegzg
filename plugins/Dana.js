const axios = require("axios");
const { cmd } = require("../command");

// --- List of AI API Endpoints (Used sequentially with fallback) ---
// NOTE: Assuming these APIs return the response text directly or inside a 'result'/'response' field.
const ApiEndpoints = [
    `https://vapis.my.id/api/gemini?q=`,
    `https://api.siputzx.my.id/api/ai/gemini-pro?content=`,
    `https://api.ryzendesu.vip/api/ai/gemini?text=`,
    `https://api.dreaded.site/api/gemini2?text=`,
    `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=`,
    `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=`
];

// Function to fetch AI response with fallback logic
async function fetchAIResponse(query) {
    const encodedQuery = encodeURIComponent(query);

    for (let i = 0; i < ApiEndpoints.length; i++) {
        const baseUrl = ApiEndpoints[i];
        const apiUrl = `${baseUrl}${encodedQuery}`;
        
        console.log(`[AI] Attempting API ${i + 1}/${ApiEndpoints.length}: ${baseUrl.substring(8, 30)}...`);

        try {
            const response = await axios.get(apiUrl, { timeout: 15000 });
            const data = response.data;
            
            // Assuming the API response is either direct text or nested in 'result'/'response'
            const resultText = data.text || data.result || data.response || data.answer || data.message;
            
            if (resultText && typeof resultText === 'string' && resultText.length > 5) {
                return {
                    text: resultText,
                    source: `API ${i + 1}`
                };
            } else {
                 // API responded but provided an empty/invalid answer structure
                throw new Error("Invalid response structure or empty answer.");
            }

        } catch (error) {
            console.warn(`[AI] API ${i + 1} Failed: ${error.message}`);
            // Continue to the next API in the list
        }
    }
    
    return null; // All APIs failed
}

cmd({
    pattern: "gemini",
    alias: ["shahzada", "gptr"],
    desc: "Multiple AI APIs ka upyog karke sawaalon ka jawab deta hai.", // Answers questions using multiple AI APIs.
    category: "ai",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Kripya woh sawaal poochhein jiska jawab aap khojna chahte hain."); // Please ask a question.
        }

        await reply("⏳ Aapke sawaal ka jawab khoja jaa raha hai (Multiple APIs ka istemaal ho raha hai)..."); // Searching for answer...

        const aiResult = await fetchAIResponse(q);

        if (aiResult) {
            const finalMessage = `
💡 *AI Jawab:* 💡
----------------------------------------

${aiResult.text.trim()}

----------------------------------------
*Source:* ${aiResult.source}

_Powered by KAMRAN-MD (AI Fallback System)_`;

            await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        } else {
            return reply("🤷‍♀️ Maaf karein, koi bhi AI service jawab nahi de payi. Kripya doobara prayas karein."); // All services failed.
        }

    } catch (e) {
        console.error("ai command error:", e.message);
        reply("⚠️ AI command process karte samay ek anapekshit truti hui."); // Unexpected error.
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
