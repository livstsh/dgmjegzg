const { cmd } = require('../command');
const config = require('../config');

// Helper to update config status (Optional: If you use a database, replace this)
async function updateAntiLink(reply, mode, text) {
    config.ANTI_LINK = mode;
    return reply(`✅ *Anti-Link Updated*\n\n*Status:* ${text}\n*Mode:* ${mode}`);
}

// 1. Command: antilink delete on
cmd({
    pattern: "antilink delete",
    desc: "Only delete links from non-admins.",
    category: "config",
    filename: __filename
},           
async (conn, mek, m, { reply, isOwner, isAdmins }) => {
    if (!isOwner && !isAdmins) return reply("❌ Only Admins can use this.");
    await updateAntiLink(reply, "delete", "ON (Delete Only)");
});

// 2. Command: antilink kick on
cmd({
    pattern: "antilink kick",
    desc: "Only kick members who send links.",
    category: "config",
    filename: __filename
},           
async (conn, mek, m, { reply, isOwner, isAdmins }) => {
    if (!isOwner && !isAdmins) return reply("❌ Only Admins can use this.");
    await updateAntiLink(reply, "kick", "ON (Kick Only)");
});

// 3. Command: antilink delete kick on
cmd({
    pattern: "antilink delete kick",
    desc: "Delete message and kick the member who sends links.",
    category: "config",
    filename: __filename
},           
async (conn, mek, m, { reply, isOwner, isAdmins }) => {
    if (!isOwner && !isAdmins) return reply("❌ Only Admins can use this.");
    await updateAntiLink(reply, "all", "ON (Delete + Kick)");
});

// Command: antilink off
cmd({
    pattern: "antilinks off",
    desc: "Turn off anti-link protection.",
    category: "config",
    filename: __filename
},           
async (conn, mek, m, { reply, isOwner, isAdmins }) => {
    if (!isOwner && !isAdmins) return reply("❌ Only Admins can use this.");
    await updateAntiLink(reply, "false", "OFF");
});
