const { cmd } = require("../command");

cmd({
    pattern: "kamran6",
    alias: ["speed", "latency"],
    desc: "Checks the bot's response time.",
    category: "utility",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        const start = new Date().getTime();
        await reply("⚡ Testing speed..."); 
        const end = new Date().getTime();
        
        const latency = end - start;
        
        const responseMessage = `
⚡ *PONG!*
        
*Response Time (Latency):* ${latency} ms
*Status:* Excellent! 🚀
        
_Powered by KAMRAN-MD_`;

        await reply(responseMessage);
    } catch (e) {
        console.error("Ping command error:", e);
        await reply("⚠️ Failed to check ping.");
    }
});
