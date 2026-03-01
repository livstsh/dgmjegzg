const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://oploverz.ch';
const http = axios.create({
    baseURL: BASE,
    timeout: 25000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
});

cmd({
    pattern: "animedl",
    react: "📥",
    desc: "Extract download links from Oploverz.",
    category: "download",
    use: ".oplodl <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    const msgKey = m?.key || mek?.key || null;
    try {
        if (!text) return reply("🔗 Please provide a link!");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await conn.sendMessage(from, { text: "📥 *Analyzing link...*" }, { quoted: m });

        const res = await http.get(text);
        const $ = cheerio.load(res.data);
        
        // CHECK: Agar user ne SERIES link diya hai toh episodes dhundho
        if (text.includes('/series/')) {
            let epList = "*⚠️ You provided a Series link. Select an Episode to download:*\n\n";
            $('.eplister ul li a').each((i, el) => {
                if (i < 10) epList += `${i+1}. 🔗 ${$(el).attr('href')}\n\n`;
            });
            
            if (waitMsg && waitMsg.key) {
                return await conn.sendMessage(from, { text: epList + "> Copy an episode link and use .oplodl again.", edit: waitMsg.key });
            }
        }

        // SCRAPING LOGIC: Episode page se links nikalna
        let dlMsg = `📥 *DOWNLOAD LINKS FOUND*\n\n`;
        let found = false;

        $('.soraddlx, .sora_load').each((_, block) => {
            const q = $(block).find('.resolutiontext').text().trim() || "Quality";
            dlMsg += `*📌 ${q}*\n`;
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

        if (!found) throw new Error("Opps! Buttons nahi mile. Please Episode link use karein.");

        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: dlMsg + "\n> © PROVA MD ❤️", edit: waitMsg.key });
        }

    } catch (e) {
        reply(`❌ *Error:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                                        
