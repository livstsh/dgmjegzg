const { cmd } = require('../command');
const cheerio = require('cheerio');

// --- SCRAPER FUNCTION ---
async function fetchNanoreview() {
    try {
        const html = await cloudscraper.get('https://nanoreview.net/en/soc-list/rating');
        const $ = cheerio.load(html);
        const processors = [];

        $('table.table-list tbody tr').each((i, el) => {
            if (i >= 20) return false; // صرف ٹاپ 20 دکھانے کے لیے (زیادہ ڈیٹا سے میسج فیل ہو سکتا ہے)
            const tds = $(el).find('td');
            processors.push({
                rank: $(tds[0]).text().trim(),
                name: $(tds[1]).find('a').text().trim(),
                manufacturer: $(tds[1]).find('.text-gray-small').text().trim(),
                rating: $(tds[2]).text().trim().replace(/\n/g, ' '),
                antutu: $(tds[3]).text().trim(),
                geekbench: $(tds[4]).text().trim(),
                clock: $(tds[6]).text().trim()
            });
        });
        return processors;
    } catch (e) {
        console.error("Nanoreview Error:", e);
        return null;
    }
}

// --- COMMAND ---
cmd({
    pattern: "cpu",
    alias: ["soc", "ranking", "nanoreview"],
    react: "📱",
    desc: "Get top mobile processor rankings from Nanoreview.",
    category: "tools",
    filename: __filename
},           
async (conn, mek, m, { from, reply }) => {
    try {
        // --- TRUE LID FIX ---
        const targetChat = conn.decodeJid(from);

        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });
        
        const data = await fetchNanoreview();
        if (!data || data.length === 0) return reply("❌ Failed to fetch data from Nanoreview.");

        let caption = `🏆 *TOP MOBILE PROCESSORS (Nanoreview)* 🏆\n\n`;

        data.forEach((v) => {
            caption += `*Rank ${v.rank}:* ${v.name} (${v.manufacturer})\n`;
            caption += `⭐ *Rating:* ${v.rating}\n`;
            caption += `🚀 *AnTuTu:* ${v.antutu} | ⚙️ *Clock:* ${v.clock}\n`;
            caption += `--------------------------------\n`;
        });

        caption += `\n*LID Fix Active - Knight Bot*`;

        await conn.sendMessage(targetChat, { 
            text: caption 
        }, { quoted: mek });

        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        reply("❌ An error occurred while processing the request.");
    }
});
