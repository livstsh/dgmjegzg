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
    // We assume the configuration variable is ANTI_PM_BLOCK and its value is "true"
    if (config.ANTI_PM_BLOCK !== 'true') {
      return;
    }

    // 2. Filter 1: Check if the chat is a Private Message (Not a Group)
    if (isGroup) {
      return;
    }
    
    // 3. Filter 2: Allow the Bot Owner to PM the bot
    if (isOwner) {
      // The bot owner is allowed to interact via PM
      return; 
    }

    // 4. Action: If it's a PM and not the Owner, block or send a warning
    
    // Send a warning message first
    const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You will be blocked if you message again.";
    await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
    
    // Log the event
    console.log(`[ANTI-PM] Blocked unauthorized PM from: ${sender}`);

    // Action 2: Block the sender
    // NOTE: You need to confirm the correct function in your framework for blocking.
    // Assuming conn.updateBlockStatus is the correct method:
    await conn.updateBlockStatus(sender, "block"); 
    
    // Alternative method in some frameworks (if the above doesn't work):
    // await conn.chatModify({ block: sender }); 
    
  } catch (error) {
    console.error("Anti-PM Error:", error);
    // Silent error handling is preferred for passive security features
  }
});
