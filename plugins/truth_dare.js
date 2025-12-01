const {
    cmd
} = require('../command');

cmd({
    pattern: "lockinfo",
    alias: ["unlockinfo", "lockdesc", "groupin"],
    desc: "Group ki info (subject, icon, description) badalne ki permission control karta hai.",
    category: "admin",
    react: "🔒", // Yeh reaction ab sirf success par aana chahiye, agar framework allow kare
    filename: __filename
},
async (conn, mek, m, {
    from,
    q,
    isGroup,
    isBotAdmins,
    reply, // Humein reply() function mil raha hai, par hum isko sirf success ke liye use karenge.
    senderJid,
    isGroupAdmins,
    botOwner
}) => {
    // NOTE: Agar aapki framework mein reply() function sirf emoji reaction deta hai, 
    // toh error messages ke liye seedha conn.sendMessage use karna behtar hai.

    const sendError = (text) => {
        // Error message send karne ke liye reply use kiya ja raha hai, jismein reaction nahi aana chahiye.
        // Agar aapki framework reply() mein reaction force karti hai, toh ise conn.sendMessage se replace karein.
        return conn.sendMessage(from, { text: text }, { quoted: mek });
    };

    // 1. Group Check
    if (!isGroup) return sendError("❌ Yeh command sirf groups mein istemaal ho sakta hai.");

    // Determine if the sender is the bot owner
    const isOwner = senderJid.startsWith(botOwner);

    // 2. Robust Admin Check
    const isSenderAdmin = isGroupAdmins.includes(senderJid);
    
    if (!isSenderAdmin && !isOwner) {
        // Error par seedha message bhejo, reply() se bach kar.
        return sendError("❌ Yeh command sirf Group Admins ya Bot Owner ke liye hai.");
    }

    // 3. Bot Permission Check
    if (!isBotAdmins) return sendError("❌ Mujhe group ki settings badalne ke liye group admin hona zaroori hai.");

    // 4. Argument Check
    if (!q) {
        return sendError("❌ Kripya 'on' (lock) ya 'off' (unlock) likhein. Jaise: .lockinfo on");
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
        return sendError("❌ Invalid argument. Kripya 'on' (lock) ya 'off' (unlock) ka istemaal karein.");
    }

    try {
        await conn.groupSettingUpdate(from, status);
        // Sirf success par reply() use karo (jismein reaction aata hai)
        reply(responseText); 
    } catch (error) {
        console.error("LockInfo command error:", error);
        sendError("❌ Group Info setting badalne mein fail ho gaya.");
    }
});
