const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://oploverz.ch';
const http = axios.create({
    baseURL: BASE,
    timeout: 25000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
});

// --- IMPROVED DOWNLOAD COMMAND ---
cmd({
    pattern: "animedl",
    react: "📥",
    desc: "Extract download links from Oploverz.",
    category: "download",
    use: ".oplodl <episode_url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    const msgKey = m?.key || mek?.key || null;
    try {
        if (!text) return reply("🔗 Please provide an EPISODE link (not series link)!");

        // Error prevention for "key" reading
        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await conn.sendMessage(from, { text: "📥 *Searching for download buttons...*" }, { quoted: m });

        const res = await http.get(text);
        const $ = cheerio.load(res.data);
        
        // Scraping both table and list formats
        let dlMsg = `📥 *DOWNLOAD LINKS EXTRACTED*\n\n`;
        let found = false;

        // Selector 1: Standard quality table
        $('.soraddlx').each((_, block) => {
            const quality = $(block).find('.resolutiontext').text().trim() || "Quality";
            dlMsg += `*📌 ${quality}*\n`;
            $(block).find('a').each((__, a) => {
                const srv = $(a).text().trim();
                const url = $(a).attr('href');
                if (url && url.startsWith('http')) {
                    dlMsg += `  ↳ ${srv}: ${url}\n`;
                    found = true;
                }
            });
            dlMsg += `\n`;
        });

        // Selector 2: Link list (Mobile/Simple view)
        if (!found) {
            $('.dllink a, .download-links a').each((_, a) => {
                const url = $(a).attr('href');
                if (url && url.startsWith('http')) {
                    dlMsg += `📍 ${$(a).text().trim() || 'Link'}: ${url}\n`;
                    found = true;
                }
            });
        }

        if (!found) throw new Error("Opps! Is link par download buttons nahi mile. Kya aapne Episode link use kiya hai?");

        dlMsg += `\n> © PROVA MD ❤️`;

        // Safe Edit logic
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: dlMsg, edit: waitMsg.key });
        } else {
            await reply(dlMsg);
        }

    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
        
