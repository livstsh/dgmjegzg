const { cmd } = require('../command');
const { exec } = require('child_process');
const config = require('../config');

// 1. Shutdown Bot
cmd({
    pattern: "nshutdown",
    desc: "Shutdown the bot.",
    category: "owner",
    react: "🛑",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    reply("🛑 Shutting down...").then(() => process.exit());
});

// 2. Broadcast Message to All Groups
cmd({
    pattern: "cbroadcast",
    desc: "Broadcast a message to all groups.",
    category: "owner",
    react: "📢",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, args, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");
    if (args.length === 0) return reply("📢 ρℓєαѕє ρяσνι∂є α мєѕѕαgє тσ вяσα∂¢αѕт.");

    const message = args.join(' ');
    const groups = Object.keys(await conn.groupFetchAllParticipating());

    for (const groupId of groups) {
        await conn.sendMessage(groupId, { text: message }, { quoted: mek });
    }

    reply("📢 мєѕѕαgє вяσα∂¢αѕтє∂ тσ αℓℓ gяσυρѕ.");
});

// 3. Set Profile Picture
cmd({
    pattern: "pp",
    desc: "Set bot profile picture.",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");
    if (!quoted || !quoted.message.imageMessage) return reply("❌ ρℓєαѕє яєρℓу тσ αη ιмαgє.");

    try {
        const media = await conn.downloadMediaMessage(quoted);
        await conn.updateProfilePicture(conn.user.jid, { url: media });
        reply("🖼️ ρяσƒιℓє ρι¢тυяє υρ∂αтє∂ ѕυ¢¢єѕѕƒυℓℓу!");
    } catch (error) {
        reply(`❌ єяяσя υρ∂αтιηg ρяσƒιℓє ρι¢тυяє: ${error.message}`);
    }
});

// 4. Block User
cmd({
    pattern: "eblock",
    desc: "Block a user.",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");
    if (!quoted) return reply("❌ ρℓєαѕє яєρℓу тσ тнє υѕєя уσυ ωαηт тσ вℓσ¢к.");

    const user = quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'block');
        reply(`🚫 User ${user} вℓσ¢кє∂ ѕυ¢¢єѕѕƒυℓℓу.`);
    } catch (error) {
        reply(`❌ єяяσя вℓσ¢кιηg υѕєя: ${error.message}`);
    }
});

// 5. Unblock User
cmd({
    pattern: "eunblock",
    desc: "Unblock a user.",
    category: "owner",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");
    if (!quoted) return reply("❌ ρℓєαѕє яєρℓу тσ тнє υѕєя уσυ ωαηт тσ υηвℓσ¢к.");

    const user = quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'unblock');
        reply(`✅ User ${user} υηвℓσ¢кє∂ ѕυ¢¢єѕѕƒυℓℓу.`);
    } catch (error) {
        reply(`❌ єяяσя υηвℓσ¢кιηg υѕєя: ${error.message}`);
    }
});

// 6. Clear All Chats
cmd({
    pattern: "clear",
    desc: "Clear all chats from the bot.",
    category: "owner",
    react: "🧹",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");
    try {
        const chats = conn.chats.all();
        for (const chat of chats) {
            await conn.modifyChat(chat.jid, 'delete');
        }
        reply("🧹 αℓℓ ¢нαтѕ ¢ℓєαяє∂ ѕυ¢¢єѕѕƒυℓℓу!");
    } catch (error) {
        reply(`❌ єяяσя ¢ℓєαяιηg ¢нαтѕ: ${error.message}`);
    }
});

// 7. Get Bot JID
cmd({
    pattern: "jidf",
    desc: "Get the bot's JID.",
    category: "owner",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");
    reply(`🤖 *Bot JID:* ${conn.user.jid}`);
});

// 8. Group JIDs List
cmd({
    pattern: "gjidf",
    desc: "Get the list of JIDs for all groups the bot is part of.",
    category: "owner",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ уσυ αяє ησт тнє σωηєя!");

    const groups = await conn.groupFetchAllParticipating();
    const groupJids = Object.keys(groups).join('\n');
    reply(`📝 *Group JIDs:*\n\n${groupJids}`);
});
        
