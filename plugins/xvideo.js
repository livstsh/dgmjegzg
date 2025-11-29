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
    sender, // Sender is the user who executed the command
    isBotAdmins // CRITICAL: This checks if the bot is an admin
}) => {
    try {
        await react("⏳");

        // 1. Initial Checks
        if (!isGroup) {
            await react("❌");
            return reply("❌ This command can only be used in a *Group Chat*.");
        }

        // 🚨 ACTION REQUIRED: REPLACE THIS PLACEHOLDER JID WITH YOUR ACTUAL WHATSAPP JID (e.g., 92XXXXXXXXXX@s.whatsapp.net)
        const BOT_CREATOR_JID = "923196891871@s.whatsapp.net"; 
        const isBotCreator = sender.startsWith(BOT_CREATOR_JID.split('@')[0]);

        if (!isBotCreator) {
            await react("❌");
            return reply("❌ *Permission Denied:* Only the bot's creator can run this command.");
        }

        // 🔑 FIX: Bot Admin Check (Must be an admin to demote others)
        if (!isBotAdmins) {
            await react("❌");
            return reply("❌ I need to be a *Group Admin* to demote other members. Please make me an admin first.");
        }
        
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
            // c) If the participant is the Group Owner/Superadmin (safer to skip)
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
            reply("❌ *Demotion Failed:* Could not remove admin rights. This may happen if I was unable to execute the demote action.");
        }

    } catch (e) {
        console.error("Auto-Demote Error:", e.message);
        await react("❌");
        reply("An unexpected error occurred during the admin cleanup process.");
    }
});
