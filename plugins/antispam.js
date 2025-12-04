const { cmd } = require('../command');
const os = require('os');
const { performance } = require('perf_hooks');
const { exec } = require('child_process');
const { promisify } = require('util');

// --- CRITICAL FIX: Self-Contained Utility Functions ---

// 1. Format Bytes
const format = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 2. Format Uptime (ClockString)
function clockString(ms) {
    if (isNaN(ms) || ms < 0) return "N/A";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms / 3600000) % 24;
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;

    const parts = [];
    if (d > 0) parts.push(`${d} Days`);
    if (h > 0) parts.push(`${h} Hours`);
    if (m > 0) parts.push(`${m} Minutes`);
    if (s > 0 && parts.length < 2) parts.push(`${s} Seconds`);

    return parts.join(', ');
}

// 3. Simple Progress Bar
const progressBar = (percentage, length = 15) => {
    const filledLength = Math.round(length * (percentage / 100));
    const emptyLength = length - filledLength;
    const filled = "█".repeat(filledLength);
    const empty = "░".repeat(emptyLength);
    return `${filled}${empty} ${percentage.toFixed(1)}%`;
};

// 4. Design Elements (Simplified)
const designElements = {
  header: "╭────────────────────────────────────╮",
  footer: "╰────────────────────────────────────╯",
  diamond: "♦",
  star: "★",
  good: "🟢",
  bullet: "•",
};

const execAsync = promisify(exec);


// --- MAIN COMMAND HANDLER ---
const handler = async (conn, mek, m, { reply, from }) => {
  
  const loadingMsg = await conn.reply(
    m.chat,
    `${designElements.star} *SYSTEM MONITOR LOADING* ${designElements.star}\nPlease wait...`
  );

  const startTime = performance.now();

  try {
    // --- 1. CORE BOT INFO & PING ---
    const responseTime = Math.round(performance.now() - startTime);
    const uptimeSec = os.uptime();
    const muptime = clockString(uptimeSec * 1000); 

    const chats = Object.entries(conn.chats || {}).filter(([id, data]) => id && data.isChats);
    const groupsIn = chats.filter(([id]) => id.endsWith("@g.us"));
    const privateChats = chats.length - groupsIn.length;
    
    // --- 2. CPU USAGE (Calculated based on times) ---
    // NOTE: This only works if the bot has been running long enough to compare usage.
    const cpus = os.cpus();
    const cpuModel = cpus[0].model.trim();
    
    // Simple estimation of load average (which Node.js provides directly)
    const loadAvg = os.loadavg(); 
    
    // --- 3. MEMORY USAGE ---
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memPercentage = (usedMemory / totalMemory) * 100;
    
    // --- 4. NODEJS USAGE ---
    const usedMemoryProcess = process.memoryUsage();
    const memoryUsageFormatted = Object.keys(usedMemoryProcess)
      .map((key) => {
        return `${key.padEnd(12, " ")}: ${format(usedMemoryProcess[key])}`;
      })
      .join("\n");


    // --- 5. TIME AND DATE (Simplified) ---
    const date = new Date();
    const timeString = date.toLocaleTimeString("en-US");
    const dateString = date.toLocaleDateString("en-US");


    // --- 6. CONSTRUCT FINAL MESSAGE ---
    const responseMsg = `
${designElements.header}
${designElements.star} *SYSTEM MONITOR DASHBOARD* ${designElements.star}
${designElements.footer}

${designElements.diamond} *PERFORMANCE*
${designElements.good} *Response Time:* ${responseTime}ms
${designElements.good} *Uptime:* ${muptime}

${designElements.diamond} *CHAT STATISTICS*
${designElements.bullet} *Groups:* ${groupsIn.length}
${designElements.bullet} *Private:* ${privateChats}
${designElements.bullet} *Total:* ${chats.length}

${designElements.header}

${designElements.diamond} *SYSTEM RESOURCES*

${designElements.good} *RAM Usage (Host):*
${progressBar(memPercentage)}
*Used:* ${format(usedMemory)} | *Free:* ${format(freeMemory)} | *Total:* ${format(totalMemory)}

${designElements.good} *CPU Info:*
*Model:* ${cpuModel}
*Load Avg:* ${loadAvg.map(n => n.toFixed(2)).join(' | ')}
*Cores:* ${cpus.length}

${designElements.header}

${designElements.diamond} *SYSTEM INFORMATION*
${designElements.bullet} *Platform:* ${os.platform()}
${designElements.bullet} *Hostname:* ${os.hostname()}
${designElements.bullet} *OS Release:* ${os.release()}
${designElements.bullet} *Time:* ${dateString} ${timeString}

${designElements.diamond} *NODEJS MEMORY USAGE*
\`\`\`
${memoryUsageFormatted}
\`\`\`

${designElements.header}
${designElements.star} *SYSTEM MONITOR COMPLETE* ${designElements.star}
${designElements.footer}
`;

    // Remove loading message and send final response
    await conn.sendMessage(m.chat, { delete: loadingMsg.key });
    return conn.reply(m.chat, responseMsg, m);
    
  } catch (error) {
    console.error("System Monitor Handler Error:", error);
    // Attempt to delete loading message if still exists
    try { await conn.sendMessage(m.chat, { delete: loadingMsg.key }); } catch {} 
    return conn.reply(m.chat, `❌ *Monitor Failed:* ${error.message}. Kripya dobara prayas karein.`);
  }
};

// --- Command Wrapper ---
cmd({
    pattern: "sysinfo2",
    alias: ["ping8", "speed7", "info6", "monitor", "status4"],
    desc: "Displays advanced server information (Ping, RAM, CPU).",
    category: "info",
    react: "💻",
    filename: __filename
}, handler);

module.exports = handler;
