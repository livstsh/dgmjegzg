//---------------------------------------------------------------------------
//           LUCKY-MD - YOUTUBE VIDEO DOWNLOADER (STYLISH)
//---------------------------------------------------------------------------

const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

async function fetchDownloadData(url, retries = 2) {
  try {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { timeout: 20000 });

    if (data.status && data.result) {
      return {
        video_url: data.result.mp4,
        title: data.result.title || "YouTube Video",
      };
    }
    throw new Error("API failed.");
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return fetchDownloadData(url, retries - 1);
    }
    return null;
  }
}

cmd({
  pattern: "video",
  alias: ["ytmp4", "vdl"],
  react: "🎥",
  desc: "Search and download videos from YouTube",
  category: "download",
  filename: __filename,
},
async (conn, mek, m, { from, q, reply, prefix, command }) => {
  try {
    if (!q) {
      return reply(`🎥 *Video Downloader*\n\nUsage: \`${prefix + command} <name/link>\``);
    }

    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Search
    const url = normalizeYouTubeUrl(q);
    let ytdata;

    if (url) {
      ytdata = await yts({ videoId: url.split("v=")[1] });
    } else {
      const search = await yts(q);
      if (!search.videos.length) return reply("❌ No results found!");
      ytdata = search.videos[0];
    }

    // Stylish Info Card
    const infoText = `
╭━━━〔 🎬 *PROVA VIDEO DOWNLOADER* 〕━━━⬣
┃
┃ 🎥 *Title:* ${ytdata.title}
┃ 📺 *Channel:* ${ytdata.author?.name || "Unknown"}
┃ ⏱️ *Duration:* ${ytdata.timestamp}
┃ 👁️ *Views:* ${ytdata.views.toLocaleString()}
┃ 🔗 ${ytdata.url}
┃
┣━━━━━━━━━━━━━━━━━━⬣
┃ ⏳ *Processing your video file...*
╰━━━━━━━━━━━━━━━━━━⬣
> © Powered By ʟᴜᴄᴋʏ-ᴍᴅ
`;

    await conn.sendMessage(from, {
      image: { url: ytdata.thumbnail || ytdata.image },
      caption: infoText
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Fetch download
    const dlData = await fetchDownloadData(ytdata.url);

    if (!dlData) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      return reply("❌ Download failed. Try again later.");
    }

    // Send video
    await conn.sendMessage(from, {
      video: { url: dlData.video_url },
      mimetype: "video/mp4",
      caption: `✅ *${dlData.title}*\n\n🚀 *Enjoy your video!*`,
      contextInfo: {
        externalAdReply: {
          title: "YouTube Video Downloader",
          body: dlData.title,
          thumbnailUrl: ytdata.thumbnail || ytdata.image,
          sourceUrl: ytdata.url,
          mediaType: 2,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply("⚠️ Something went wrong!");
  }
});
