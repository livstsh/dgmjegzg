const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * KBBI Scraper Function
 */
async function kbbi(kata) {
    try {
        const { data } = await axios.get(`https://kbbi.web.id/${encodeURIComponent(kata)}`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
            }
        });
        
        const $ = cheerio.load(data);
        // Selector #d1 KBBI web par main definition content hota hai
        const result = $('#d1').text().trim();
        return result || null;
    } catch (e) {
        return null;
    }
}

// --- Command Structure ---
cmd({
    pattern: "kbbi",
    alias: ["arti", "kamus", "makna"],
    react: "📖",
    desc: "Cari arti kata di Kamus Besar Bahasa Indonesia (KBBI)",
    category: "tools",
    use: ".kbbi <kata>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Masukkan kata yang ingin dicari!\nContoh: .kbbi gadget");

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const arti = await kbbi(q);

        if (!arti) {
            return reply(`❌ Kata *"${q}"* tidak ditemukan dalam KBBI.`);
        }

        let message = `📖 *KAMUS BESAR BAHASA INDONESIA*\n\n`;
        message += `${arti}\n\n`;
        message += `> © PROVA-MD ❤️`;

        await reply(message);
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Terjadi kesalahan saat menghubungi server KBBI.");
    }
});
