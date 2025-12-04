const { cmd } = require("../command");
const config = require('../config');

// --- SIMULATED DATA ---
const isUserPremium = (sender) => {
    // Simulating true for demonstration.
    return true; 
};
const OWNER_NAME = config.OWNER_NAME || "DR KAMRAN";


cmd({
    pattern: "ping7",
    alias: ["speed6", "pong3", "ping2"],
    desc: "Bot ki pratikriya samay (ping) ko check karta hai aur premium status dikhata hai.", // Checks bot response time and shows premium status.
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, usedPrefix }) => {
    try {
        // 1. Initial State and Premium Check
        const premiumStatus = isUserPremium(sender) ? '👑 PREMIUM' : '👤 FREE USER';
        const reactEmoji = premiumStatus === '👑 PREMIUM' ? '🔥' : '⚡';
        
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // 2. Latency Measurement (Measuring the time it takes to send a message and receive confirmation)
        const startTime = Date.now();
        const message = await conn.sendMessage(from, { text: `*PINGING...*` }, { quoted: mek });
        const endTime = Date.now();
        
        const ping = endTime - startTime; // This is the network latency to send/receive a single message.

        // 3. Status and Indicator
        let speedText;
        if (ping < 100) {
            speedText = '🚀 Excellent Speed';
        } else if (ping < 300) {
            speedText = '👍 Good Speed';
        } else {
            speedText = '🐌 Average Speed';
        }

        // 4. Final Boxed Output (Mimicking the Button aesthetic)
        const finalMessage = `
┌───────────────┐
│ ${reactEmoji} *KAMRAN MD PING REPORT*
└───────────────┘
╔═════════════════════╗
║ 🟢 *Status:* ${speedText}
║ ⚡ *Latency:* ${ping} ms
║ 👑 *User Type:* ${premiumStatus}
╚═════════════════════╝

*आगे बढ़ने के लिए बटन टाइप करें:*

┌───────────────┐
│ ⚡ TYPE *${usedPrefix}PING* (Re-check)
└───────────────┘
┌───────────────┐
│ 🏠 TYPE *${usedPrefix}MENU* (Main Menu)
└───────────────┘

*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${OWNER_NAME}*
`;

        // Send the final result, quoting the initial 'PINGING...' message
        await conn.sendMessage(from, { 
            text: finalMessage,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: message });

        // Final success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`❌ Ping karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
