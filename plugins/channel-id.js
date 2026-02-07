const { cmd } = require("../command");

cmd({
  pattern: "cjid",
  alias: ["jidc", "channeljid", "chJID"],
  react: "📥",
  desc: "Extract WhatsApp Channel JID only from link",
  category: "whatsapp",
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("❎ Please provide a channel link after the command.");

    // Extract ID from channel link
    const match = q.match(/https?:\/\/(?:chat\.)?whatsapp\.com\/channel\/([\w-]+)/);
    if (!match) return reply("❎ Please provide a valid WhatsApp channel link.");

    const inviteId = `${match[1]}@newsletter`;

    await reply(`🆔 *Channel JID:* ${inviteId}`);

  } catch (error) {
    console.error("❌ Error in .cid plugin:", error);
    reply("⚠️ Failed to extract JID.");
  }
});