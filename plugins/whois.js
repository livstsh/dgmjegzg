const { cmd } = require('../command');

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
    isGroup // Added check for group context
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
        const quotedText = m.quoted.text || m.quoted.caption || "[Media/Attachment]";
        
        // Ensure timestamp calculation is robust
        const quotedTimestamp = m.quoted.messageTimestamp 
                               ? new Date(m.quoted.messageTimestamp * 1000).toLocaleString('en-US') 
                               : "N/A";

        // 3. Get User Profile Information (Name and Roles)
        
        // FIX 1: Robust Name Fetching (Falls back to number if name is unavailable)
        const targetName = await conn.getName(targetJid) || `+${targetNumber}`; 
        
        let userRole = "👤 Normal Member";
        let groupMetadata = null;
        
        // Check group context to determine admin status
        if (isGroup) {
             // Fetch metadata to find the user's role
             groupMetadata = await conn.groupMetadata(from);
             
             // FIX 2: Admin Role Check
             if (groupMetadata && groupMetadata.participants) {
                 const targetParticipant = groupMetadata.participants.find(p => p.id === targetJid);
                 
                 if (targetParticipant) {
                     if (targetParticipant.admin === 'superadmin') {
                         userRole = "👑 Group Creator/Super Admin";
                     } else if (targetParticipant.admin === 'admin') {
                         userRole = "⭐ Group Admin";
                     }
                 }
             }
        }
        
        // Check if the target is the command sender (for clarity)
        if (targetJid === m.sender) { 
            // If the user is the sender, prioritize their existing admin role, or use the 'You' tag
            userRole = userRole.includes("Admin") ? userRole : "💡 You (Command Sender)";
        }
        
        // 4. Construct the output message
        let infoMessage = `*🕵️ Message Detective: User Information*\n\n`;
        infoMessage += `-------------------------------------------------\n`;
        infoMessage += `*Name:* ${targetName}\n`;
        infoMessage += `*Number:* ${targetNumber}\n`;
        infoMessage += `*Role:* ${userRole}\n`;
        infoMessage += `*Message Time:* ${quotedTimestamp}\n`;
        infoMessage += `-------------------------------------------------\n`;
        infoMessage += `*Message Content:* \n"${quotedText.substring(0, 100)}..."\n`;
        infoMessage += `\n> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *_KAMRAN MD MAX_ ᵀᴹ*`;


        // 5. Send the message with mentions
        await conn.sendMessage(from, { 
            text: infoMessage,
            mentions: [targetJid] // Ensure the target user is mentioned
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("Whois Command Error:", error);
        await react("❌");
        reply("❌ An error occurred while retrieving information.");
    }
});
