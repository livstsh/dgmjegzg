const { cmd } = require('../command');
const config = require("../config"); 

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
    // 1. Check if Anti-PM is enabled in config (Assuming config.ANTI_PM_BLOCK exists)
    const antiPmEnabled = config.ANTI_PM_BLOCK === 'true';

    if (!antiPmEnabled) return;
    
    // 2. Filter 1: Skip if it's a Group Message
    if (isGroup) {
      return;
    }
    
    // 3. Filter 2: Allow the Bot Owner (isOwner check is assumed to work from your framework)
    if (isOwner) {
      return; 
    }
    
    // --- EXECUTION POINT REACHED (PM from Non-Owner) ---

    // 4. Action: Send warning message
    const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
    await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
    
    // 5. CRITICAL ACTION: BLOCK THE USER using the confirmed working function
    try {
        await conn.updateBlockStatus(sender, "block"); 
        console.log(`[ANTI-PM SUCCESS] Successfully blocked unauthorized PM user: ${sender}`);
    } catch (blockError) {
        // This should not fail now, but if it does, it's a deep framework issue.
        console.error(`[ANTI-PM FINAL FAILURE] Blocking failed for ${sender}:`, blockError.message);
    }
    
  } catch (error) {
    console.error("Anti-PM Master Error:", error);
    // Silent error handling
  }
});
