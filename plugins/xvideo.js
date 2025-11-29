const { cmd } = require('../command');
// NOTE: We assume you have access to the main connection object 'conn' and 
// the admin action function (e.g., conn.groupParticipantsUpdate).

// --- Helper Function: Get Bot's JID ---
// This is required to identify if the bot itself was demoted.
const getBotJid = (conn) => {
    // Assuming conn.user.id holds the bot's ID (e.g., 923195068309:45@s.whatsapp.net)
    return conn.user.id.split(':')[0] + '@s.whatsapp.net'; 
};

// --- Anti-Demote Vengeance Logic (Registered as an Event Listener) ---
cmd({
    // IMPORTANT: This listens for changes in group participants (like demote/promote)
    'on': "group-participants.update" 
}, async (conn, m, store, {
    from,
    reply
}) => {
    // In this specific event handler, 'm' is the update object, not a message object.
    const update = m; 

    try {
        // 1. Check if the update is specifically a DEMOTION action
        if (update.action !== 'demote') return;

        const groupJid = update.id;
        const participants = update.participants || [];
        const botJid = getBotJid(conn); 

        // 2. Check if the bot's JID is in the list of users who were demoted
        const botWasDemoted = participants.includes(botJid);

        if (botWasDemoted) {
            console.log(`[ANTI-DEMOTE] Bot detected demotion in group: ${groupJid}`);
            
            // 3. Get the initiator (the user who performed the demotion action)
            const demotingUserJid = update.initiator;

            if (!demotingUserJid) {
                console.error("[ANTI-DEMOTE] Demotion initiator ID not found.");
                return;
            }

            // --- 4. CRITICAL: Vengeance Action (Retaliation) ---
            
            try {
                // Execute the demotion action against the initiator
                const demoteSuccess = await conn.groupParticipantsUpdate(
                    groupJid, 
                    [demotingUserJid], 
                    'demote' // Action type is 'demote'
                );

                if (demoteSuccess) {
                    console.log(`[ANTI-DEMOTE SUCCESS] Retaliated and demoted the initiator: ${demotingUserJid}`);
                    
                    // Send a notification message to the group
                    await conn.sendMessage(groupJid, { 
                        text: `⚠️ *Anti-Demote Vengeance Activated:* The user who removed my admin status has been automatically demoted!` 
                    });
                } else {
                    console.log(`[ANTI-DEMOTE FAIL] Failed to demote the initiator.`);
                }

            } catch (error) {
                console.error(`[ANTI-DEMOTE FATAL ERROR] Error during retaliation:`, error.message);
            }
        }
    } catch (error) {
        console.error("Error in Anti-Demote system:", error);
        // Do not send a reply here as it's a silent background event
    }
});
