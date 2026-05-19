const fetch = require("node-fetch");
const { cmd } = require("../command");

cmd({
  pattern: "tt2",
  alias: ["tiktok2", "ttdl2"],
  desc: "Direct TikTok Video Downloader",
  react: "📥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    const url = args[0];
    if (!url) return reply("❌ Please provide a TikTok URL.");
    
    // Check if it's a valid TikTok URL
    if (!url.includes("tiktok.com")) {
        return reply("❌ Invalid URL! Please provide a valid TikTok link.");
    }

    // Inform the user that downloading has started
    const waitMsg = await reply("✨ *Processing your request...*");

    const response = await fetch(`https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) throw new Error("API Connection Failed");

    const data = await response.json();

    if (!data.success || !data.result) {
        return reply("❌ Could not fetch the video. The link might be private or broken.");
    }

    const res = data.result;

    // --- Enhanced Stylish Layout ---
    let caption = `🎬 *TIKTOK DOWNLOADER* 🎬\n\n` +
      `📌 *Title:* ${res.title || 'No Title'}\n` +
      `👤 *Author:* ${res.author.name || 'Unknown'}\n\n` +
      `📊 *STATISTICS*\n` +
      `❤️ Likes: ${res.stats.like.toLocaleString()}\n` +
      `💬 Comments: ${res.stats.comment.toLocaleString()}\n` +
      `🔄 Shares: ${res.stats.share.toLocaleString()}\n\n` +
      `✨ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ*`;

    // Sending Video
    await conn.sendMessage(from, {
      video: { url: res.videoUrl },
      caption: caption,
      mimetype: 'video/mp4',
      fileName: `${res.title}.mp4`
    }, { quoted: m });

    // Mark as done
    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("TikTok Error:", e);
    reply("❌ *Error:* Something went wrong. Please try again later.");
  }
});
