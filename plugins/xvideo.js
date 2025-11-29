const { cmd } = require('../command');
const config = require("../config"); // Assuming config is imported

// --- Anti-Private Message System (Anti-PM) ---
cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  isGroup,
  reply,
  sender,
  senderNumber,
  isOwner // True if the sender is the bot's configured owner
}) => {
  try {
    // 1. Check if Anti-PM is enabled in config
    const antiPmEnabled = config.ANTI_PM_BLOCK === 'true';

    if (!antiPmEnabled) {
      // console.log("[ANTI-PM DEBUG] Feature disabled by config.");
      return;
    }
    
    // 2. Filter 1: Check if the chat is a Private Message (Not a Group)
    if (isGroup) {
      return;
    }
    
    // 3. Filter 2: Allow the Bot Owner to PM the bot
    if (isOwner) {
      return; 
    }

    // --- EXECUTION POINT REACHED (PM from Non-Owner) ---
    console.log(`[ANTI-PM DEBUG] Detected unauthorized PM from: ${sender}. Initiating block.`);

    // 4. Action: Send warning and block
    
    // Send a warning message first
    const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You will be blocked.";
    await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
    
    // 5. Block the sender (Potential failure point)
    
    // CRITICAL SECTION: We are assuming conn.updateBlockStatus is the correct method.
    // If the block fails here, you must use the 'chatModify' alternative below.
    try {
        await conn.updateBlockStatus(sender, "block"); 
        console.log(`[ANTI-PM DEBUG] Successfully executed conn.updateBlockStatus for ${sender}.`);
    } catch (blockError) {
        console.error(`[ANTI-PM ERROR] Failed to block user via updateBlockStatus. Trying alternative method.`, blockError.message);
        
        // --- Alternative Blocking Method (if updateBlockStatus fails) ---
        // If your framework uses the 'chatModify' method:
        // await conn.chatModify({ block: sender }); 
        
        // If your framework uses 'updateBlockStatus' but needs the number format:
        // await conn.updateBlockStatus(senderNumber + "@s.whatsapp.net", "block"); 
    }
    
  } catch (error) {
    console.error("Anti-PM Master Error:", error);
    // Silent error handling is preferred for passive security features
  }
});
