const { cmd } = require('../command');

cmd({
    pattern: "antibug",
    desc: "Delete bug/crash messages and remove/block sender.",
    category: "security",
    react: "🛡️",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, sender, reply, isBotAdmins }) => {
    try {
        const bugPatterns = /(‏‏|۝|۞|۩|𒀱|🇵🇰🇵🇰)/g;

        // Check message text
        const text = m?.text || m?.conversation || "";
        if (!text) return reply("✅ Dml AntiBug active. No bug detected yet.");

        // Detect bug
        if (text.length > 1500 || bugPatterns.test(text)) {
            await conn.sendMessage(from, { react: { text: "🚫", key: mek.key } });

            if (isGroup) {
                if (!isBotAdmins) return reply("❌ Hey I need admin rights to delete and remove.");
                
                // Delete message
                await conn.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: false,
                        id: mek.key.id,
                        participant: sender
                    }
                });

                // Remove sender
                await conn.groupParticipantsUpdate(from, [sender], "remove");
                await conn.sendMessage(from, { text: `⚠️ ${sender} removed for sending bug message.` });

            } else {
                // Block in private chat
                await conn.updateBlockStatus(sender, "block");
                await conn.sendMessage(from, { text: `🚫 Blocked ${sender} for sending bug message.` });
            }
        } else {
            reply("✅ Dml AntiBug active. No threats found in this message.");
        }
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
