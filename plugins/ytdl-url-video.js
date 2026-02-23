const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "cricnews",
    alias: ["cricketnews", "cricbuzz"],
    desc: "Get latest cricket news from Cricbuzz",
    category: "news",
    react: "🏏",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://arslan-apis.vercel.app/news/cricbuzz`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.status || !res.data.result || res.data.result.length === 0) {
            return reply("❌ No cricket news found at the moment.");
        }

        const newsList = res.data.result;
        let responseMsg = `🏏 *LATEST CRICKET NEWS* 🏏\n\n`;

        // Pehli 5 bari khabrein dikhane ke liye
        newsList.slice(0, 5).forEach((news, index) => {
            responseMsg += `*${index + 1}. ${news.title}*\n`;
            responseMsg += `📰 ${news.description || "No description available"}\n`;
            responseMsg += `🔗 _Read more:_ ${news.url}\n\n`;
        });

        responseMsg += `> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*`;

        // Agar news ke sath image bhejni ho (pehli news ki thumbnail)
        if (newsList[0].image) {
            await conn.sendMessage(from, {
                image: { url: newsList[0].image },
                caption: responseMsg
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: responseMsg }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Cricbuzz News Error:", e);
        reply("❌ Error fetching news. Please try again later.");
    }
});
