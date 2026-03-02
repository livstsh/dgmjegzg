const { cmd } = require('../command');
const { setAntiStatus, getAntiStatus } = require('../data');

cmd({
    pattern: "antiedit",
    alias: ["antidelete", "antimsg"],
    react: "🛡️",
    desc: "Manage Anti-Edit & Anti-Delete.",
    category: "config",
    use: ".antiedit delete on | .antiedit edit off",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, isAdmins, isOwner }) => {
    
    if (!isAdmins && !isOwner) return reply("❌ Admins only.");

    const args = text ? text.toLowerCase().split(" ") : [];
    
    if (args.length < 2) {
        const dStat = await getAntiStatus('delete');
        const eStat = await getAntiStatus('edit');
        return reply(`🛡️ *PROVA-MD PROTECTION*\n\n` +
                     `🗑️ *Anti-Delete:* ${dStat ? "ON" : "OFF"}\n` +
                     `📝 *Anti-Edit:* ${eStat ? "ON" : "OFF"}\n\n` +
                     `*Usage:*\n.antiedit delete on/off\n.antiedit edit on/off`);
    }

    const target = args[0]; // 'delete' ya 'edit'
    const status = args[1] === 'on';

    if (target === 'delete' || target === 'edit') {
        await setAntiStatus(target, status);
        reply(`✅ *Anti-${target}* is now *${status ? "ENABLED" : "DISABLED"}*.`);
    } else {
        reply("❌ Invalid type! Use 'delete' or 'edit'.");
    }
});
    
