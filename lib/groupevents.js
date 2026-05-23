// Credits ADEEL - ADEEL-MD 💜
const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const getContextInfo = (m, mentions = []) => ({
    mentionedJid: mentions.length > 0 ? mentions : [m.sender],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363421272153826@newsletter',
        newsletterName: '𝐋𝐔𝐂𝐊𝐘-𝐌𝐃',
        serverMessageId: 143,
    },
});

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
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        const getTime = () => {
            return new Date().toLocaleString('en-PK', {
                timeZone: 'Asia/Karachi',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        };

        for (const p of participants) {
            const jid = typeof p === 'string' ? p : (p.phoneNumber || p.id || "unknown@s.whatsapp.net");
            const userName = jid.split("@")[0];
            const timestamp = getTime();

            // Welcome
            if (update.action === "add" && config.WELCOME === "true") {
                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: `Hey @${userName} 👋\nWelcome 👑.\nMember #${groupMembersCount}.\nTime: *${timestamp}*\n${desc}\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${config.BOT_NAME}*.`,
                    mentions: [jid],
                    contextInfo: getContextInfo({ sender: jid }, [jid]),
                });
            }

            // Goodbye
            else if (update.action === "remove" && config.WELCOME === "true") {
                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: `Goodbye @${userName}. 🙂\nAnother member has left.\nTime: *${timestamp}*\nMembers now: ${groupMembersCount}.`,
                    mentions: [jid],
                    contextInfo: getContextInfo({ sender: jid }, [jid]),
                });
            }

            // --- ANTI-DEMOTE SYSTEM ---
            else if (update.action === "demote") {
                const demoterJid = update.author; // جس نے ریموو کیا
                const demotedJid = jid;           // جسے ریموو کیا گیا

                // اگر بوٹ نے خود کیا ہے یا بوٹ خود ہے تو کچھ نہ کریں
                if (demoterJid && demoterJid !== conn.user.id) {
                    try {
                        // 1. ریموو کرنے والے کو نکال دیں
                        await conn.groupParticipantsUpdate(update.id, [demoterJid], "remove");
                        
                        // 2. جس کو ریموو کیا تھا اسے واپس ایڈمن بنائیں
                        await conn.groupParticipantsUpdate(update.id, [demotedJid], "promote");

                        // 3. گروپ میں میسج
                        await conn.sendMessage(update.id, {
                            text: `*🛡️ ANTI-DEMOTE TRIGGERED!*\n\n⚠️ @${demoterJid.split('@')[0]} ne admin @${demotedJid.split('@')[0]} ko hatane ki koshish ki.\n\n❌ Isliye use group se nikal diya gaya hai.\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ LUCKY MD*`,
                            mentions: [demoterJid, demotedJid],
                            contextInfo: getContextInfo({ sender: demoterJid }, [demoterJid, demotedJid])
                        });
                    } catch (e) {
                        console.error("Anti-demote error:", e);
                    }
                }
            }

            // Admin promote
            else if (update.action === "promote" && config.ADMIN_EVENTS === "true") {
                const promoterJid = update.author || jid;
                const promoterName = promoterJid.split("@")[0];
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n@${promoterName} promoted @${userName} 🎉\nTime: ${timestamp}`,
                    mentions: [promoterJid, jid],
                    contextInfo: getContextInfo({ sender: promoterJid }, [promoterJid, jid]),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;

} catch (err) {  
    console.error('Group event error:', err);  
}
};

module.exports = GroupEvents;
