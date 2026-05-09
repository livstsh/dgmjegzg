const config = require('../config');
const { cmd } = require('../command');

const botNameStyles = [
    "𝘓𝘜𝘊𝘒𝘠-𝘔𝘋",
    "𝙇𝙐𝘾𝙆𝙔-𝙈𝘿",
    "𝕃𝕌ℂ𝕂𝕐-𝕄𝔻",
    "🄻🅄🄲🄺🅈-🄼🄳",
    "𝕃𝕌ℂ𝕂𝕐-𝕄𝔻",
    "𝑳𝑼𝑪𝑲𝒀-𝑴𝑫",
    "ⓁⓊⒸⓀⓎ-ⓂⒹ",
    "𝐋𝐔𝐂𝐊𝐘-𝐌𝐃",
    "ＬＵＣＫＹ-ＭＤ",
    "𝓛𝓤𝓒𝓚𝓨-𝓜𝓓"
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
                newsletterJid: '120363421272153826@newsletter',
                newsletterName: "𝐋𝐔𝐂𝐊𝐘-𝐌𝐃",
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
    await conn.sendMessage(from, { text: `*𝐋𝐔𝐂𝐊𝐘-𝐌𝐃 SPEED: ${ping}ms*` }, { quoted: msg });
});
