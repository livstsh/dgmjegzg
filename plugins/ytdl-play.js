const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

// Store pending selections
const pendingDownloads = new Map();

// ---------------- HELPERS ----------------

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

async function fetchVideoData(url) {
  try {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl);
    return data.status && data.result ? data.result.mp4 : null;
  } catch { return null; }
}

async function fetchAudioData(url) {
  try {
    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl);
    return data.status && data.data ? data.data.url : null;
  } catch { return null; }
}

// ---------------- MAIN COMMAND ----------------

cmd({
  pattern: "dl",
  alias: ["play", "download"],
  react: "🎶",
  desc: "Download YouTube Video or Audio",
  category: "download",
  filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) return reply(`❓ Usage: ${prefix}dl <name/link>`);

    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Search
    let ytdata;
    const url = normalizeYouTubeUrl(q);

    if (url) {
      ytdata = (await yts({ videoId: url.split("v=")[1] }));
    } else {
      const search = await yts(q);
      if (!search.videos.length) return reply("❌ No results found!");
      ytdata = search.videos[0];
    }

    // Stylish Caption
    const caption = `
╭━━━〔 🎧 *PROVA YT DOWNLOADER* 〕━━━⬣
┃
┃ 🎬 *Title:* ${ytdata.title}
┃ ⏱️ *Duration:* ${ytdata.timestamp}
┃ 👁️ *Views:* ${ytdata.views.toLocaleString()}
┃ 🔗 ${ytdata.url}
┃
┣━━━━━━━━━━━━━━━━━━⬣
┃ Reply the number below:
┃
┃ ❶ Download *Video (MP4)*
┃ ❷ Download *Audio (MP3)*
┃
╰━━━━━━━━━━━━━━━━━━⬣
> © Powered By PROVA-MD
`;

    const sent = await conn.sendMessage(from, {
      image: { url: ytdata.thumbnail || ytdata.image },
      caption
    }, { quoted: mek });

    // Save for reply
    pendingDownloads.set(sent.key.id, {
      url: ytdata.url,
      title: ytdata.title
    });

  } catch (e) {
    console.error(e);
    reply("⚠️ Error occurred!");
  }
});


// ---------------- REPLY HANDLER (ONE TIME) ----------------

cmd({
  on: "text"
},
async (conn, mek, m, { from, body, reply }) => {
  try {
    const contextId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!contextId) return;

    const data = pendingDownloads.get(contextId);
    if (!data) return;

    const choice = body.trim();

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    if (choice === "1" || choice === "❶") {
      const videoUrl = await fetchVideoData(data.url);
      if (!videoUrl) return reply("❌ Video download failed!");

      await conn.sendMessage(from, {
        video: { url: videoUrl },
        caption: `✅ *${data.title}*\n\n> PROVA-MD`
      }, { quoted: mek });

    } else if (choice === "2" || choice === "❷") {
      const audioUrl = await fetchAudioData(data.url);
      if (!audioUrl) return reply("❌ Audio download failed!");

      await conn.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg"
      }, { quoted: mek });

    } else {
      return reply("❌ Reply only with 1 or 2");
    }

    pendingDownloads.delete(contextId);
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error(e);
  }
});
