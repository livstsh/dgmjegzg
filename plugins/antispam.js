const { cmd } = require("../command");
const config = require('../config');

// --- SIMULATED DATA ---
// NOTE: Assuming there's a global function or database access to check premium status.
// Here, we simulate a premium check.
const isUserPremium = (sender) => {
    // In a real bot, you would check a database here. 
    // Simulating true for demonstration.
    return true; 
};
const OWNER_NAME = config.OWNER_NAME || "DR KAMRAN";


cmd({
    pattern: "ping7",
    alias: ["speed7", "pong7", "ping8"],
    desc: "Bot ki pratikriya samay (ping) ko check karta hai aur premium status dikhata hai.", // Checks bot response time and shows premium status.
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
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
│ ${reactEmoji} *KAMRAN MD PING*
└───────────────┘
╔═════════════════════╗
║ 🟢 *Status:* ${speedText}
║ ⚡ *Latency:* ${ping} ms
║ 👑 *User Type:* ${premiumStatus}
╚═════════════════════╝

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
