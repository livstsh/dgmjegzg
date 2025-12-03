const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config'); 

// --- API Endpoints ---
const DOWNLOAD_API = "https://apis.rijalganzz.my.id/download/tiktok-v2?url="; // Using the original API provided by the user

// Fallback values for missing global configuration
const BOT_NAME = config.BOT_NAME || "KAMRAN MD BOT";
const OWNER_NAME = config.OWNER_NAME || "DR KAMRAN";
const SGC_LINK = config.GROUP_LINK || "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O"; 

let handler = async (conn, mek, m, { q, reply, prefix, command, from }) => {
  
  if (!q) return reply(`❌ Kripya TikTok video ka URL dein!\n\n*Udaharan:*\n${prefix + command} [URL]`);

  try {
    // Determine the message to quote
    const quotedMsg = m.quoted ? m.quoted : m;
    
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key }});
    await reply("🔎 *TikTok* data khoja jaa raha hai..."); // Initial loading message

    // 1. Fetch data from the API
    const res = await axios.get(`${DOWNLOAD_API}${encodeURIComponent(q)}`, { timeout: 20000 });
    const json = res.data;

    if (!json?.status || !json.result?.play) {
        throw new Error("❌ Maaf, video download link prapt nahi hua.");
    }

    const { result } = json;

    const videoUrl = result.play;
    const audioUrl = result.music;
    const title = result.title || "Video";
    const author = result.author?.nickname || result.creator || "Unknown Author";
    const duration = result.duration || 'N/A';
    const likes = result.stats?.digg_count || 0;
    const comments = result.stats?.comment_count || 0;
    const shares = result.stats?.share_count || 0;
    const profilePhoto = result.author?.avatar || result.cover;

    // 2. Send the Video File
    const caption = `
🎬 *TikTok Video Downloaded*
----------------------------------------
📌 *Judul:* ${title}
👤 *Pembuat:* ${author}
⏱️ *Durasi:* ${duration} detik
❤️ *Suka:* ${likes.toLocaleString()}
💬 *Komentar:* ${comments.toLocaleString()}

👨‍💻 *Creator Bot:* ${OWNER_NAME}`;

    await conn.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption: caption,
      thumbnail: { url: profilePhoto || 'https://i.imgur.com/empty.png' }
    }, { quoted: quotedMsg });

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
            thumbnailUrl: profilePhoto,
            sourceUrl: SGC_LINK,
            mediaType: 1, // IMAGE/THUMBNAIL
            renderLargerThumbnail: true
          }
        }
      }, { quoted: quotedMsg });
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error("❌ TikTok Downloader Error:", err);
    
    return conn.reply(
      m.chat,
      `❌ Gagal mendownload TikTok: ${err.message || "Anjaan truti hui."}\n\n*Pastikan URL sahi ho.*`,
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

module.exports = handler;
