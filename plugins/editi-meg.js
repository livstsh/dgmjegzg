const { cmd } = require('../command');
const { getAnti, setAnti } = require('../data'); // Aapke database functions

cmd({
    pattern: "antidelete2",
    alias: ["antiedit", "antiset"],
    react: "🛡️",
    desc: "Turn Anti-Delete and Anti-Edit ON or OFF.",
    category: "config",
    use: ".antidelete on / .antidelete off",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, isAdmins, isOwner }) => {
    
    // Sirf Admin ya Owner hi control kar sakein
    if (!isAdmins && !isOwner) return reply("❌ This command is only for Admins or Owner.");

    if (!text) return reply(`🛡️ *KAMRAN-MD SETTINGS*\n\nCurrent Status: *${await getAnti() ? "ON" : "OFF"}*\n\nUsage:\n.antidelete on\n.antidelete off`);

    if (text.toLowerCase() === "on") {
        await setAnti(true);
        return reply("✅ *Anti-Delete & Anti-Edit are now ENABLED.* Bot will now track all deleted/edited messages.");
    } 

    if (text.toLowerCase() === "off") {
        await setAnti(false);
        return reply("🔕 *Anti-Delete & Anti-Edit are now DISABLED.*");
    }

    reply("❌ Invalid input! Use *on* or *off*.");
});

