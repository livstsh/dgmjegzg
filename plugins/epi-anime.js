const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://oploverz.ch';
const http = axios.create({
    baseURL: BASE,
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36' }
});

const abs = (href) => href && (href.startsWith('http') ? href : BASE + (href.startsWith('/') ? '' : '/') + href);

// --- BOT COMMAND ---
cmd({
    pattern: "oplo",
    alias: ["anime", "oploverz"],
    react: "📺",
    desc: "Search and Get Download links from Oploverz.",
    category: "download",
    use: ".oplo naruto",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔍 Please provide an anime name!\nExample: .oplo one piece");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        let waitMsg = await conn.sendMessage(from, { text: "📺 *Searching Oploverz...*" }, { quoted: m });

        // 1. Search Anime
        const res = await http.get(`/?s=${encodeURIComponent(text)}`);
        const $ = cheerio.load(res.data);
        const results = [];

        $('article.bs').each((_, el) => {
            const title = $(el).find('h2').text().trim();
            const link = abs($(el).find('a').attr('href'));
            const eps = $(el).find('.epx').text().trim();
            if (title && link) results.push({ title, link, eps });
        });

        if (!results.length) throw new Error("Anime not found.");

        // 2. Format Results
        let resultMsg = `📺 *OPLOVERZ SEARCH RESULTS*\n\n`;
        results.slice(0, 10).forEach((v, i) => {
            resultMsg += `${i + 1}. *${v.title}*\n   Eps: ${v.eps}\n   🔗 ${v.link}\n\n`;
        });
        resultMsg += `\n*Note:* Use .oplodl <link> to get download links.\n> © PROVA MD ❤️`;

        // SAFE EDIT
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: resultMsg, edit: waitMsg.key });
        } else {
            await reply(resultMsg);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        reply(`❌ *Error:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});

// --- DOWNLOAD COMMAND ---
cmd({
    pattern: "oplodl",
    react: "📥",
    desc: "Get Download links for a specific anime/episode.",
    category: "download",
    use: ".oplodl <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    const msgKey = m?.key || mek?.key || null;
    try {
        if (!text || !text.includes('oploverz.ch')) return reply("🔗 Please provide a valid Oploverz link.");

        let waitMsg = await conn.sendMessage(from, { text: "📥 *Extracting Download Links...*" }, { quoted: m });

        const res = await http.get(text);
        const $ = cheerio.load(res.data);
        const title = $('h1').first().text().trim();
        let dlMsg = `📥 *DOWNLOAD LINKS:* ${title}\n\n`;

        $('.soraddlx').each((_, block) => {
            const quality = $(block).find('.resolutiontext').text().trim();
            dlMsg += `*Quality: ${quality}*\n`;
            $(block).find('a').each((__, a) => {
                dlMsg += `  ▸ ${$(a).text().trim()}: ${$(a).attr('href')}\n`;
            });
            dlMsg += `\n`;
        });

        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: dlMsg, edit: waitMsg.key });
        } else {
            await reply(dlMsg);
        }
    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
    }
});

