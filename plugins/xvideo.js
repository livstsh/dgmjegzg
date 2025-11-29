const { cmd } = require('../command');
const config = require('../config');

// --- GLOBAL STATE ---
// Initial state is read once from config. 
// NOTE: Ensure your config has ANTI_PM set (e.g., ANTI_PM: "true").
let antiPmEnabled = config.ANTI_PM === "true"; 

// --- 1. Command to Toggle the Feature ---
cmd({
    pattern: "antipm",
    alias: ["pmblock", "pmreject"],
    desc: "Enable or disable the automatic blocking of private messages from non-owners.",
    category: "settings",
    filename: __filename
}, async (conn, m, msg, { text, reply, react, isOwner }) => {
    // Only the bot owner should be able to toggle security settings
    if (!isOwner) {
        await react("❌");
        return reply("❌ *Permission Denied:* Only the bot owner can use this command.");
    }
    
    if (!text) {
        await react("❓");
        return reply(`*Usage: .antipm on | off*\nStatus: ${antiPmEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    }

    const mode = text.toLowerCase().trim();

    if (mode === "on") {
        antiPmEnabled = true;
        await react("✅");
        reply("*✅ ANTI-PM ENABLED:* Private messages from non-owners will be blocked.");
    } else if (mode === "off") {
        antiPmEnabled = false;
        await react("❌");
        reply("*❌ ANTI-PM DISABLED:* The bot will no longer block private messages.");
    } else {
        await react("❓");
        reply("*Usage: .antipm on | off*");
    }
});


// --- 2. Passive Listener (The core blocking logic) ---
cmd({ on: "body" }, async (conn, m, msg, { 
    from, 
    isGroup, 
    sender, 
    isOwner,
    reply 
}) => {
    try {
        // 1. Check if the feature is enabled
        if (!antiPmEnabled) return;
        
        // 2. Filter 1: Skip if it's a Group Message
        if (isGroup) {
            return;
        }
        
        // 3. Filter 2: Allow the Bot Owner
        if (isOwner) {
            return; 
        }
        
        // --- EXECUTION POINT REACHED (PM from Non-Owner) ---
        
        console.log(`[ANTI-PM EXECUTE] Unauthorized PM from: ${sender}. Initiating block.`);

        // 4. Action: Send warning message
        const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
        await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
        
        // 5. CRITICAL ACTION: BLOCK THE USER using the confirmed working function
        try {
            // We use the function confirmed to work in your other commands: updateBlockStatus
            await conn.updateBlockStatus(sender, "block"); 
            console.log(`[ANTI-PM SUCCESS] Successfully blocked user: ${sender}`);
        } catch (blockError) {
            console.error(`[ANTI-PM FINAL FAILURE] Blocking failed for ${sender}:`, blockError.message);
            // Fallback warning if block fails (optional)
            await conn.sendMessage(from, { text: "⚠️ Blocking failed due to API error." });
        }
        
    } catch (err) {
        console.error("Anti-PM Master Error:", err);
    }
});
