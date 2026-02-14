const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const { cmd } = require('../command');

// --- Snakeloader API Config ---
const API_URL = 'https://api.snakeloader.com/index.php';
const DEFAULT_HEADERS = {
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'origin': 'https://snakeloader.com',
    'referer': 'https://snakeloader.com/',
    'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
};

// --- Helper Functions ---

const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';

async function snakeSearch(query) {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('action', 'search');
    const res = await axios.post(API_URL, params.toString(), { headers: DEFAULT_HEADERS });
    if (res.data.status !== 'ok') throw new Error('Search failed on Snakeloader');
    return res.data.data;
}

async function snakeDownload(vid, key) {
    const params = new URLSearchParams();
    params.append('vid', vid);
    params.append('key', key);
    params.append('captcha_provider', 'cloudflare');
    params.append('action', 'searchConvert');

    // Polling logic for conversion (max 10 attempts)
    for (let i = 0; i < 10; i++) {
        const res = await axios.post(API_URL, params.toString(), { headers: DEFAULT_HEADERS });
        const dlink = res.data.dlink || res.data.data?.dlink;
        if (dlink) return dlink;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Conversion timed out.');
}

// --- Bot Command ---

cmd({
    pattern: "ytmp33",
    alias: ["yta", "song6", "audio"],
    react: "🧸",
    desc: "Download high quality YouTube audio via Snakeloader.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Ketik judul lagu atau link\nContoh: .ytmp3 alone");

        // React with Loading
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Step 1: Search on YouTube
        const searchRes = await yts(q);
        const video = searchRes.all[0];
        if (!video) return reply('❌ Video tidak ditemukan.');

        const { title, views, timestamp, ago, url, author, image } = video;

        // Step 2: Get Snakeloader Metadata
        const snakeData = await snakeSearch(url);
        const audioLinks = snakeData.convert_links?.audio || [];
        if (!audioLinks.length) throw new Error('No audio links available');

        // Select 128kbps or first available
        const pick = audioLinks.find(l => l.quality === '128kbps') || audioLinks[0];

        // Step 3: Start Conversion and Get Link
        const finalDownloadUrl = await snakeDownload(snakeData.vid, pick.key);

        // Step 4: Send Audio with AdReply
        const caption = `⬣─ 〔 *Y T - A U D I O* 〕 ─⬣\n` +
                        `- *Title:* ${title}\n` +
                        `- *Views:* ${formatNumber(views)}\n` +
                        `- *Duration:* ${timestamp}\n` +
                        `- *Upload:* ${ago}\n` +
                        `- *Author:* ${author?.name || 'N/A'}\n` +
                        `⬣────────────────⬣`;

        await conn.sendMessage(from, {
            audio: { url: finalDownloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: `YouTube Audio Player | ${timestamp}`,
                    thumbnailUrl: snakeData.thumbnail || image,
                    sourceUrl: url,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *Terjadi kesalahan:* ${err.message}`);
    }
});
                                     
