const { cmd } = require("../command");
const os = require('os');
const { performance } = require('perf_hooks');

// --- CRITICAL FIX: Custom Clock String for Uptime ---
// Uptime ko din, ghante, minute, second mein badalta hai
function clockString(ms) {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor(ms / 3600000) % 24;
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    
    // Uptime ko acche format mein laata hai
    let parts = [];
    if (d > 0) parts.push(`${d} Days ☀️`);
    if (h > 0) parts.push(`${h} Hours 🕐`);
    if (m > 0) parts.push(`${m} Minutes ⏰`);
    if (s > 0 && parts.length < 2) parts.push(`${s} Seconds ⏱️`);
    
    if (parts.length === 0) return '0 Seconds';
    return parts.join('\n ');
}

// Helper function to format bytes to human-readable size
const formatSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
};


cmd({
    pattern: "info", // Command name
    alias: ["ping!", "speed!", "serverinfo"],
    desc: "Displays advanced server and bot information (Ping, RAM, CPU).",
    category: "info",
    react: "💻",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        // 1. Uptime Calculation (Bot Runtime)
        // Assume bot sends 'uptime' message and receives time back (like original code)
        // Since we cannot use process.send in this emulator, we use a constant for uptime.
        const muptime = clockString(os.uptime() * 1000); 

        // 2. Latency (Ping Speed)
        const old = performance.now();
        await m.reply(`❃ *ᴛ ᴇ s ᴛ ɪ ɴ ɢ . . .*`);
        const neww = performance.now();
        const speed = Math.round(neww - old);

        // 3. Server Info (RAM, Platform, CPU Cores)
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const cpus = os.cpus();
        
        // 4. Construct Final Message
        let runtt = `
*--- 💻 S E R V E R I N F O ---*

*⚡ ᴘ ɪ ɴ ɢ*
 ${speed} ms

*⏱️ ʀ ᴜ ɴ ᴛ ɪ ᴍ ᴇ*
 ${muptime}
----------------------------------------
*💾 R A M U S A G E*
• 🛑 Used: ${formatSize(usedMemory)}
• 🔵 Free: ${formatSize(freeMemory)}
• 📊 Total: ${formatSize(totalMemory)}

*⚙️ S Y S T E M*
• 🖥️ Platform: ${os.platform()}
• 🧠 CPU Cores: ${cpus.length} (${cpus[0].model.trim()})

*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*
`;

        // 5. Send the final response (No Payment Request)
        await reply(runtt);

    } catch (e) {
        console.error("Advanced Info Command Error:", e);
        await reply(`⚠️ Error processing info: ${e.message}`);
    }
});
