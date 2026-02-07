const { cmd, commands } = require('../command');
const config = require('../config');

// Function to check if user is admin (with LID support)
async function isUserAdmin(conn, chatId, userId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const normalizeId = (id) => {
            if (!id) return '';
            return id
                .replace(/:[0-9]+/g, '')
                .replace(/@(lid|s\.whatsapp\.net|c\.us|g\.us)/g, '')
                .replace(/[^\d]/g, '');
        };

        const normalizedUserId = normalizeId(userId);

        for (let p of participants) {
            const participantIds = [
                p.id,
                p.lid,
                p.phoneNumber,
                p.jid
            ].filter(Boolean);

            for (let pid of participantIds) {
                if (normalizeId(pid) === normalizedUserId) {
                    return p.admin === "admin" || p.admin === "superadmin";
                }
            }
        }

        return false;
    } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
    }
}

// Function to check if bot is admin (with LID support)
async function isBotAdmin(conn, chatId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';

        const normalizeId = (id) => {
            if (!id) return '';
            return id
                .replace(/:[0-9]+/g, '')
                .replace(/@(lid|s\.whatsapp\.net|c\.us|g\.us)/g, '')
                .replace(/[^\d]/g, '');
        };

        const normalizedBotId = normalizeId(botId);
        const normalizedBotLid = normalizeId(botLid);

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const participantIds = [
                    p.id,
                    p.lid,
                    p.phoneNumber
                ].filter(Boolean);

                for (let pid of participantIds) {
                    const normalizedPid = normalizeId(pid);
                    if (normalizedPid === normalizedBotId || normalizedPid === normalizedBotLid) {
                        return true;
                    }
                }
            }
        }

        return false;
    } catch (err) {
        console.error('Error checking bot admin status:', err);
        return false;
    }
}

cmd({
    on: "body"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    reply
}) => {
    try {
        if (
            config.ANTI_LINK === 'false' ||
            config.ANTI_LINK === false ||
            !config.ANTI_LINK
        ) return;

        if (!isGroup) return;

        const senderIsAdmin = await isUserAdmin(conn, from, sender);
        if (senderIsAdmin) return;

        const botIsAdmin = await isBotAdmin(conn, from);
        if (!botIsAdmin) return;

        let cleanBody = body.replace(/[\s\u200b-\u200d\uFEFF]/g, '').toLowerCase();

        const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|org|net|co|pk|biz|id|info|xyz|online|site|website|tech|shop|store|blog|app|dev|io|ai|gov|edu|mil|me)(?:\/[^\s]*)?|whatsapp\.com\/channel\/|wa\.me\//gi;

        const containsLink = urlRegex.test(cleanBody);

        if (!containsLink) return;

        const userNumber = sender.split('@')[0] || 'User';

        // Delete message if enabled
        if (
            config.DELETE_LINKS === 'true' ||
            config.DELETE_LINKS === true ||
            config.ANTI_LINK_KICK === 'true' ||
            config.ANTI_LINK_KICK === true
        ) {
            try {
                await conn.sendMessage(from, { delete: m.key }, { quoted: m });
            } catch (e) {
                console.error("Failed to delete message:", e);
            }
        }

        // Kick user only if enabled
        if (config.ANTI_LINK_KICK === 'true' || config.ANTI_LINK_KICK === true) {
            try {
                await conn.sendMessage(from, {
                    text:
                        `🚫 *ANTI-LINK PROTECTION*\n\n` +
                        `@${userNumber} has been removed from the group for sending links.`,
                    mentions: [sender]
                });

                await conn.groupParticipantsUpdate(from, [sender], "remove");
            } catch (e) {
                console.error("Failed to kick user:", e);
            }
        }

    } catch (error) {
        console.error("Anti-link system error:", error);
    }
});