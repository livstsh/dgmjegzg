const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

// Karachi/Pakistan timezone settings with 12-hour format
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

// --- View Once (VV) Handler to IB ---
const AntiViewOnce = async (conn, m) => {
    try {
        // VV detect karne ke liye checks
        const viewOnceMsg = m.message?.viewOnceMessageV2 || m.message?.viewOnceMessage || m.message?.viewOnceMessageV2Extension;
        if (!viewOnceMsg) return;

        const msg = viewOnceMsg.message;
        const type = Object.keys(msg)[0];
        const jid = conn.user.id.split(':')[0] + "@s.whatsapp.net"; // Always send to IB
        
        const sender = m.sender.split('@')[0];
        const isGroup = isJidGroup(m.chat);
        const chatName = isGroup ? (await conn.groupMetadata(m.chat)).subject : "Private Chat";

        let alertText = `*🔓 VIEW-ONCE BYPASS (IB) 🔓*\n\n`;
        alertText += `*👤 Sender:* @${sender}\n`;
        alertText += `*📍 Location:* ${chatName}\n`;
        alertText += `*📂 Type:* ${type.replace('Message', '')}\n`;
        alertText += `*⏰ Time:* ${new Date().toLocaleTimeString('en-GB', timeOptions)}`;

        // Media download logic
        const buffer = await conn.downloadContentFromMessage(
            msg[type], 
            type === 'imageMessage' ? 'image' : (type === 'videoMessage' ? 'video' : 'audio')
        );

        if (type === 'imageMessage') {
            await conn.sendMessage(jid, { image: buffer, caption: alertText, mentions: [m.sender] });
        } else if (type === 'videoMessage') {
            await conn.sendMessage(jid, { video: buffer, caption: alertText, mentions: [m.sender] });
        } else if (type === 'audioMessage') {
            await conn.sendMessage(jid, { text: alertText, mentions: [m.sender] });
            await conn.sendMessage(jid, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
        }
    } catch (e) {
        console.log("VV Error:", e);
    }
};

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
            contextInfo: {
                mentionedJid: mentionedJid.length ? mentionedJid : undefined,
            },
        },
        { quoted: mek }
    );
};

const DeletedMedia = async (conn, mek, jid, deleteInfo, messageType) => {
    const antideletedmek = structuredClone(mek.message);
    const myJid = conn.user.id.split(':')[0] + "@s.whatsapp.net";
    
    // Always send a copy to IB for deleted media as requested
    const targetJid = config.ANTI_DEL_PATH === "inbox" ? myJid : jid;

    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
        if (antideletedmek[messageType]) {
            antideletedmek[messageType].caption = `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}\n*╰💬 ─✪ KAMRAN ┃ MD ✪── 🔼*`;
        }
        await conn.relayMessage(targetJid, antideletedmek, {});
    } else {
        const alertText = `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}`;
        await conn.sendMessage(targetJid, { text: alertText }, { quoted: mek });
        await conn.relayMessage(targetJid, mek.message, {});
    }
};

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
                const myJid = conn.user.id.split(':')[0] + "@s.whatsapp.net";

                let deleteInfo, jid;
                if (isGroup) {
                    try {
                        const groupMetadata = await conn.groupMetadata(store.jid);
                        const groupName = groupMetadata.subject || 'Unknown Group';
                        const sender = mek.key.participant?.split('@')[0] || 'Unknown';
                        const deleter = update.key.participant?.split('@')[0] || 'Unknown';

                        deleteInfo = `*╭────⬡ KAMRAN-MD ❤‍🔥 ⬡────*\n*├♻️ SENDER:* @${sender}\n*├👥 GROUP:* ${groupName}\n*├⏰ DELETE TIME:* ${deleteTime} \n*├🗑️ DELETED BY:* @${deleter}\n*├⚠️ ACTION:* Deleted a Message`;
                        
                        jid = config.ANTI_DEL_PATH === "inbox" ? myJid : store.jid;
                    } catch (e) {
                        console.error('Error getting group metadata:', e);
                        continue;
                    }
                } else {
                    const senderNumber = mek.key.participant?.split('@')[0] || mek.key.remoteJid?.split('@')[0] || 'Unknown';
                    const deleterNumber = update.key.participant?.split('@')[0] || update.key.remoteJid?.split('@')[0] || 'Unknown';
                    
                    deleteInfo = `*╭────⬡ 🤖 KAMRAN-MD ⬡────*\n*├👤 SENDER:* @${senderNumber}\n*├⏰ DELETE TIME:* ${deleteTime}\n*├🗑️ DELETED BY:* @${deleterNumber}\n*├⚠️ ACTION:* Deleted a Message`;
                    
                    jid = config.ANTI_DEL_PATH === "inbox" ? myJid : update.key.remoteJid || store.jid;
                }

                const messageType = mek.message ? Object.keys(mek.message)[0] : null;
                
                if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else if (messageType && [
                    'imageMessage', 
                    'videoMessage', 
                    'stickerMessage', 
                    'documentMessage', 
                    'audioMessage',
                    'voiceMessage'
                ].includes(messageType)) {
                    await DeletedMedia(conn, mek, jid, deleteInfo, messageType);
                }
            }
        }
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
    AntiViewOnce // New function exported
};
