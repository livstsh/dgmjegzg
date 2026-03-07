const config = require('../config');
const { cmd } = require('../command');

const botNameStyles = [
    "𝙱𝙰𝙶𝙶𝙰-𝚂𝙷𝙴𝚁-𝙼𝙳",
    "𝗕𝗔𝗚𝗚𝗔-𝗦𝗛𝗘𝗥-𝗠𝗗",
    "𝔹𝔸𝔾𝔾𝔸-𝕊ℍ𝔼ℝ-𝕄𝔻",
    "𝑩𝑨𝑮𝑮𝑨-𝑺𝑯𝑬𝑹-𝑴𝑫",
    "🄱🄰🄶🄶🄰-🅂🄷🄴🅁-🄼🄳",
    "🅱️🅰️🅶🅶🅰️-🆂🅷🅴🆁-🅼🅳",
    "乃卂ᎶᎶ卂-丂卄乇尺-爪ᗪ",
    "ＢＡＧＧＡ-ＳＨＥＲ-ＭＤ",
    "🅑🅐🅖🅖🅐-🅢🅗🅔🅡-🅜🅓",
    "𝓑𝓐𝓖𝓖𝓐-𝓢𝓗𝓔𝓡-𝓜𝓓"
];

let currentStyleIndex = 0;

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, sender }) => {
    const start = Date.now();

    const reactionEmojis = ['🔥', '⚡', '🚀', '🎯', '🌟', '💥', '🌀', '🔱', '🛡️', '✨'];
    const textEmojis = ['💎', '🏆', '💫', '🌌', '🌠', '🔋', '📡', '🕹️', '🧩', '💠'];

    let reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    
    if (textEmoji === reactionEmoji) {
        textEmoji = textEmojis[(Math.floor(Math.random() * textEmojis.length) + 1) % textEmojis.length];
    }

    await conn.sendMessage(from, { react: { text: reactionEmoji, key: mek.key } });

    const responseTime = Date.now() - start;
    const fancyBotName = botNameStyles[currentStyleIndex];
    currentStyleIndex = (currentStyleIndex + 1) % botNameStyles.length;

    await conn.sendMessage(from, { 
        text: `> *${fancyBotName} SPEED: ${responseTime}ms ⚡*`,
        contextInfo: { 
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: "BAGGA-SHER-MD OFFICIAL",
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
    await conn.sendMessage(from, { text: `*BAGGA-SHER-MD SPEED: ${ping}ms*` }, { quoted: msg });
});
            
