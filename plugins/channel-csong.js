const { cmd } = require('../command');

// Note: global.botModes initialization check
if (!global.botModes) global.botModes = {};
if (!global.botModes.antitag) global.botModes.antitag = {};

cmd({
    pattern: "antitag",
    alias: ["anti-tag", "antitall"],
    react: "🛡️",
    desc: "Configure Anti-Tag system to prevent mass mentions.",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, l, isGroup, participants, isAdmins, isBotAdmins, args, reply }) => {
    try {
        if (!isGroup) return reply("🚫 This command can only be used in groups.");
        
        // Admin Check
        if (!isAdmins) return reply("🚫 ACCÈS REFUSÉ : Seul un Admin peut configurer la protection.");

        const action = args[0]?.toLowerCase();

        if (!action) {
            return reply(`🛡️ *SYSTÈME ANTI-TAG*\n\n` +
                         `*.antitag on* -> Active la protection\n` +
                         `*.antitag off* -> Désactive la protection\n\n` +
                         `*Effet : Supprime automatiquement les tentatives de tagall (@everyone, @here, etc).*`);
        }

        if (action === "on") {
            global.botModes.antitag[from] = true;
            return conn.sendMessage(from, { 
                image: { url: "https://files.catbox.moe/v7zea2.jpg" },
                caption: "✅ *PROTECTION ACTIVÉE*\n\nLe Monarque surveille désormais les mentions de ce groupe.\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*" 
            }, { quoted: mek });

        } else if (action === "off") {
            global.botModes.antitag[from] = false;
            return reply("❌ *PROTECTION DÉSACTIVÉE*");
        }

    } catch (err) {
        console.error("Erreur Antitag :", err);
        reply("⚠️ Error configuring Anti-Tag.");
    }
});

// 🛡️ PASSIVE DETECTION LOGIC (Place this in your main handler/index.js if needed)
// Is logic ko aap apne message listener mein add kar sakte hain:
/*
    if (isGroup && global.botModes.antitag?.[from]) {
        const isTagAll = m.body.includes('@everyone') || m.body.includes('@here') || (m.mentionedJid && m.mentionedJid.length > 10);
        if (isTagAll && !isAdmins && isBotAdmins) {
            await conn.sendMessage(from, { delete: mek.key });
        }
    }
*/
