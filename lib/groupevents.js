//Give Me Credit If Using This File Give Me Credit On Your Channel ✅ 
// Credits ADEEL - ADEEL-MD 💜 

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

/**
 * 🔥 UNIVERSAL JID NORMALIZER (Baileys 2026 LID FIX)
 */
const normalizeJid = (jid) => {
    if (!jid) return '';

    // If object format appears
    if (typeof jid === 'object' && jid.remoteJidAlt) {
        jid = jid.remoteJidAlt;
    }

    jid = jid.toString();

    // remove device part (:12)
    if (jid.includes(':')) jid = jid.split(':')[0];

    // ignore LID ids for mentions
    if (jid.endsWith('@lid')) return '';

    return jid;
};

const getNumber = (jid) => normalizeJid(jid).split('@')[0];

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender].filter(Boolean),
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363418144382782@newsletter',
            newsletterName: 'PROVA-𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        if (!isJidGroup(update.id)) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants || [];
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            ppUrl = ppUrls[0];
        }

        for (const rawNum of participants) {

            const cleanNum = normalizeJid(rawNum);
            const userName = getNumber(cleanNum);
            const timestamp = new Date().toLocaleString();

            // Skip if cannot normalize (LID only case)
            if (!cleanNum) continue;

            // ---------------- WELCOME ----------------
            if (update.action === "add" && config.WELCOME === "true") {

                const WelcomeText = `Hey @${userName} 👋
Welcome to *${metadata.subject}*.
You are member number ${groupMembersCount} in this group. 🙏
Time joined: *${timestamp}*

Please read the group description to avoid being removed:
${desc}

*Powered by ${config.BOT_NAME}*.`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [cleanNum],
                    contextInfo: getContextInfo({ sender: cleanNum }),
                });

            }

            // ---------------- GOODBYE ----------------
            else if (update.action === "remove" && config.WELCOME === "true") {

                const GoodbyeText = `Goodbye @${userName}. 🙂
Another member has left the group.
Time left: *${timestamp}*
The group now has ${groupMembersCount} members. 🌚`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [cleanNum],
                    contextInfo: getContextInfo({ sender: cleanNum }),
                });

            }

            // ---------------- DEMOTE ----------------
            else if (update.action === "demote" && config.ADMIN_EVENTS === "true") {

                const demoterJid = normalizeJid(update.author);
                const demoter = getNumber(demoterJid);

                await conn.sendMessage(update.id, {
                    text: `*Admin Event*

@${demoter} has demoted @${userName} from admin. 👀
Time: ${timestamp}
*Group:* ${metadata.subject}`,
                    mentions: [demoterJid, cleanNum].filter(Boolean),
                    contextInfo: getContextInfo({ sender: demoterJid }),
                });

            }

            // ---------------- PROMOTE ----------------
            else if (update.action === "promote" && config.ADMIN_EVENTS === "true") {

                const promoterJid = normalizeJid(update.author);
                const promoter = getNumber(promoterJid);

                await conn.sendMessage(update.id, {
                    text: `*Admin Event*

@${promoter} has promoted @${userName} to admin. 🎉
Time: ${timestamp}
*Group:* ${metadata.subject}`,
                    mentions: [promoterJid, cleanNum].filter(Boolean),
                    contextInfo: getContextInfo({ sender: promoterJid }),
                });
            }
        }

    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;
