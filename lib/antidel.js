const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

// Timezone settings with 12-hour format
const timeOptions = {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
};

const getMessageContent = (mek) => {
    if (mek.message?.conversation) return mek.message.conversation;
    if (mek.message?.extendedTextMessage?.text) return mek.message.extendedTextMessage.text;
    return '';
};

// --- DELETE HANDLERS ---
const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    const messageContent = getMessageContent(mek);
    const alertText = `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}\n  ◈ Content ━ ${messageContent}`;

    const mentionedJid = [];
    if (isGroup) {
        if (update.key.participant) mentionedJid.push(update.key.participant);
        if (mek.key.participant) mentionedJid.push(mek.key.participant);
    } else {
        if (mek.key.participant) mentionedJid.push(mek.key.participant);
        else if (mek.key.remoteJid) mentionedJid.push(mek.key.remoteJid);
    }

    await conn.sendMessage(
        jid,
        {
            text: alertText,
            contextInfo: { mentionedJid: mentionedJid.length ? mentionedJid : undefined },
        },
        { quoted: mek }
    );
};

const DeletedMedia = async (conn, mek, jid, deleteInfo, messageType) => {
    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
        const antideletedmek = structuredClone(mek.message);
        if (antideletedmek[messageType]) {
            antideletedmek[messageType].caption = `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}\n*╰💬 ─✪ KAMRAN ┃ MD ✪── 🔼*`;
            antideletedmek[messageType].contextInfo = {
                stanzaId: mek.key.id,
                participant: mek.key.participant || mek.key.remoteJid,
                quotedMessage: mek.message,
            };
        }
        await conn.relayMessage(jid, antideletedmek, {});
    } else {
        const alertText = `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}`;
        await conn.sendMessage(jid, { text: alertText }, { quoted: mek });
        await conn.relayMessage(jid, mek.message, {});
    }
};

// --- MAIN FUNCTIONS ---

const AntiDelete = async (conn, updates) => {
    for (const update of updates) {
        if (update.update.message === null) {
            const store = await loadMessage(update.key.id);
            if (store && store.message) {
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const antiDeleteStatus = await getAnti();
                if (!antiDeleteStatus) continue;

                const deleteTime = new Date().toLocaleTimeString('en-GB', timeOptions).toLowerCase();
                let deleteInfo, jid;

                if (isGroup) {
                    try {
                        const groupMetadata = await conn.groupMetadata(store.jid);
                        const sender = mek.key.participant?.split('@')[0] || 'Unknown';
                        const deleter = update.key.participant?.split('@')[0] || 'Unknown';
                        deleteInfo = `*╭────⬡ KAMRAN-MD ❤‍🔥 ⬡────*\n*├♻️ SENDER:* @${sender}\n*├👥 GROUP:* ${groupMetadata.subject}\n*├⏰ DELETE TIME:* ${deleteTime} \n*├🗑️ DELETED BY:* @${deleter}\n*├⚠️ ACTION:* Deleted a Message`;
                        jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : store.jid;
                    } catch (e) { continue; }
                } else {
                    const senderNumber = mek.key.participant?.split('@')[0] || mek.key.remoteJid?.split('@')[0] || 'Unknown';
                    deleteInfo = `*╭────⬡ 🤖 KAMRAN-MD ⬡────*\n*├👤 SENDER:* @${senderNumber}\n*├⏰ DELETE TIME:* ${deleteTime}\n*├⚠️ ACTION:* Deleted a Message`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : store.jid;
                }

                const messageType = mek.message ? Object.keys(mek.message)[0] : null;
                if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else if (messageType && ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'audioMessage', 'voiceMessage'].includes(messageType)) {
                    await DeletedMedia(conn, mek, jid, deleteInfo, messageType);
                }
            }
        }
    }
};

const AntiEdit = async (conn, updates) => {
    for (const update of updates) {
        if (update.update.editedMessage) {
            try {
                const key = update.key;
                const protocolMsg = update.update.editedMessage.protocolMessage;
                if (!protocolMsg || protocolMsg.type !== 14) continue;

                const store = await loadMessage(key.id);
                if (!store || !store.message) continue;

                const mek = store.message;
                const isGroup = isJidGroup(key.remoteJid);
                const antiStatus = await getAnti();
                if (!antiStatus) continue;

                const editTime = new Date().toLocaleTimeString('en-GB', timeOptions).toLowerCase();
                const oldContent = getMessageContent(mek) || "Media/Unsupported";
                const newContent = protocolMsg.editedMessage?.conversation || protocolMsg.editedMessage?.extendedTextMessage?.text || "Non-text edit";

                if (oldContent === newContent) continue;

                let editInfo, jid;
                const sender = key.participant || key.remoteJid;
                
                if (isGroup) {
                    const groupMetadata = await conn.groupMetadata(key.remoteJid);
                    editInfo = `*╭────⬡ KAMRAN-MD 🛡️ ⬡────*\n*├👤 SENDER:* @${sender.split('@')[0]}\n*├👥 GROUP:* ${groupMetadata.subject}\n*├⏰ EDIT TIME:* ${editTime}\n*├📜 OLD:* ${oldContent}\n*├📝 NEW:* ${newContent}\n*╰─────⬡ ANTI-EDIT ⬡─────*`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : key.remoteJid;
                } else {
                    editInfo = `*╭────⬡ KAMRAN-MD 🛡️ ⬡────*\n*├👤 USER:* @${sender.split('@')[0]}\n*├⏰ EDIT TIME:* ${editTime}\n*├📜 OLD:* ${oldContent}\n*├📝 NEW:* ${newContent}\n*╰─────⬡ ANTI-EDIT ⬡─────*`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : key.remoteJid;
                }

                await conn.sendMessage(jid, { text: editInfo, mentions: [sender] }, { quoted: mek });
            } catch (e) { console.error('Anti-Edit Error:', e); }
        }
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
    AntiEdit
};
                          
