const config = require('../config')
const { cmd } = require('../command')

// --- Helper Functions ---

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
        const botIdWithoutSuffix = botId.includes('@') ? botId.split('@')[0] : botId;
        const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
        const botLidWithoutSuffix = botLid.includes('@') ? botLid.split('@')[0] : botLid;
        
        const senderNumber = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
        const senderIdWithoutSuffix = senderId.includes('@') ? senderId.split('@')[0] : senderId;
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
                
                const botMatches = (
                    botId === pFullId || botId === pFullLid || botLid === pFullLid ||
                    botLidNumeric === pLidNumeric || botLidWithoutSuffix === pLid ||
                    botNumber === pPhoneNumber || botNumber === pId ||
                    botIdWithoutSuffix === pPhoneNumber || botIdWithoutSuffix === pId ||
                    (botLid && botLid.split('@')[0].split(':')[0] === pLid)
                );
                
                if (botMatches) isBotAdmin = true;
                
                const senderMatches = (
                    senderId === pFullId || senderId === pFullLid ||
                    senderNumber === pPhoneNumber || senderNumber === pId ||
                    senderIdWithoutSuffix === pPhoneNumber || senderIdWithoutSuffix === pId ||
                    (pLid && senderIdWithoutSuffix === pLid)
                );
                
                if (senderMatches) isSenderAdmin = true;
            }
        }
        return { isBotAdmin, isSenderAdmin };
    } catch (err) {
        console.error('❌ Error checking admin status:', err);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// --- 🔗 ANTI-LINK MAIN COMMAND ---

cmd({
    on: "body" // یہ ہر آنے والے میسج کو خودکار طور پر چیک کرے گا
}, async (conn, mek, m, { from, isGroup, body }) => {
    try {
        if (!isGroup) return; // صرف گروپس کے لیے کام کرے گا

        // چیک کریں کہ کیا میسج میں کوئی واٹس ایپ لنک ہے
        const whatsappLinkRegex = /(chat.whatsapp.com\/|whatsapp.com\/channel\/)/gi;
        const hasLink = whatsappLinkRegex.test(body);

        if (hasLink) {
            const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
            const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

            // اگر لنک بھیجنے والا ایڈمن ہے، تو کچھ نہ کریں
            if (isSenderAdmin) return;

            // اگر بوٹ ایڈمن نہیں ہے، تو وہ لنک ڈیلیٹ نہیں کر سکتا
            if (!isBotAdmin) return;

            // 1. فوری طور پر لنک والا میسج ڈیلیٹ کریں
            await conn.sendMessage(from, { delete: mek.key });

            // 2. گروپ میں تصویر، وارننگ اور بٹن بھیجیں
            await conn.sendMessage(from, {
                image: { url: "https://i.ibb.co/v4bYVfM/1000864726.jpg" }, // آپ کی پرووائڈ کردہ تصویر کا لنک
                caption: `*🚫 ᴀɴᴛɪ-ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ! 🚫*\n\n@${senderId.split('@')[0]} گروپ میں لنکس بھیجنا سخت منع ہے۔ آپ کا لنک ڈیلیٹ کر دیا گیا ہے!\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`,
                mentions: [senderId],
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: 'KAMRAN-MD',
                        serverMessageId: 143
                    },
                    // وزٹنگ لنک بٹن کا سیٹ اپ
                    externalAdReply: {
                        title: "VISIT OUR OFFICIAL YOUTUBE / CHANNEL",
                        body: "Click here to join Kamran-MD updates!",
                        mediaType: 1,
                        sourceUrl: "https://whatsapp.com/channel/0029VbBIVnMDTkKBhcCaS00T",
                        thumbnailUrl: "https://i.ibb.co/v4bYVfM/1000864726.jpg"
                    }
                }
            });
        }
    } catch (e) {
        console.error("Anti-link error:", e);
    }
});
                                                                         
