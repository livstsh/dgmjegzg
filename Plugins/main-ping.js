const config = require('../config');
const { cmd } = require('../command');

const botNameStyles = [
    "𝐋𝐔𝐂𝐊𝐘-𝐌𝐃",
    "✯ʟᴜᴄᴋʏᴍᴅ",
    "🅛🅤🅒🅚🅨-🅼🅳",
    "-🄻🅄🄲🄺🅈🄼🄳",
    "ⓛⓤⓒⓚⓨ-ⓜⓓ",
    "•𝐥𝐮𝐜𝐤𝑦 𝐦𝒅",
    "ⓛⓤⓒⓚⓨ-ⓜⓓ",
    "𝕝𝕦𝕔𝕜𝕪-𝕞𝕕",
    "𝗹𝘂𝘤𝗸𝗒-𝘮𝖽",
    "𝑙𝐮𝐜𝑘𝐲-𝐦𝐝"
];

let currentStyleIndex = 0;

cmd({
    pattern: "ping",
    alias: ["speed","pong"],
    react: "🌡️",
    filename: __filename
}, async (conn, mek, m, { from, sender }) => {
    const start = Date.now();

    const reactionEmojis = ['🔥','⚡','🚀','💨','🎯','🎉','🌟','💥','🕐','🔹'];
    const textEmojis = ['💎','🏆','⚡️','🚀','🎶','🌠','🌀','🔱','🛡️','✨'];

    let reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    if (textEmoji === reactionEmoji) textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    await conn.sendMessage(from, { react: { text: textEmoji, key: mek.key } });

    const responseTime = Date.now() - start;
    const fancyBotName = botNameStyles[currentStyleIndex];
    currentStyleIndex = (currentStyleIndex + 1) % botNameStyles.length;

    await conn.sendMessage(from, { 
        text: `> *${fancyBotName} SPEED: ${responseTime}ms ${reactionEmoji}*`,
        contextInfo: { 
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: "LUCKY-MD",
                serverMessageId: 143
            }
        } 
    }, { quoted: mek });
});

cmd({
    pattern: "ping2",
    react: "🍂",
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const start = Date.now();
    const msg = await conn.sendMessage(from, { text: '*PINGING...*' });
    const ping = Date.now() - start;
    await conn.sendMessage(from, { text: `*LUCKY-MD SPEED: ${ping}ms*` }, { quoted: msg });
});
