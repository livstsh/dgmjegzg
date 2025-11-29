const { cmd } = require('../command');
// Note: We are using the standard parameters available in your bot

cmd({
    pattern: "whois",
    alias: ["senderinfo", "midentify", "jankari"],
    desc: "Provides detailed information about the sender of a quoted message.",
    category: "utility",
    react: "🕵️",
    filename: __filename
},
async (conn, mek, m, { 
    from, 
    reply, 
    react,
    participants, // List of group participants
    groupAdmins, // List of current group admins
    isOwner // True if the bot owner
}) => {
    try {
        await react("⏳");

        // 1. Check for quoted message
        if (!m.quoted) {
            await react("❌");
            return reply("❌ *Usage:* Please reply to any message and type *.whois*.");
        }

        // 2. Get Target JID and Message Info
        const targetJid = m.quoted.sender;
        const targetNumber = targetJid.split('@')[0];
        const quotedText = m.quoted.text || m.quoted.caption || "Media/Attachment";
        const quotedTimestamp = new Date(m.quoted.messageTimestamp * 1000).toLocaleString();

        // 3. Get User Profile Information (Name and Status)
        // Note: conn.getName() is assumed to be available to get the display name
        const targetName = await conn.getName(targetJid) || "User Not Found";

        // 4. Check Roles
        let userRole = "👤 Normal Member";
        
        if (groupAdmins && groupAdmins.includes(targetJid)) {
            userRole = "👑 Group Admin";
        }
        
        if (targetJid === m.sender) { // Check if the target is the command sender
            userRole = "💡 You (Command Sender)";
        }
        
        // This JID check needs the exact owner JID, which is often in config.
        // Assuming your framework defines `isOwner` based on a config JID:
        // const isTargetOwner = targetJid.startsWith(config.OWNER_JID.split('@')[0]);
        // if (isTargetOwner) userRole = "⭐ Bot Owner";

        
        // 5. Construct the output message
        let infoMessage = `*🕵️ Message Detective: User Information*\n\n`;
        infoMessage += `-------------------------------------------------\n`;
        infoMessage += `*Name:* ${targetName}\n`;
        infoMessage += `*Number:* ${targetNumber}\n`;
        infoMessage += `*Role:* ${userRole}\n`;
        infoMessage += `*Message Time:* ${quotedTimestamp}\n`;
        infoMessage += `-------------------------------------------------\n`;
        infoMessage += `*Message Content:* \n"${quotedText.substring(0, 100)}..."\n`;
        infoMessage += `\n> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *_KAMRAN MD MAX_ ᵀᴹ*`;


        // 6. Send the message with mentions
        await conn.sendMessage(from, { 
            text: infoMessage,
            mentions: [targetJid] 
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("Whois Command Error:", error);
        await react("❌");
        reply("❌ An error occurred while retrieving information.");
    }
});
