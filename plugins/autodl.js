const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Hashing logic provided by user
 */
function generateHash(url, key) {
    const base64Url = Buffer.from(url).toString('base64');
    const base64Key = Buffer.from(key).toString('base64');
    return base64Url + (url.length + 1000) + base64Key;
}

/**
 * Scraper function for anydownloader.com
 */
async function anyDL(link) {
    try {
        // Step 1: Get Token from Homepage
        const homepage = await axios.get('https://anydownloader.com/en', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(homepage.data);
        const tokenValue = $('input[name="token"]').val();
        
        if (!tokenValue) throw new Error('Token not found!');

        // Step 2: Prepare Hash & Data
        const hashValue = generateHash(link, 'api');
        const formData = new URLSearchParams();
        formData.append('url', link);
        formData.append('token', tokenValue);
        formData.append('hash', hashValue);

        // Step 3: Fetch Download Links
        const res = await axios.post('https://anydownloader.com/wp-json/api/download/', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://anydownloader.com/en',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        return res.data;
    } catch (e) {
        throw e;
    }
}

// --- Command Structure ---
cmd({
    pattern: "aiopro",
    alias: ["anydl", "down"],
    react: "📥",
    desc: "All-in-one media downloader using AnyDownloader API",
    category: "download",
    use: ".aiopro <link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide a valid link!");
        if (!q.includes('http')) return reply("❌ Invalid link format!");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const result = await anyDL(q);

        if (!result || !result.video) {
            return reply("❌ Media not found or platform not supported.");
        }

        // Title aur Quality info
        let caption = `📥 *AIO PRO DOWNLOADER*\n\n`;
        caption += `📌 *Title:* ${result.title || "No Title"}\n`;
        caption += `🎬 *Source:* AnyDownloader\n\n`;
        caption += `> © PROVA-MD- ❤️`;

        // Video bhejte waqt quality check (High quality first)
        const videoUrl = result.video[0]?.url || result.video;

        if (videoUrl) {
            await conn.sendMessage(from, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: "video/mp4"
            }, { quoted: mek });
        } else {
            reply("❌ Could not find a downloadable video link.");
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
  
