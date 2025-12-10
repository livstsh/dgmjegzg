const { cmd } = require('../command');
const config = require('../config');

// --- GLOBAL STATE ---
let antiPmEnabled = config.ANTI_PM === "true"; 

// --- 1. Command to Toggle the Feature ---
cmd({
    pattern: "antipm",
    alias: ["pmblock", "pmreject"],
    desc: "Enable or disable the automatic blocking of private messages from non-owners.",
    category: "settings",
    filename: __filename
}, async (conn, m, msg, { text, reply, react, isOwner }) => {
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
cmd({ on: "body" }, async (conn, m, msg, { 
    from, 
    isGroup, 
    sender, 
    isOwner,
    reply 
}) => {
    try {
        if (!antiPmEnabled) return;
        
        // Skip if Group or Owner
        if (isGroup || isOwner) {
            return;
        }
        
        console.log(`[ANTI-PM EXECUTE] Unauthorized PM from: ${sender}. Initiating block.`);

        // 3. Action: Send warning message
        const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
        await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
        
        // 4. CRITICAL ACTION: BLOCK THE USER
        let blockSuccessful = false;

        // METHOD 1 (updateBlockStatus)
        try {
            await conn.updateBlockStatus(sender, "block"); 
            blockSuccessful = true;
        } catch (e) {
            console.error(`[BLOCK FAIL 1] updateBlockStatus failed.`);
        }

        // METHOD 2 (updateBlocklist)
        if (!blockSuccessful) {
            try {
                await conn.updateBlocklist(sender, 'add');
                blockSuccessful = true;
            } catch(e) {
                console.error(`[BLOCK FAIL 2] updateBlocklist failed.`);
            }
        }
        
        // METHOD 3 (chatModify)
        if (!blockSuccessful) {
            try {
                 await conn.chatModify({ block: sender }, sender);
                 blockSuccessful = true;
            } catch(e) {
                 console.error(`[BLOCK FAIL 3] chatModify failed.`);
            }
        }

        // --- 🚨 CRITICAL FIX AREA 🚨 ---
        // METHOD 4: THE LAST RESORT
        if (!blockSuccessful) {
            // MOST LIKELY YOUR FRAMEWORK USES A DIFFERENT FUNCTION FOR EVENTS.
            // YOU MUST CHANGE THE LINE BELOW (conn.blockUser) to whatever works in your system!
            try {
                // *** 💡 DANGER ZONE: CHANGE THIS LINE WITH YOUR BOT'S TRUE BLOCKING FUNCTION 💡 ***
                await conn.blockUser(sender); 
                console.log(`[BLOCK SUCCESS 4] Blocked via final custom method (conn.blockUser).`);
                blockSuccessful = true;
            } catch(e) {
                console.error(`[BLOCK FAIL 4] Final custom block method failed.`);
            }
        }
        // --- 🚨 END CRITICAL FIX AREA 🚨 ---


        if (!blockSuccessful) {
            console.error(`[ANTI-PM FINAL FAILURE] Could not block ${sender}. All 4 common methods failed.`);
            await conn.sendMessage(from, { text: "⚠️ Fatal Block Error: Bot could not block the user. The owner must check console logs." });
        }
        
    } catch (err) {
        console.error("Anti-PM Master Error:", err);
    }
});
