const { cmd } = require("../command");
const axios = require('axios');
const cheerio = require('cheerio'); // Assuming cheerio is available
const FormData = require('form-data'); // Assuming form-data is available
const Buffer = require('buffer').Buffer;

// --- Custom Hash Function (Replaced btoa with Buffer) ---
function hash(e, t) {
    const btoa = (str) => Buffer.from(str).toString('base64');
    return btoa(e) + (e.length + 1e3) + btoa(t);
};

// --- Scraper Core Function ---
async function anydown(url) {
    try {
        if (!url.includes('http')) throw new Error('❌ Kripya sahi URL dein.');
        
        // 1. GET initial page to extract CSRF Token
        const { data: h } = await axios.get('https://anydownloader.com/en', { timeout: 15000 });
        const $ = cheerio.load(h);
        
        const token = $('input[name="token"]').attr('value');
        if (!token) throw new Error('Token nahi mil paya. Website block ho sakti hai.');
        
        // 2. Prepare POST data (using FormData/URLSearchParams equivalent)
        const postData = new URLSearchParams();
        postData.set('url', url);
        postData.set('token', token);
        postData.set('hash', hash(url, 'api'));
        
        // 3. POST request to download API
        const { data } = await axios.post('https://anydownloader.com/wp-json/api/download/', postData.toString(), {
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                origin: 'https://anydownloader.com',
                referer: 'https://anydownloader.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            },
            timeout: 25000
        });
        
        // 4. Return data
        if (data.status !== true || !data.media) throw new Error(data.message || 'Video link nahi mila.');
        
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};


// --- MAIN COMMAND HANDLER ---
cmd({
    pattern: "anydown",
    alias: ["universal"],
    desc: "Kisi bhi platform (TikTok, Insta, etc.) se video download karta hai.", // Downloads video from any supported platform.
    category: "download",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q) {
            return reply(`❌ Kripya video ka URL dein.\n\n*Udaharan:* ${prefix + command} [TikTok/Instagram Link]`);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply("⏳ Video link khoja jaa raha hai (Scraping website)...");

        // 1. Perform the scrape
        const result = await anydown(q);
        const media = result.media;
        
        if (!media || media.length === 0) {
            return reply("❌ Video link nahi mil paya. Ho sakta hai link private ho.");
        }

        // 2. Select the best quality video link (usually the first one)
        const bestVideo = media.find(item => item.type === 'video');
        
        if (!bestVideo || !bestVideo.url) {
            return reply("❌ Video link nahi mila. Sirf audio ya image uplabdh ho sakta hai.");
        }
        
        const videoTitle = result.title || 'Universal Video Download';

        // 3. Send the video
        await conn.sendMessage(from, {
            video: { url: bestVideo.url },
            mimetype: 'video/mp4',
            caption: `✅ *${videoTitle}* Downloaded Successfully!\n*Source:* AnyDownloader (Scraped)`
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("AnyDown Command Error:", e.message);
        reply(`⚠️ Video download karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
