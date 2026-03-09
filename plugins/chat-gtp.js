const { cmd } = require('../command');
const axios = require('axios');

// Define combined fakevCard 
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© PROVA MD 𝐁𝐎𝐓",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:PROVA MD 𝐁𝐎𝐓\nORG:PROVA-MD;\nTEL;type=CELL;type=VOICE;waid=923195068309:+92319 506 8309\nEND:VCARD`
    }
  }
};

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363422931946639@newsletter',
            newsletterName: '© ᴘʀᴏᴠᴀ-ᴍᴅ',
            serverMessageId: 143,
        },
    };
};

cmd({
    pattern: "ai2",
    alias: ["gpt2", "gemini", "think", "silai", "brainy", "chat2"],
    react: "🤖",
    desc: "Ask AI anything",
    category: "ai",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    
    if (!q || !q.trim()) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚊𝚜𝚔 𝚊 𝚚𝚞𝚎𝚜𝚝𝚒𝚘𝚗\n\n𝙴𝚡𝚖𝚕: .𝚊𝚒 𝚆𝚑𝚊𝚝 𝚒𝚜 𝚙𝚢𝚝𝚑𝚘𝚗?`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }

    // Show typing indicator
    await conn.sendPresenceUpdate('composing', from);

    // Call AI API
    const response = await axios.get(`https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(q.trim())}`);
    
    if (!response.data) {
        throw new Error('No response from API');
    }

    let aiResponse = response.data.response || response.data.result || response.data.data || JSON.stringify(response.data);

    // Truncate if too long
    if (aiResponse.length > 4096) {
        aiResponse = aiResponse.substring(0, 4090) + '...';
    }

    await conn.sendPresenceUpdate('paused', from);

    await conn.sendMessage(from, {
        text: `┏━❑ 𝐀𝐈 𝐆𝐏𝐓 ━━━━━━━━━\n┃ 🤖 𝑨𝒏𝒔𝒘𝒆𝒓:\n┃\n┃ ${aiResponse}\n┗━━━━━━━━━━━━━━━━━━━━`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });

} catch (e) {
    await conn.sendPresenceUpdate('paused', from);
    
    let errorMsg = '❌ 𝙰𝙸 𝚖𝚊𝚕𝚏𝚞𝚗𝚌𝚝𝚒𝚘𝚗𝚒𝚗𝚐';
    
    if (e.response?.status === 429) {
        errorMsg = '❌ 𝚁𝚊𝚝𝚎 𝚕𝚒𝚖𝚒𝚝𝚎𝚍 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛';
    } else if (e.response?.status === 500) {
        errorMsg = '❌ 𝙰𝙸 𝚜𝚎𝚛𝚟𝚎𝚛 𝚎𝚛𝚛𝚘𝚛';
    } else if (e.code === 'ECONNABORTED') {
        errorMsg = '❌ 𝚁𝚎𝚚𝚞𝚎𝚜𝚝 𝚝𝚒𝚖𝚎𝚘𝚞𝚝';
    }

    await conn.sendMessage(from, {
        text: errorMsg,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});


