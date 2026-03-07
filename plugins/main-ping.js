const config = require('../config');
const { cmd } = require('../command');

const botNameStyles = [
    "𝙱𝙰𝙶𝙶𝙰-𝚂𝙷𝙴𝙸𝙺𝙷-𝙼𝙳",
    "𝗕𝗔𝗚𝗚𝗔-𝗦𝗛𝗘𝗜𝗞𝗛-𝗠𝗗",
    "𝔹𝔸𝔾𝔾𝔸-𝕊ℍ𝔼𝕀𝕂ℍ-𝕄𝔻",
    "𝑩𝑨𝑮𝑮𝑨-𝑺𝑯𝑬𝑰𝑲𝑯-𝑴𝑫",
    "🄱🄰🄿🄶🄰-🅂🄷🄴🄸🄺🄷-🄼🄳",
    "🅱️🅰️🅶🅶🅰️-🆂🅷🅴🅸🅺🅷-🅼🅳",
    "乃卂ᎶᎶ卂-丂卄乇丨Ҝ卄-爪ᗪ",
    "ＢＡＧＧＡ-ＳＨＥＩＫＨ-ＭＤ",
    "🅑🅐🅖🅖🅐-🅢🅗🅔🅘🅚🅗-🅜🅓",
    "𝓑𝓐𝓖𝓖𝓐-𝓢𝓗𝓔𝓘𝓚𝓗-𝓜𝓓"
];

let currentStyleIndex = 0;

// Fancy Ping Command
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
    
    // Ensure reaction and text emojis are different
    if (textEmoji === reactionEmoji) {
        textEmoji = textEmojis[(Math.floor(Math.random() * textEmojis.length) + 1) % textEmojis.length];
    }

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
                newsletterName: "𝙱𝙰𝙶𝙶𝙰-𝚂𝙷𝙴𝙸𝙺𝙷-𝙼𝙳 𝚉𝙾𝙽𝙴",
                serverMessageId: 143
            }
        } 
    }, { quoted: mek });
});

// Simple Ping Command
cmd({
    pattern: "ping2",
    react: "🍂",
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const start = Date.now();
    const msg = await conn.sendMessage(from, { text: '*🚀 PINGING...*' });
    const ping = Date.now() - start;
    await conn.sendMessage(from, { text: `*BAGGA-SHEIKH-MD SPEED: ${ping}ms*` }, { quoted: msg });
});
    
