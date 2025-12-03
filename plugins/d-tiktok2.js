const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config'); 

// --- API Endpoints (Triple Fallback) ---
const APIS = {
    PRIMARY: "https://apis.rijalganzz.my.id/download/tiktok-v2?url=",
    FALLBACK_A: "https://jawad-tech.vercel.app/download/tiktok?url=", // New API 1
    FALLBACK_B: "https://jawad-tech.vercel.app/download/ttdl?url=" // New API 2
};

// Fallback values for missing global configuration
const OWNER_NAME = config.OWNER_NAME || "DR KAMRAN";
const SGC_LINK = config.GROUP_LINK || "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O"; 

// Function to fetch TikTok data with multi-API fallback
async function fetchTikTokData(url) {
    const endpoints = [
        { name: 'Primary', url: APIS.PRIMARY },
        { name: 'Fallback A', url: APIS.FALLBACK_A },
        { name: 'Fallback B', url: APIS.FALLBACK_B }
    ];

    for (const { name, url: baseUrl } of endpoints) {
        try {
            const encodedURL = encodeURIComponent(url);
            const apiUrl = `${baseUrl}${encodedURL}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (data?.status || data?.success || data?.result?.play || data?.data) {
                // Determine structure based on typical API responses
                const result = data.result || data.data || data;
                
                let videoLink = result.play || result.video || result.hdplay || result.hd;
                let audioLink = result.music || result.audio || result.musicUrl;

                // Ensure the extracted link is usable
                if (videoLink || audioLink) {
                    return {
                        source: name,
                        title: result.title || result.description || "TikTok Video",
                        author: result.author?.nickname || result.creator || "Unknown Author",
                        videoUrl: Array.isArray(videoLink) ? videoLink[0] : videoLink,
                        audioUrl: audioLink,
                        stats: result.stats || {},
                        cover: result.cover || result.profilePhoto
                    };
                }
            }
        } catch (err) {
            console.warn(`TikTok Fetch Error (${name}): ${err.message}`);
        }
    }
    
    throw new Error("❌ Sabhi APIs se TikTok data lene mein truti aayi.");
}

let handler = async (conn, mek, m, { q, reply, prefix, command, from }) => {
  
  if (!q) return reply(`❌ Kripya TikTok video ka URL dein!\n\n*Udaharan:*\n${prefix + command} [URL]`);

  try {
    const quotedMsg = m.quoted ? m.quoted : m;
    
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key }});
    await reply("🔎 *TikTok* data khoja ja raha hai (Multiple APIs)...");

    // 1. Fetch data using multi-API logic
    const result = await fetchTikTokData(q);

    const { title, author, videoUrl, audioUrl, stats, cover, source } = result;

    // 2. Send the Video File (Primary content)
    if (videoUrl) {
        const caption = `
🎬 *TikTok Video Downloaded* (Source: ${source})
----------------------------------------
📌 *Judul:* ${title}
👤 *Pembuat:* ${author}
❤️ *Suka:* ${stats.digg_count?.toLocaleString() || 'N/A'}
💬 *Komentar:* ${stats.comment_count?.toLocaleString() || 'N/A'}

👨‍💻 *Creator Bot:* ${OWNER_NAME}`;

        await conn.sendMessage(m.chat, {
          video: { url: videoUrl },
          caption: caption,
          thumbnail: { url: cover || 'https://i.imgur.com/empty.png' }
        }, { quoted: quotedMsg });
    } else {
        // If no video URL is found, we might only have audio info
        await reply(`⚠️ Video link nahi mila, sirf audio nikaal rahe hain.`);
    }

    // 3. Send the Audio File (If available)
    if (audioUrl) {
      await conn.sendMessage(m.chat, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
        caption: `🎵 Audio Extracted`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: author,
            thumbnailUrl: cover,
            sourceUrl: SGC_LINK,
            mediaType: 1, // IMAGE/THUMBNAIL
            renderLargerThumbnail: true
          }
        }
      }, { quoted: quotedMsg });
    }
    
    if (!videoUrl && !audioUrl) {
        throw new Error("Koi bhi download link nahi mil paaya (Video/Audio).");
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error("❌ TikTok Downloader Error:", err);
    
    return conn.reply(
      m.chat,
      `❌ Gagal mendownload TikTok: ${err.message}\n\n_Kripya URL check karein ya thodi der baad koshish karein._`,
      m
    );
  }
};

// Handler properties adjusted to match user's common style
cmd({
    pattern: "tiktok",
    alias: ["tt"],
    help: ["tiktok <url>", "tt <url>"],
    tags: ["downloader"],
    command: ["tiktok", "tt"], 
    desc: "Downloads video and audio from TikTok URL.",
    category: "download",
    limit: true,
    filename: __filename
}, handler);

module.exports = handler;module.exports = handler;
