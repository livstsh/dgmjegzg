const { cmd } = require("../command");
const axios = require("axios");

const commands = ["mp3url", "ytmp3", "audio"];

commands.forEach(command => {
  cmd({
    pattern: command,
    desc: "Download YouTube audio as MP3",
    category: "downloader",
    react: "🎵",
    filename: __filename
  }, async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a YouTube link.");

      let cleanUrl = q.split("&")[0];
      cleanUrl = cleanUrl.replace(
        "https://youtu.be/",
        "https://www.youtube.com/watch?v="
      );

      const apiUrl = `https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(cleanUrl)}`;
      const res = await axios.get(apiUrl, { timeout: 20000 });

      if (!res.data?.result?.status) {
        await conn.sendMessage(from, {
          react: { text: "❌", key: mek.key }
        });
        return reply("❌ Failed to fetch audio.");
      }

      const meta = res.data.result.metadata;
      const downloadUrl = res.data.result.download.url;

      await conn.sendMessage(from, {
        react: { text: "⏳", key: mek.key }
      });

      await conn.sendMessage(from, {
        image: { url: meta.thumbnail },
        caption: `🎶 *${meta.title}*

👤 *Channel:* ${meta.author || "Unknown"}
💽 *Quality:* MP3

> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*`
      }, { quoted: mek });

      await conn.sendMessage(from, {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${meta.title}.mp3`
      }, { quoted: mek });

      await conn.sendMessage(from, {
        react: { text: "✅", key: mek.key }
      });

    } catch (e) {
      console.error(`${command} command error:`, e);

      await conn.sendMessage(from, {
        react: { text: "❌", key: mek.key }
      });

      reply("❌ An error occurred.");
    }
  });
});
