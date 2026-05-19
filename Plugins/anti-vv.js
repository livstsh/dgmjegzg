const { cmd } = require("../command");
const { downloadContentFromMessage, proto } = require("@whiskeysockets/baileys");

const openedMessages = new Set();

cmd({
  pattern: "vv",
  react: "😋",
  desc: "Retrieve view once message",
  category: "public",
  filename: __filename
}, async (conn, mek, m, { from, isGroup }) => {
  try {
    if (!m.quoted) return m.reply("⚠️ Please reply to a view once message.");

    const quoted = m.quoted;
    const mtype = Object.keys(quoted.message)[0];
    const quotedMsg = quoted.message[mtype];

    // Check if it really is a view once message
    if (!quotedMsg?.viewOnce && !quotedMsg?.mediaMessage) return m.reply("❌ This is not a view once message or unsupported type.");

    const msgKey = `${from}_${quoted.id}`;
    if (openedMessages.has(msgKey)) return m.reply("⚠️ This message has already been retrieved.");

    let type = mtype.replace("Message", "").toLowerCase();
    if (type === "sticker") return m.reply("⚠️ Stickers cannot be retrieved.");

    // Download media safely
    let buffer = Buffer.from([]);
    try {
      const stream = await downloadContentFromMessage(quotedMsg, type);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    } catch {
      return m.reply("❌ Failed to download the media from view once message.");
    }

    // Prepare content for sending
    let content = {};
    if (type === "image") content = { image: buffer, caption: quotedMsg.caption || "" };
    else if (type === "video") content = { video: buffer, caption: quotedMsg.caption || "" };
    else if (type === "audio") content = { audio: buffer, mimetype: "audio/mp4", ptt: quotedMsg.ptt || false };
    else return m.reply("⚠️ Unsupported media type.");

    const sentMsg = await conn.sendMessage(from, content, { quoted: mek });
    openedMessages.add(msgKey);

    // Auto-delete after 30s in groups
    if (isGroup) {
      setTimeout(async () => {
        try {
          await conn.sendMessage(from, { delete: { remoteJid: from, fromMe: true, id: sentMsg.key.id, participant: sentMsg.key.participant } });
        } catch {}
      }, 30000);
    }

  } catch (error) {
    console.log("VV ERROR:", error);
    m.reply("❌ Something went wrong while retrieving the view once message.");
  }
});