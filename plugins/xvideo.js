const { cmd } = require('../command');
const config = require("../config"); 

// --- Universal Anti-Private Message System (Anti-PM) ---
cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  isGroup,
  reply,
  sender,
  isOwner // True if the sender is the bot's configured owner
}) => {
  try {
    // 1. Check Config (Assuming config is loaded correctly)
    const antiPmEnabled = config.ANTI_PM_BLOCK === 'true';

    if (!antiPmEnabled) return;
    
    // 2. Filters
    if (isGroup) return; // Only process Private Messages
    if (isOwner) return; // Allow the Bot Owner to PM

    // --- Action: Send warning and attempt to block ---
    
    // Send a warning message first
    const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
    await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
    
    // 3. Blocking Attempt (Using the two most common methods)
    let blockSuccessful = false;

    // --- Method A: Standard Block (Most Common) ---
    try {
        await conn.updateBlockStatus(sender, "block"); 
        blockSuccessful = true;
    } catch (blockErrorA) {
        console.error(`[ANTI-PM FAIL A] updateBlockStatus failed: ${blockErrorA.message}`);
    }

    // --- Method B: Alternative Block (Used by some frameworks) ---
    if (!blockSuccessful) {
        try {
            // Note: This often requires the full JID format (number@s.whatsapp.net)
            await conn.chatModify({ block: sender }); 
            blockSuccessful = true;
        } catch (blockErrorB) {
            console.error(`[ANTI-PM FAIL B] chatModify failed: ${blockErrorB.message}`);
        }
    }
    
    if (!blockSuccessful) {
        console.error(`[ANTI-PM FINAL FAIL] Could not block ${sender} using any known method.`);
    } else {
        console.log(`[ANTI-PM SUCCESS] Successfully blocked PM from: ${sender}`);
    }
    
  } catch (error) {
    console.error("Anti-PM Master Error:", error);
  }
});
