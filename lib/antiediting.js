const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti, getAntiEdit } = require('../data');
const config = require('../config');

const timeOptions = {
    timeZone: 'Asia/Karachi',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
};

const getMessageContent = (mek) => {
    if (mek.message?.conversation) return mek.message.conversation;
    if (mek.message?.extendedTextMessage?.text) return mek.message.extendedTextMessage.text;
    return '';
};

// --- Inhe rehne dena zaroori hai ---
const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    const messageContent = getMessageContent(mek);
    const alertText = `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}\n  ◈ Content ━ ${messageContent}`;
    await conn.sendMessage(jid, { text: alertText, mentions: [update.key.participant || mek.key.remoteJid] }, { quoted: mek });
};

// --- MAIN FUNCTIONS ---

const AntiDelete = async (conn, updates) => {
    const antiDeleteStatus = await getAnti();
    if (!antiDeleteStatus) return;

    for (const update of updates) {
        if (update.update && update.update.message === null) {
            const store = await loadMessage(update.key.id);
            if (store && store.message) {
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const deleteTime = new Date().toLocaleTimeString('en-GB', timeOptions).toLowerCase();
                let deleteInfo = `*╭────⬡ KAMRAN-MD ❤‍🔥 ⬡────*\n*├⏰ TIME:* ${deleteTime}\n*├⚠️ ACTION:* Deleted Message`;
                let jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : store.jid;
                
                const messageType = Object.keys(mek.message)[0];
                if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                }
            }
        }
    }
};

const AntiEdit = async (conn, updates) => {
    const antiEditStatus = await getAntiEdit();
    if (!antiEditStatus) return;

    for (const update of updates) {
        // WhatsApp update.update.editedMessage bhejta hai 
        if (update.update && update.update.editedMessage) {
            try {
                const key = update.key;
                const protocolMsg = update.update.editedMessage.protocolMessage;
                if (!protocolMsg || protocolMsg.type !== 14) continue;

                const store = await loadMessage(key.id);
                if (!store || !store.message) continue;

                const mek = store.message;
                const isGroup = isJidGroup(key.remoteJid);
                const editTime = new Date().toLocaleTimeString('en-GB', timeOptions).toLowerCase();
                
                const oldContent = getMessageContent(mek) || "Media/Unsupported Content";
                const newContent = protocolMsg.editedMessage?.conversation || 
                                 protocolMsg.editedMessage?.extendedTextMessage?.text || "Non-text edit";

                if (oldContent === newContent) continue;

                let jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : key.remoteJid;
                const sender = key.participant || key.remoteJid;
                
                let editInfo = `*╭────⬡ KAMRAN-MD 🛡️ ⬡────*\n*├👤 SENDER:* @${sender.split('@')[0]}\n*├⏰ TIME:* ${editTime}\n*├📜 OLD:* ${oldContent}\n*├📝 NEW:* ${newContent}\n*╰─────⬡ ANTI-EDIT ⬡─────*`;

                await conn.sendMessage(jid, { text: editInfo, mentions: [sender] }, { quoted: mek });
            } catch (e) { console.error('Anti-Edit Error:', e); }
        }
    }
};

module.exports = { AntiDelete, AntiEdit };
                                                              
