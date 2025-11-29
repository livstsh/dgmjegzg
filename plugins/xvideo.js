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
    // 1. Check Config
    const antiPmEnabled = config.ANTI_PM_BLOCK === 'true';

    if (!antiPmEnabled) return;
    
    // --- DEBUGGING START ---
    console.log(`[ANTI-PM DEBUG] Message received from: ${sender}`);
    console.log(`[ANTI-PM DEBUG] isGroup: ${isGroup}, isOwner: ${isOwner}`);
    // --- DEBUGGING END ---
    
    // 2. Filters
    // Filter 1: Stop if it is a Group Chat
    if (isGroup) {
        console.log(`[ANTI-PM DEBUG] Filter 1: Skipped because it is a Group.`);
        return; 
    }
    
    // Filter 2: Stop if the Sender is the Owner
    if (isOwner) {
        console.log(`[ANTI-PM DEBUG] Filter 2: Skipped because Sender is the Owner.`);
        return; 
    }
    
    // --- EXECUTION POINT REACHED (PM from Non-Owner) ---
    console.log(`[ANTI-PM EXECUTE] Detected unauthorized PM from: ${sender}. Initiating block.`);

    // 3. Action: Send warning and attempt to block
    
    // Warning message
    const warningMessage = "🚫 *Private Messages are not allowed.* Please use the bot in a designated group chat. You are being blocked.";
    await conn.sendMessage(from, { text: warningMessage }, { quoted: m });
    
    // 4. Blocking Attempt (Potential failure point)
    let blockSuccessful = false;

    // --- Method A: Standard Block (Most common method) ---
    try {
        await conn.updateBlockStatus(sender, "block"); 
        blockSuccessful = true;
        console.log(`[ANTI-PM SUCCESS A] Blocked via updateBlockStatus.`);
    } catch (blockErrorA) {
        console.error(`[ANTI-PM FAIL A] updateBlockStatus failed: ${blockErrorA.message}`);
    }

    // --- Method B: Alternative Block (If Method A fails) ---
    if (!blockSuccessful) {
        try {
            // Some frameworks use chatModify
            await conn.chatModify({ block: sender }); 
            blockSuccessful = true;
            console.log(`[ANTI-PM SUCCESS B] Blocked via chatModify.`);
        } catch (blockErrorB) {
            console.error(`[ANTI-PM FAIL B] chatModify failed: ${blockErrorB.message}`);
        }
    }
    
    if (!blockSuccessful) {
        console.error(`[ANTI-PM FINAL FAIL] Could not block ${sender} using any known method.`);
    }
    
  } catch (error) {
    console.error("Anti-PM Master Error:", error);
  }
});
