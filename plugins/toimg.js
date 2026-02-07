const { cmd } = require('../command');
const { writeFileSync } = require('fs');

// 🟢 Sticker to Image Command
cmd({
  pattern: "toimg",
  alias: ["toimage", "tophoto"],
  react: "🖼️",
  desc: "Convert sticker to image",
  category: "converter",
  filename: __filename
},
async (conn, mek, m, { from, reply }) => {
  try {
    // Check if the message is a reply to a sticker
    if (!m.quoted) return reply("Please reply to a sticker.");
    let mime = (m.quoted.msg || m.quoted).mimetype || '';
    if (!/webp/.test(mime)) return reply("That’s not a sticker!");

    // Download sticker
    let media = await m.quoted.download();

    // Convert sticker to image
    let filePath = `./temp/${Date.now()}.jpg`;
    writeFileSync(filePath, media);

    // Send as image
    await conn.sendMessage(from, { image: { url: filePath }, caption: "𝐀𝐃𝐄𝐄𝐋-𝐌𝐃 🤍" }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply("⚠️ Something went wrong, please try again.");
  }
});