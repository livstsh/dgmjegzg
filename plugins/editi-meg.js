const { cmd } = require('../command');
const { 
    setAnti, getAnti, 
    setAntiEdit, getAntiEdit 
} = require('../data'); // Check karein path 'data/index.js' hai

cmd({
    pattern: "antiset",
    alias: ["antidelete2", "antiedit", "antimsg"],
    react: "🛡️",
    desc: "Manage Anti-Delete and Anti-Edit settings.",
    category: "config",
    use: ".antiset delete on | .antiset edit off",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, isAdmins, isOwner }) => {
    
    // Check Permission (Sirf Admin/Owner)
    if (!isAdmins && !isOwner) return reply("❌ This command is only for Admins or Owner.");

    // Current Status fetch karna
    const delStatus = await getAnti();
    const editStatus = await getAntiEdit();

    // Menu dikhana agar text na ho
    if (!text) {
        return reply(
            `🛡️ *KAMRAN-MD PROTECTION SETTINGS*\n\n` +
            `🗑️ *Anti-Delete:* ${delStatus ? "✅ ON" : "❌ OFF"}\n` +
            `📝 *Anti-Edit:* ${editStatus ? "✅ ON" : "❌ OFF"}\n\n` +
            `*Commands:*\n` +
            `◈ .antiset delete on/off\n` +
            `◈ .antiset edit on/off\n\n` +
            `> © ᴘʀᴏᴠᴀ-ᴍᴅ ꜱʏꜱᴛᴇᴍ`
        );
    }

    const args = text.toLowerCase().split(" ");
    const feature = args[0]; // 'delete' or 'edit'
    const action = args[1];  // 'on' or 'off'

    if (!action || (action !== "on" && action !== "off")) {
        return reply("❌ Use: *.antiset delete on* or *.antiset edit off*");
    }

    const status = action === "on";

    if (feature === "delete") {
        await setAnti(status);
        reply(`✅ *Anti-Delete* has been turned *${action.toUpperCase()}*.`);
    } else if (feature === "edit") {
        await setAntiEdit(status);
        reply(`✅ *Anti-Edit* has been turned *${action.toUpperCase()}*.`);
    } else {
        reply("❌ Invalid feature! Use *delete* or *edit*.");
    }
});

