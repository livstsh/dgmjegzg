const { cmd } = require('../command');

// This function ensures the Bot's JID (ID) is correctly retrieved
const getBotJid = (conn) => {
    // Method to get the ID based on your bot's structure
    return conn.user.id.split(':')[0] + '@s.whatsapp.net'; 
};

// --- Anti-Demote Vengeance Logic (MUST be registered via an event) ---
// This cmd function listens for the 'group-participants.update' event
cmd({
    'on': "group-participants.update" 
}, async (conn, m, store, {
    from,
    reply 
}) => {
    // In this event, 'm' is the Group Update data object, not a chat message.
    const update = m; 

    try {
        // 1. Respond only to the 'demote' action
        if (update.action !== 'demote') return;

        const groupJid = update.id;
        const participants = update.participants || [];
        const botJid = getBotJid(conn); 

        // 2. Check if the bot itself was demoted
        const botWasDemoted = participants.includes(botJid);

        if (botWasDemoted) {
            console.log(`[ANTI-DEMOTE] Bot detected demotion in group: ${groupJid}`);
            
            // 3. Get the ID of the user who performed the demotion (initiator)
            const demotingUserJid = update.initiator;

            if (!demotingUserJid) {
                console.error("[ANTI-DEMOTE] Initiator ID not found.");
                return;
            }

            // --- 4. Vengeance Action (Retaliation) ---
            try {
                // Execute the demotion action against the initiator
                // This uses the same function you'd use to demote any user.
                const demoteSuccess = await conn.groupParticipantsUpdate(
                    groupJid, 
                    [demotingUserJid], 
                    'demote' 
                );

                if (demoteSuccess) {
                    console.log(`[ANTI-DEMOTE SUCCESS] Retaliated and demoted the initiator: ${demotingUserJid}`);
                    // Send a notification message in English
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
    }
});
