const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://oploverz.ch';

// Optimized Axios Instance
const http = axios.create({
    baseURL: BASE,
    timeout: 25000,
    headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }
});

const abs = (href) => href && (href.startsWith('http') ? href : BASE + (href.startsWith('/') ? '' : '/') + href);

// --- SEARCH COMMAND ---
cmd({
    pattern: "oplo",
    alias: ["anime", "oploverz"],
    react: "📺",
    desc: "Search anime from Oploverz.",
    category: "download",
    use: ".oplo naruto",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔍 Please provide an anime name!\nExample: .oplo one piece");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Step 1: Send Wait Message
        const waitMsg = await conn.sendMessage(from, { text: "📺 *Searching Oploverz...*" }, { quoted: m });

        const res = await http.get(`/?s=${encodeURIComponent(text)}`);
        const $ = cheerio.load(res.data);
        const results = [];

        $('article.bs').each((_, el) => {
            const title = $(el).find('h2').text().trim();
            const link = abs($(el).find('a').attr('href'));
            const eps = $(el).find('.epx').text().trim() || 'N/A';
            if (title && link) results.push({ title, link, eps });
        });

        if (results.length === 0) throw new Error("Anime not found. Try another keyword.");

        let resultMsg = `📺 *OPLOVERZ SEARCH RESULTS*\n\n`;
        results.slice(0, 10).forEach((v, i) => {
            resultMsg += `*${i + 1}. ${v.title}*\n   ✨ Eps: ${v.eps}\n   🔗 ${v.link}\n\n`;
        });
        resultMsg += `\n> Use *.oplodl <link>* to get downloads.\n> © PROVA MD ❤️`;

        // SAFE EDIT
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: resultMsg, edit: waitMsg.key });
        } else {
            await reply(resultMsg);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Search Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});

// --- DOWNLOAD COMMAND ---
cmd({
    pattern: "oplodl",
    react: "📥",
    desc: "Extract download links from Oploverz.",
    category: "download",
    use: ".oplodl <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    const msgKey = m?.key || mek?.key || null;
    try {
        if (!text || !text.includes('oploverz.ch')) return reply("🔗 Invalid link! Please provide an Oploverz URL.");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await conn.sendMessage(from, { text: "📥 *Extracting Links...*" }, { quoted: m });

        const res = await http.get(text);
        const $ = cheerio.load(res.data);
        const title = $('h1.entry-title').text().trim() || 'Anime Download';
        
        let dlMsg = `📥 *DOWNLOAD LINKS:* ${title}\n\n`;
        let found = false;

        // Try different selectors for better link extraction
        $('.soraddlx, .sora_load, .dl-block').each((_, block) => {
            const quality = $(block).find('.resolutiontext, strong').first().text().trim() || "HD";
            dlMsg += `*Quality: ${quality}*\n`;
            
            $(block).find('a').each((__, a) => {
                const srv = $(a).text().trim() || "Server";
                const link = $(a).attr('href');
                if (link && link.startsWith('http')) {
                    dlMsg += `  ▸ ${srv}: ${link}\n`;
                    found = true;
                }
            });
            dlMsg += `\n`;
        });

        if (!found) {
            // Fallback for single links
            $('.dllink a').each((_, a) => {
                dlMsg += `▸ ${$(a).text().trim()}: ${$(a).attr('href')}\n`;
                found = true;
            });
        }

        if (!found) throw new Error("No download links found on this page.");

        dlMsg += `\n> © PROVA MD ❤️`;

        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: dlMsg, edit: waitMsg.key });
        } else {
            await reply(dlMsg);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
    
