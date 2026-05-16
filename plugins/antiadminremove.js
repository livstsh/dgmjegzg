const config = require('../config')
const { cmd } = require('../command')

// --- Helper Function ---

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = conn.user?.id || '';
        const sender = senderId.split('@')[0];

        let isBotAdmin = false;
        let isSenderAdmin = false;

        for (let p of participants) {
            const pid = p.id.split('@')[0];

            if (p.admin === "admin" || p.admin === "superadmin") {
                if (pid === botId.split('@')[0]) isBotAdmin = true;
                if (pid === sender) isSenderAdmin = true;
            }
        }

        return { isBotAdmin, isSenderAdmin };

    } catch (err) {
        console.error(err);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// --- ⚠️ AUTO SELF REMOVE IF ADMIN REMOVES ADMIN ---

cmd({
    on: "group-participants.update"
},
async (conn, update) => {
    try {

        const metadata = await conn.groupMetadata(update.id)
        const participants = metadata.participants || []

        const botId = conn.user.id.split('@')[0]

        // Action check
        if (update.action !== "remove") return

        // Removed user
        const removedUser = update.participants[0].split('@')[0]

        // Author who removed
        const author = update.author
            ? update.author.split('@')[0]
            : null

        if (!author) return

        let removedWasAdmin = false
        let removerWasAdmin = false

        for (let p of participants) {
            const pid = p.id.split('@')[0]

            if (pid === removedUser) {
                if (p.admin === "admin" || p.admin === "superadmin") {
                    removedWasAdmin = true
                }
            }

            if (pid === author) {
                if (p.admin === "admin" || p.admin === "superadmin") {
                    removerWasAdmin = true
                }
            }
        }

        // If admin removed admin
        if (removedWasAdmin && removerWasAdmin) {

            await conn.sendMessage(update.id, {
                text: `⚠️ *Admin ne admin ko remove kiya hai!*\n\n🚫 Ab remover khud remove hoga.`
            })

            // Remove remover admin
            await conn.groupParticipantsUpdate(
                update.id,
                [author + "@s.whatsapp.net"],
                "remove"
            )
        }

    } catch (e) {
        console.log("Error:", e)
    }
})
