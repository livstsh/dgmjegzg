const {
    cmd
} = require('../command');

cmd({
    pattern: "lockinfo",
    alias: ["unlockinfo", "lockdesc", "groupinfo"],
    desc: "Group ka subject, icon, aur description badalne ki permission control karta hai. (Admins/Members only)",
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
    isAdmin // Command chalane wale ka admin status
}) => {
    // --- DEBUGGING LINE ADDED ---
    console.log(`[DEBUG] Sender is Admin (isAdmin): ${isAdmin}`);
    // ----------------------------

    // 1. Group Check: Command sirf group mein chalega
    if (!isGroup) return reply("❌ Yeh command sirf groups mein istemaal ho sakta hai.");

    // 2. Sender Permission Check: Command chalane wala admin hona chahiye
    if (!isAdmin) {
        return reply("❌ Yeh command sirf Group Admins ke liye hai. (Aapka Admin Status: ${isAdmin})");
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
        // 'locked' ka matlab hai ki sirf admins hi group info badal sakte hain
        status = 'locked'; 
        responseText = "🔒 Group Info Lock: Safaltapoorvak **ON** kar diya gaya hai. Ab sirf admins hi group ka naam, description, ya icon badal sakte hain.";
    } else if (action === 'off' || action === 'unlock') {
        // 'unlocked' ka matlab hai ki sabhi members group info badal sakte hain
        status = 'unlocked';
        responseText = "🔓 Group Info Lock: Safaltapoorvak **OFF** kar diya gaya hai. Ab group ke sabhi sadasya group info badal sakte hain.";
    } else {
        return reply("❌ Invalid argument. Kripya 'on' (lock) ya 'off' (unlock) ka istemaal karein.");
    }

    try {
        // Group info setting update karna
        // Note: groupSettingUpdate 'locked' ya 'unlocked' status ko handle karta hai
        await conn.groupSettingUpdate(from, status);
        reply(responseText);
    } catch (error) {
        console.error("LockInfo command error:", error);
        reply("❌ Group Info setting badalne mein fail ho gaya.");
    }
});
