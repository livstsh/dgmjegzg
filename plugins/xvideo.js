const { cmd } = require('../command');
const config = require("../config"); 

// --- BLOCKING FUNCTION (CRITICAL SECTION TO ADJUST) ---
// This function attempts to block the user using common methods.
// If it fails, you MUST replace the content of this function with your framework's working block method.
const blockUser = async (conn, senderJid) => {
    // 1. Attempt using the MOST common method (WhatsApp Baileys style)
    try {
        await conn.updateBlockStatus(senderJid, "block"); 
        console.log(`[BLOCK SUCCESS A] Blocked via updateBlockStatus.`);
        return true;
    } catch (e) {
        console.error(`[BLOCK FAIL A] updateBlockStatus failed: ${e.message}`);
    }

    // 2. Attempt using an Alternative method (Some older/different forks use this)
    try {
        // NOTE: Some frameworks need the second argument (the senderJid) here.
        await conn.chatModify({ block: senderJid }, senderJid); 
        console.log(`[BLOCK SUCCESS B] Blocked via chatModify.`);
        return true;
    } catch (e) {
        console.error(`[BLOCK FAIL B] chatModify failed: ${e.message}`);
    }
    
    // --- 🚨 FINAL FAILURE POINT 🚨 ---
    // If you see [BLOCK FAIL A] and [BLOCK FAIL B], you need to replace the content 
    // of this function with the one line that works in your bot.
    
    // Example: If your bot uses 'conn.block' function:
    // try { await conn.block(senderJid); return true; } catch (e) {}

    return false;
};
// -----------------------------------------------------------


// --- Anti-Private Message System (Anti-PM) ---
cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  isGroup,
  reply,
  sender,
  isOwner 
}) => {
  try {
    const antiPmEnabled = config.ANTI_PM_BLOCK === 'true';

    if (!antiPmEnabled) return;
    
    // --- DEBUGGING LOGS ---
    console.log(`[ANTI-PM DEBUG] Message received from: ${sender}`);
    console.log(`[ANTI-PM DEBUG] isGroup: ${isGroup}, isOwner: ${isOwner}`);
    
    // 2. Filters
    if (isGroup) {
        return; 
    }
    
    if (isOwner) {
        return; 
    }
    
    // --- EXECUTION POINT REACHED (PM from Non-Owner) ---
    console.log(`[ANTI-PM EXECUTE] Detected unauthorized PM from: ${sender}. Initiating block.`);

    // 3. Action: Send warning and attempt to block
    const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
    await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
    
    // 4. Blocking Attempt using the isolated function
    const blockSuccessful = await blockUser(conn, sender);
    
    if (!blockSuccessful) {
        console.error(`[ANTI-PM FINAL FAIL] Could not block ${sender}. You must replace the blocking function.`);
    }
    
  } catch (error) {
    console.error("Anti-PM Master Error:", error);
  }
});
