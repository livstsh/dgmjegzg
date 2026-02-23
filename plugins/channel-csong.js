const { cmd } = require("../command");
const axios = require("axios");

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*";

// --- 1. XVIDEOS SEARCH ONLY ---
cmd({
    pattern: "xsearch",
    alias: ["xvideo-search"],
    desc: "Search videos on XVideos",
    category: "search",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a search query.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://arslan-apis.vercel.app/download/xvideosSearch?text=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);

        if (!res.data?.status || !res.data.result || res.data.result.length === 0) {
            return reply("❌ No results found on XVideos.");
        }

        let searchMsg = `🔍 *XVIDEOS SEARCH RESULTS*\n\n`;
        res.data.result.slice(0, 10).forEach((vid, i) => {
            searchMsg += `*${i + 1}.* 📌 *Title:* ${vid.title}\n`;
            searchMsg += `⏳ *Duration:* ${vid.duration || "N/A"}\n`;
            searchMsg += `🔗 *Link:* ${vid.url || vid.link}\n\n`;
        });

        searchMsg += FOOTER;
        await reply(searchMsg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Error fetching search results.");
    }
});

// --- 2. XNXX SEARCH ONLY ---
cmd({
    pattern: "xnxxsearch",
    alias: ["nxsearch"],
    desc: "Search videos on XNXX",
    category: "search",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a search query.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://arslan-apis.vercel.app/download/xnxx?text=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);

        if (!res.data?.status || !res.data.result || res.data.result.length === 0) {
            return reply("❌ No results found on XNXX.");
        }

        let searchMsg = `🔍 *XNXX SEARCH RESULTS*\n\n`;
        res.data.result.slice(0, 10).forEach((vid, i) => {
            searchMsg += `*${i + 1}.* 📌 *Title:* ${vid.title}\n`;
            searchMsg += `🔗 *Link:* ${vid.link}\n\n`;
        });

        searchMsg += FOOTER;
        await reply(searchMsg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Error fetching search results.");
    }
});
              
