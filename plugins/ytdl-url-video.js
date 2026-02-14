const axios = require('axios');
const cheerio = require('cheerio');
const yts = require('yt-search');
const { cmd } = require('../command');

// --- Helper Functions ---

function extractVideoId(url) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

async function fetchYtmp3(url) {
    const videoId = extractVideoId(url);
    const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;

    // Scraper 1: YT1S.click
    try {
        const form = new URLSearchParams();
        form.append('q', url);
        form.append('type', 'mp3');
        const res = await axios.post('https://yt1s.click/search', form.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://yt1s.click',
                'Referer': 'https://yt1s.click/',
                'User-Agent': 'Mozilla/5.0',
            },
        });
        const $ = cheerio.load(res.data);
        const link = $('a[href*="download"]').attr('href');
        if (link) return { link, title: $('title').text().trim(), thumbnail, success: true };
    } catch (e) { console.warn('YT1S failed'); }

    // Scraper 2: FLVTO.online
    try {
        const payload = { fileType: 'MP3', id: videoId };
        const res = await axios.post('https://ht.flvto.online/converter', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://ht.flvto.online',
                'User-Agent': 'Mozilla/5.0',
            },
        });
        if (res.data?.status === 'ok' && res.data.link) {
            return { link: res.data.link, title: res.data.title, thumbnail, success: true };
        }
    } catch (e) { console.warn('FLVTO failed'); }

    throw new Error('Gagal mendapatkan link download.');
}

// --- Bot Command ---

cmd({
    pattern: "play6",
    alias: ["musik", "song5", "lagu"],
    react: "🎶",
    desc: "Search and play audio from YouTube.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, usedPrefix, command }) => {
    try {
        if (!q) return reply(`*🎵 Hai Kak! Mau cari lagu apa hari ini?*\n\n*📝 Contoh:* ${usedPrefix + command} Armada Bebaskan Diriku`);

        await conn.sendMessage(from, { react: { text: '🔍', key: m.key } });

        // Search YouTube
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ Lagu tidak ditemukan di YouTube.");

        const video = search.videos[0];
        const url = video.url;

        // Info message
        let info = `*🎶 YOUTUBE PLAY 🎶*\n\n` +
                   `*📌 Title:* ${video.title}\n` +
                   `*⏳ Duration:* ${video.timestamp}\n` +
                   `*👀 Views:* ${video.views.toLocaleString()}\n` +
                   `*📅 Published:* ${video.ago}\n\n` +
                   `*📥 Downloading audio, please wait...*\n\n` +
                   `*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

        await conn.sendMessage(from, { image: { url: video.thumbnail }, caption: info }, { quoted: mek });

        // Get download link
        const result = await fetchYtmp3(url);
        if (!result.link) throw new Error("Could not fetch MP3 link.");

        // Send Audio with externalAdReply (Large Thumbnail)
        await conn.sendMessage(from, {
            audio: { url: result.link },
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: video.title,
                    body: `Duration: ${video.timestamp} | Views: ${video.views}`,
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: url,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *Gagal mengambil audio:* ${e.message}`);
    }
});

