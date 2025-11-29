const { cmd } = require('../command');
// NOTE: We assume the bot owner's JID is available, either via config or conn.

// --- Auto-Demote Non-Core Admins Command ---
cmd({
    pattern: "autodemote",
    alias: ["demoteall", "cleanadmin"],
    desc: "Automatically demotes all current administrators in the group, except for the group creator and the bot itself. (Owner-only command)",
    category: "admin",
    react: "🧹",
    filename: __filename
},
async (conn, m, store, { 
    from, 
    isGroup, 
    reply, 
    react,
    sender // Sender is the user who executed the command
}) => {
    try {
        await react("⏳");

        // 1. Initial Checks
        if (!isGroup) {
            await react("❌");
            return reply("❌ This command can only be used in a *Group Chat*.");
        }

        // Placeholder for Owner Check: Replace with your actual Bot Owner/Creator check
        const BOT_CREATOR_JID = "923195068309@s.whatsapp.net"; // Example Creator JID
        const isBotCreator = sender.startsWith(BOT_CREATOR_JID.split('@')[0]);

        if (!isBotCreator) {
            await react("❌");
            return reply("❌ *Permission Denied:* Only the bot's creator can run this command.");
        }

        // Placeholder for Bot Admin Check (Essential for groupParticipantsUpdate)
        // You MUST ensure the bot is an admin here before proceeding.
        // if (!isBotAdmins) return reply("❌ I need to be a Group Admin to demote others.");
        
        // 2. Get Group Metadata and Admin List
        const groupMetadata = await conn.groupMetadata(from);
        const groupAdmins = groupMetadata.participants.filter(p => p.admin !== null);
        
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'; 
        
        let targetsToDemote = [];
        
        // 3. Identify Admins to Demote
        for (let participant of groupAdmins) {
            const jid = participant.id;

            // Criteria to SKIP demotion:
            // a) If the participant is the Bot itself
            // b) If the participant is the Bot Creator (Owner)
            // c) If the participant is the Group Owner (optional, but safer to skip)
            if (jid === botJid || jid === BOT_CREATOR_JID || participant.admin === 'superadmin') {
                continue; 
            }
            
            // If none of the skip criteria are met, add to the demotion list
            targetsToDemote.push(jid);
        }

        if (targetsToDemote.length === 0) {
            await react("ℹ️");
            return reply("ℹ️ *Admin Cleanup Complete:* No secondary administrators were found to demote.");
        }

        // 4. Execute Mass Demotion
        await reply(`⚠️ *Demoting ${targetsToDemote.length} secondary admin(s)...*`);

        const demoteSuccess = await conn.groupParticipantsUpdate(
            from, 
            targetsToDemote, 
            'demote' 
        );
        
        // 5. Send Final Result
        if (demoteSuccess) {
            await reply(`✅ *Success!* Successfully demoted ${targetsToDemote.length} secondary administrators.`);
            await react("✅");
        } else {
            await react("❌");
            reply("❌ *Demotion Failed:* Could not remove admin rights. Check if the bot is a Group Admin with full privileges.");
        }

    } catch (e) {
        console.error("Auto-Demote Error:", e.message);
        await react("❌");
        reply("An unexpected error occurred during the admin cleanup process.");
    }
});
