const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "ply",
  alias: ["play10", "play9", "sania1"],
  desc: "Download YouTube audio by title and send as a voice note.",
  category: "download",
  react: "🎵",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please give me a song name.");
    }

    // 1. Search video on YouTube
    const search = await yts(q);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found for that query.");
    }

    const { url, title } = video;

    // The API URL is hardcoded here.
    const apiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(url)}`;

    // 2. Call your API with video URL
    const res = await axios.get(apiUrl);
    const audioUrl = res.data.result;

    // 3. Robustly check the API response status and the resulting audio URL
    if (!res.data.status || !audioUrl) {
      console.error("API response error:", res.data);
      return reply("❌ Failed to fetch audio download link from the API. The download service may be down.");
    }

    // 4. Send audio file as a Voice Note (ptt: true) - This is the format you requested.
    // NOTE: If you receive the "audio not available" error again, set ptt: false 
    // to ensure reliable playback as a standard audio file.
    await conn.sendMessage(from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt: true, // <--- Set to TRUE for voice note/voice message
      contextInfo: { forwardingScore: 999, isForwarded: true }
    }, { quoted: mek });

    // 5. Reply with success message
    await reply(`✅ *${title}* Downloaded Successfully and sent as a *Voice Message*!`);

  } catch (e) {
    console.error("play2 command error:", e.message);
    reply("❌ An unexpected error occurred while processing the download request.");
  }
});
