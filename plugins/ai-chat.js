const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch');

cmd({
    pattern: "ai",
    alias: ["gemini4"],
    react: "🤖",
    desc: "AI Chat (GPT / Gemini)",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, body, reply }) => {

    try {

        const text = body.split(" ").slice(1).join(" ");
        if (!text) return reply("Example:\n.gpt write a html code");

        await conn.sendMessage(from, {
            react: { text: "🤖", key: mek.key }
        });

        // ===== GPT API =====
        if (body.startsWith(".gpt")) {

            const res = await axios.get(
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`
            );

            if (res.data && res.data.status && res.data.result) {
                return reply(res.data.result);
            } else {
                return reply("❌ GPT API Error");
            }

        }

        // ===== GEMINI APIs (Auto Fallback) =====
        if (body.startsWith(".gemini")) {

            const apis = [
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`,
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`,
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`,
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`
            ];

            for (let api of apis) {
                try {
                    const response = await fetch(api);
                    const data = await response.json();

                    const answer =
                        data.message ||
                        data.data ||
                        data.answer ||
                        data.result;

                    if (answer) {
                        return reply(answer);
                    }

                } catch (e) {
                    continue;
                }
            }

            return reply("❌ All Gemini APIs Failed");
        }

    } catch (err) {
        console.log(err);
        return reply("❌ Failed to get response. Try again later.");
    }

});
