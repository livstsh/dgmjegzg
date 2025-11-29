const { cmd } = require('../command');
const config = require('../config');

// --- GLOBAL STATE ---
// Initial state is read once from config. 
let antiPmEnabled = config.ANTI_PM === "true"; 

// --- 1. Command to Toggle the Feature ---
cmd({
    pattern: "antipm",
    alias: ["pmblock", "pmreject"],
    desc: "Enable or disable the automatic blocking of private messages from non-owners.",
    category: "settings",
    filename: __filename
}, async (conn, m, msg, { text, reply, react, isOwner }) => {
    // Permission check: Only the bot owner can toggle security settings
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


// --- 2. Passive Listener (The core blocking logic runs here) ---
// This acts exactly like your anti-call's passive listener structure.
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
        
        // 2. Filter 1 & 2: Skip if Group or Owner
        if (isGroup || isOwner) {
            return;
        }
        
        // --- EXECUTION POINT REACHED (PM from Non-Owner) ---
        
        console.log(`[ANTI-PM EXECUTE] Unauthorized PM from: ${sender}. Initiating block.`);

        // 3. Action: Send warning message
        const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
        await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
        
        // 4. CRITICAL ACTION: BLOCK THE USER
        let blockSuccessful = false;

        // METHOD 1 (Standard Command Method - May fail in events)
        try {
            await conn.updateBlockStatus(sender, "block"); 
            blockSuccessful = true;
        } catch (e) {
            console.error(`[BLOCK FAIL 1] updateBlockStatus failed in event context.`);
        }

        // METHOD 2 (Event Handler Alternative - Trying updateBlocklist)
        if (!blockSuccessful) {
            try {
                await conn.updateBlocklist(sender, 'add');
                blockSuccessful = true;
            } catch(e) {
                console.error(`[BLOCK FAIL 2] updateBlocklist failed.`);
            }
        }
        
        // METHOD 3 (Event Handler Alternative - Trying chatModify)
        if (!blockSuccessful) {
            try {
                 await conn.chatModify({ block: sender }, sender);
                 blockSuccessful = true;
            } catch(e) {
                 console.error(`[BLOCK FAIL 3] chatModify failed.`);
            }
        }


        if (!blockSuccessful) {
            // If all three methods fail, the user must replace one of the lines with their correct function
            console.error(`[ANTI-PM FINAL FAILURE] Could not block ${sender}. All 3 common methods failed.`);
            await conn.sendMessage(from, { text: "⚠️ Fatal Block Error: Bot could not block the user. The owner must check console logs." });
        }
        
    } catch (err) {
        console.error("Anti-PM Master Error:", err);
    }
});
