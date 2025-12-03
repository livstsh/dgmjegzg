const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio'); // Assuming cheerio is available
const config = require('../config');

// --- Helper Function to format Unix time ---
const formatUnixTime = (unixTimestamp) => {
    try {
        if (!unixTimestamp) return 'N/A';
        // Use standard Date object for compatibility
        const date = new Date(unixTimestamp * 1000); 
        return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
        return 'Invalid Time';
    }
};


// --- API Function 1: Using tikwm.com ---
async function tiktokV1(query) {
  const encodedParams = new URLSearchParams();
  encodedParams.set('url', query);
  encodedParams.set('hd', '1');

  const { data } = await axios.post('https://tikwm.com/api/', encodedParams.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
    },
    timeout: 30000
  });

  return data;
}

// --- API Function 2: Scraping savetik.co ---
async function tiktokV2(query) {
  const form = new FormData();
  form.append('q', query);

  const { data } = await axios.post('https://savetik.co/api/ajaxSearch', form, {
    headers: {
      ...form.getHeaders(),
      'Accept': '*/*',
      'Origin': 'https://savetik.co',
      'Referer': 'https://savetik.co/en2',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    },
    timeout: 30000
  });

  const rawHtml = data.data;
  if (!rawHtml) throw new Error("V2 API se koi HTML data nahi mila.");
  
  const $ = cheerio.load(rawHtml);
  const title = $('.thumbnail .content h3').text().trim() || 'No Title';
  const thumbnail = $('.thumbnail .image-tik img').attr('src');
  const video_url = $('video#vid').attr('data-src');

  const slide_images = [];
  $('.photo-list .download-box li').each((_, el) => {
    const imgSrc = $(el).find('.download-items__thumb img').attr('src');
    if (imgSrc) slide_images.push(imgSrc);
  });

  return { title, thumbnail, video_url, slide_images };
}


// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, prefix, command, from }) => {
    if (!q) return reply(`❌ Kripya sahi TikTok URL dein, udaharan: ${prefix + command} https://vt.tiktok.com/xxxxxx`);

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await reply('⏳ TikTok data laya ja raha hai...');

    try {
        let res = {}; // Final data object
        let images = []; // Array for photo slides
        let videoUrl = null;

        // --- 1. Attempt V1 (tikwm.com) ---
        const dataV1 = await tiktokV1(q);
        if (dataV1?.data) {
            const d = dataV1.data;
            res = {
                title: d.title,
                region: d.region,
                duration: d.duration,
                create_time: d.create_time,
                play_count: d.play_count,
                digg_count: d.digg_count,
                comment_count: d.comment_count,
                share_count: d.share_count,
                download_count: d.download_count,
                author: d.author,
                music_info: d.music_info,
                cover: d.cover,
                play: d.play,
                hdplay: d.hdplay,
                wmplay: d.wmplay
            };
            if (Array.isArray(d.images) && d.images.length > 0) {
                images = d.images;
            } else if (Array.isArray(d.image_post) && d.image_post.length > 0) {
                images = d.image_post;
            }
            videoUrl = d.play || d.hdplay || d.wmplay;
        }

        // --- 2. Attempt V2 (savetik.co) if V1 failed to provide video/images ---
        if ((!videoUrl && images.length === 0) || !res.title) {
            const dataV2 = await tiktokV2(q);
            if (dataV2.video_url || dataV2.slide_images.length > 0) {
                // Merge data, prioritizing V2 video/slides
                res = {
                    ...res, // Keep V1 stats if available
                    title: dataV2.title || res.title,
                    cover: dataV2.thumbnail || res.cover,
                    play: dataV2.video_url || res.play
                };
                videoUrl = dataV2.video_url || res.play;
                if (dataV2.slide_images.length > 0) {
                    images = dataV2.slide_images;
                }
            } else if (!res.title) {
                throw new Error("Dono methods se video data nahi mila.");
            }
        }
        
        // Final video link check
        videoUrl = res.play || res.hdplay || res.wmplay || videoUrl;

        // --- 3. Handle Output ---
        
        if (images.length > 0) {
            await reply(`📸 *Photo Slide Detected* (${images.length} images)`);
            
            // Send each image individually (Max 5 for stability)
            for (let i = 0; i < images.length && i < 5; i++) {
                await conn.sendMessage(m.chat, {
                    image: { url: images[i] },
                    caption: `Slide ${i + 1}/${images.length}\n*Title:* ${res.title || 'N/A'}`
                }, { quoted: m });
            }
            return;
        }

        // Send video if link is available
        if (videoUrl) {
            const time = formatUnixTime(res.create_time);

            const caption = `*🎥 TikTok Video Info*
*Judul :* ${res.title || '-'}
*Region :* ${res.region || 'N/A'}
*Durasi :* ${res.duration || '-'}s
*Waktu Upload :* ${time}

*Statistik*
*Views :* ${res.play_count?.toLocaleString() || 0}
*Likes :* ${res.digg_count?.toLocaleString() || 0}
*Komentar :* ${res.comment_count?.toLocaleString() || 0}
*Share :* ${res.share_count?.toLocaleString() || 0}
*Downloads :* ${res.download_count?.toLocaleString() || 0}

*Author*
*Username :* ${res.author?.unique_id || '-'}
*Nama :* ${res.author?.nickname || '-'}`

            await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m });
        } else if (res.cover) {
            // Fallback to sending the cover image
            await conn.sendMessage(m.chat, { image: { url: res.cover }, caption: `❌ Video link nahi mil paya. Sirf cover image bheji jaa rahi hai.` }, { quoted: m });
        } else {
             throw new Error("Video ya cover ka koi link nahi mila.");
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('TikTok Downloader Combined Error:', e.message);
        await reply(`❌ Error kak: ${e.message}. Kripya URL dobara check karein.`);
    }
}

handler.command = ['tiktok', 'tt', 'ttdl'];
handler.help = ['tiktok <url>'];
handler.tags = ['downloader'];
handler.filename = 'tiktok_combined.js';

module.exports = handler;
