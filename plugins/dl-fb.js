const axios = require("axios");
const { cmd } = require("../command");

// Title list jo Adeel ne di hai
const fbTitles = [
  "*𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺*\n\n*🌴ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🌴*",
  "*ғᴀᴄᴇʙᴏᴏᴋ*\n\n*🎋ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🎋*",
  "*𝘍𝘈𝘊𝘌𝘉𝘖𝘖𝘒*\n\n*🌵ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🌵*",
  "*ⒻⒶⒸⒺⒷⓄⓄⓀ*\n\n*🪇ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ🪇*",
  "*ＦＡＣＥＢＯＯＫ*\n\n*🪷ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🪷*",
  "*𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊*\n\n*🩷ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🩷*",
  "*𝙁𝘼𝘾𝙀𝘽𝙊𝙊𝙆*\n\n*🪸ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🪸*"
];

let fbTitleIndex = 0;

cmd({
  pattern: "fb",
  alias: ["facebook", "fbvideo", "fb2", "facebook2", "fbvideo2"],
  react: "📥",
  desc: "Download Facebook videos directly in HD/SD with rotating title",
  category: "download",
  use: ".fb <Facebook video URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const fbUrl = args[0];

    if (!fbUrl || !fbUrl.includes("facebook.com")) {
      return reply("⚠️ Please provide a valid Facebook video link.\nExample: `.fb https://facebook.com/...`");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const apiUrl = `https://edith-apis.vercel.app/download/facebook?url=${encodeURIComponent(fbUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 15000 });

    if (!response.data || response.data.status !== true) {
      return reply("❌ Unable to fetch the video info. Please check the link or try another video.");
    }

    const result = response.data.result || {};
    const media = result.media || {};

    const videoLink = media.video_hd || media.video_sd || null;
    const thumbUrl = media.thumbnail || media.photo_image || null;

    if (!videoLink) {
      return reply("⚠️ No downloadable video links found. The video might be private or removed.");
    }

    // Current title select aur index increment
    const captionText = fbTitles[fbTitleIndex];
    fbTitleIndex = (fbTitleIndex + 1) % fbTitles.length; // agla title next time

    await conn.sendMessage(from, {
      video: { url: videoLink },
      caption: captionText,
      thumbnail: thumbUrl ? await axios.get(thumbUrl, { responseType: 'arraybuffer' }) : undefined
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("FB command error:", error);
    reply("❌ Failed to download video. Please try another link later.");
    try { await conn.sendMessage(from, { react: { text: "❌", key: m.key } }); } catch {}
  }
});