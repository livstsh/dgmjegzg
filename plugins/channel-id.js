const { cmd } = require("../command");

const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbBIVnMDTkKBhcCaS00T";

cmd({
  pattern: "cjid",
  alias: ["jidc", "channeljid", "chJID"],
  react: "📥",
  desc: "Extract WhatsApp Channel JID only from link",
  category: "whatsapp",
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  try {

    // Agar user link na de to apka fixed channel use hoga
    const link = q || CHANNEL_LINK;

    // Extract ID from channel link
    const match = link.match(/https?:\/\/(?:chat\.)?whatsapp\.com\/channel\/([\w-]+)/);

    if (!match) {
      return reply("❎ Please provide a valid WhatsApp channel link.");
    }

    const inviteId = `${match[1]}@newsletter`;

    await reply(`
🆔 *Channel JID:* 
${inviteId}

📢 *Channel Link:* 
${CHANNEL_LINK}
`);

  } catch (error) {
    console.error("❌ Error in .cjid plugin:", error);
    reply("⚠️ Failed to extract JID.");
  }
}); 
