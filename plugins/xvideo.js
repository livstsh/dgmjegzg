const { cmd } = require('../command');

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
    sender, // Sender is the user who executed the command
    isBotAdmins // Checks if the bot is an admin (Critical!)
}) => {
    try {
        console.log(`[AUTODEMOTE] Command executed by: ${sender}`);
        await react("⏳");

        // 1. Initial Checks
        if (!isGroup) {
            await react("❌");
            return reply("❌ This command can only be used in a *Group Chat*.");
        }

        // 🚨 ACTION REQUIRED: REPLACE THIS PLACEHOLDER JID WITH YOUR ACTUAL WHATSAPP JID 
        const BOT_CREATOR_JID = "923196891871@s.whatsapp.net"; 
        
        // Ensure the sender's JID matches the Creator's JID part
        const senderNumber = sender.split('@')[0];
        const creatorNumber = BOT_CREATOR_JID.split('@')[0];
        const isBotCreator = senderNumber === creatorNumber;

        if (!isBotCreator) {
            console.log(`[AUTODEMOTE DEBUG] Failed: Sender (${senderNumber}) is not the Creator (${creatorNumber}).`);
            await react("❌");
            return reply("❌ *Permission Denied:* Only the bot's creator can run this command.");
        }
        
        // 🔑 FIX 1: Bot Admin Check
        if (!isBotAdmins) {
            console.log(`[AUTODEMOTE DEBUG] Failed: Bot is NOT an admin in group ${from}.`);
            await react("❌");
            return reply("❌ I need to be a *Group Admin* to demote other members. Please make me an admin first.");
        }
        
        // 2. Get Group Metadata and Admin List
        const groupMetadata = await conn.groupMetadata(from);
        // Filter participants to only include current admins (admin status is not null)
        const groupAdmins = groupMetadata.participants.filter(p => p.admin !== null);
        
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'; 
        
        let targetsToDemote = [];
        
        // 3. Identify Admins to Demote
        for (let participant of groupAdmins) {
            const jid = participant.id;

            // Criteria to SKIP demotion:
            // a) If the participant is the Bot itself
            // b) If the participant is the Bot Creator (Owner)
            // c) If the participant is the Group Owner/Superadmin ('superadmin' means the primary group owner)
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
        
        console.log(`[AUTODEMOTE DEBUG] Found ${targetsToDemote.length} target(s) for demotion.`);


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
            reply("❌ *Demotion Failed:* Could not remove admin rights. This may be a permission issue.");
        }

    } catch (e) {
        // This catches errors like failure to fetch group metadata or API errors
        console.error("Auto-Demote Error:", e);
        await react("❌");
        reply("❌ *Fatal Error:* An unexpected error occurred. Check console for details.");
    }
});
