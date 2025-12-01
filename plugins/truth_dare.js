const {
    cmd
} = require('../command');

cmd({
    pattern: "lockinfo",
    alias: ["unlockinfo", "lockdesc", "groupinfo"],
    desc: "Group ki info (subject, icon, description) badalne ki permission control karta hai. (Admin Check Improved)",
    category: "admin",
    react: "🔒",
    filename: __filename
},
async (conn, mek, m, {
    from,
    q,
    isGroup,
    isBotAdmins,
    reply,
    senderJid,      // <-- Naya: Command chalane wale ka JID (e.g., 92xxxxxxxxxx@s.whatsapp.net)
    isGroupAdmins,  // <-- Naya: Group ke sabhi Admins ki array
    botOwner        // <-- Naya: Bot Owner ka number (e.g., 923196891871)
}) => {

    // Kripya dhyan dein ki aapki framework upar diye gaye naye variables (senderJid, isGroupAdmins, botOwner) provide kare.

    // 1. Group Check
    if (!isGroup) return reply("❌ Yeh command sirf groups mein istemaal ho sakta hai.");

    // Determine if the sender is the bot owner
    const isOwner = senderJid.startsWith(botOwner);

    // 2. Robust Admin Check: Check if sender's JID is in the list of group admins OR if they are the bot owner
    const isSenderAdmin = isGroupAdmins.includes(senderJid);
    
    if (!isSenderAdmin && !isOwner) {
        return reply("❌ Yeh command sirf Group Admins ya Bot Owner ke liye hai.");
    }

    // 3. Bot Permission Check: Bot ka khud admin hona zaroori hai
    if (!isBotAdmins) return reply("❌ Mujhe group ki settings badalne ke liye group admin hona zaroori hai.");

    // 4. Argument Check
    if (!q) {
        return reply("❌ Kripya 'on' (lock) ya 'off' (unlock) likhein. Jaise: .lockinfo on");
    }

    const action = q.toLowerCase().trim();
    let status;
    let responseText;

    if (action === 'on' || action === 'lock') {
        status = 'locked'; 
        responseText = "🔒 Group Info Lock: Safaltapoorvak **ON** kar diya gaya hai. Ab sirf admins hi group ka naam, description, ya icon badal sakte hain.";
    } else if (action === 'off' || action === 'unlock') {
        status = 'unlocked';
        responseText = "🔓 Group Info Lock: Safaltapoorvak **OFF** kar diya gaya hai. Ab group ke sabhi sadasya group info badal sakte hain.";
    } else {
        return reply("❌ Invalid argument. Kripya 'on' (lock) ya 'off' (unlock) ka istemaal karein.");
    }

    try {
        await conn.groupSettingUpdate(from, status);
        reply(responseText);
    } catch (error) {
        console.error("LockInfo command error:", error);
        reply("❌ Group Info setting badalne mein fail ho gaya.");
    }
});
