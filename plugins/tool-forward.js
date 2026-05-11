const { cmd } = require("../command");

// ⚙️ Safety Configuration
const SAFETY = {
  MAX_JIDS: 25, 
  BASE_DELAY: 2000,  
  EXTRA_DELAY: 4000, 
};

cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Bulk forward media or text to numbers/groups",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isOwner }) => {
  try {
    if (!isOwner) return await message.reply("📛 *Owner Only Command*");
    if (!message.quoted) return await message.reply("🍁 *Please reply to any message to forward it*");

    // 🧩 Handle input (groups or numbers)
    let jidInput = "";
    if (typeof match === "string") jidInput = match.trim();
    else if (Array.isArray(match)) jidInput = match.join(" ").trim();
    else if (match && typeof match === "object") jidInput = match.text || "";

    if (!jidInput) return await message.reply("📥 *Please provide group IDs or phone numbers to forward*\n\nExample:\n.fwd 923147168309 923195068309\n.fwd 1203603380688821@g.us");

    // ✂️ Split input by spaces or commas
    const rawJids = jidInput.split(/[\s,]+/).filter(x => x.trim().length > 0);

    // 🔍 Clean JIDs
    const validJids = rawJids.map(jid => {
      const clean = jid.replace(/@s\.whatsapp\.net|@g\.us/gi, "");
      if (/^\d+$/.test(clean)) {
        // If number has 11–15 digits, treat as user; else group
        if (clean.length >= 11 && clean.length <= 15) return `${clean}@s.whatsapp.net`;
        else return `${clean}@g.us`;
      }
      return null;
    }).filter(Boolean).slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0)
      return await message.reply("❌ *No valid JIDs or numbers found!*");

    // 🧾 Handle message content
    const quoted = message.quoted;
    const mtype = quoted.mtype;
    let content = {};

    // Media types
    if (["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"].includes(mtype)) {
      const buffer = await quoted.download();
      const caption = quoted.text || "";

      switch (mtype) {
        case "imageMessage":
          content = { image: buffer, caption };
          break;
        case "videoMessage":
          content = { video: buffer, caption };
          break;
        case "audioMessage":
          content = { audio: buffer, ptt: quoted.ptt || false };
          break;
        case "stickerMessage":
          content = { sticker: buffer };
          break;
        case "documentMessage":
          content = { document: buffer, fileName: quoted.fileName || "file" };
          break;
      }
    } else if (mtype === "extendedTextMessage" || mtype === "conversation") {
      content = { text: quoted.text };
    } else {
      try {
        content = quoted;
      } catch {
        return await message.reply("⚠️ *Unsupported message type!*");
      }
    }

    // 🚀 Send to all JIDs
    let success = 0, failed = [];
    for (const [i, jid] of validJids.entries()) {
      try {
        await client.sendMessage(jid, content);
        success++;
        if ((i + 1) % 10 === 0) await message.reply(`🔄 Sent ${i + 1}/${validJids.length}...`);
        const delay = (i + 1) % 10 === 0 ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY;
        await new Promise(res => setTimeout(res, delay));
      } catch {
        failed.push(jid);
        await new Promise(res => setTimeout(res, SAFETY.BASE_DELAY));
      }
    }

    // 📊 Summary
    let report = `✅ *Forward Complete*\n\n📤 Sent: ${success}/${validJids.length}\n📦 Type: ${mtype.replace("Message", "") || "text"}`;
    if (failed.length > 0) report += `\n❌ Failed (${failed.length}): ${failed.slice(0, 5).join(", ")}`;
    if (rawJids.length > SAFETY.MAX_JIDS) report += `\n⚠️ Only first ${SAFETY.MAX_JIDS} processed`;

    await message.reply(report);

  } catch (err) {
    console.error("Forward Error:", err);
    await message.reply(`💢 Error: ${err.message.substring(0, 80)}\nCheck JIDs, message type, or bot permissions.`);
  }
});