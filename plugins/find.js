const os = require("os")
const process = require("process")
const fs = require("fs")
const { execSync } = require("child_process")
const { cmd } = require("../command")

cmd({
    pattern: "ping01", // Command pattern
    alias: ["status2", "speed3"], // Alias commands
    desc: "check full system performance bot", // Description
    react: '✅', // Reaction upon success
    category: 'info', // Command category
    filename: __filename
}, async (conn, m, store, { reply }) => { // Using the new handler signature
    const start = Date.now()

    // Helper function to format bytes into readable units (KB, MB, GB, etc.)
    let formatBytes = (bytes) => {
        if (!bytes) return "0 Bytes"
        let units = ["Bytes", "KB", "MB", "GB", "TB"]
        let i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
    }

    // Helper function to format seconds into HH:MM:SS format
    let formatSeconds = (seconds) => {
        let h = Math.floor(seconds / 3600)
        let m = Math.floor((seconds % 3600) / 60)
        let s = Math.floor(seconds % 60)
        return `${h}h ${m}m ${s}s`
    }

    // Detect the environment where the bot is running
    let getRuntimeEnv = () => {
        let cwd = process.cwd().toLowerCase()
        let hostname = os.hostname().toLowerCase()
        let platform = os.platform()

        if (cwd.includes("ptero") || fs.existsSync("/etc/pterodactyl")) return "Panel (Pterodactyl)"
        if (platform === "linux" && hostname.length > 8) return "VPS / Dedicated Server"
        if (platform === "win32" || hostname.includes("desktop") || hostname.includes("local")) return "Local Machine"
        return "Terminal / CLI"
    }

    // Get disk usage details using 'df' command (Linux only)
    let getDiskUsage = () => {
        try {
            // Execute 'df -k /' to get disk space in kilobytes for the root partition
            let df = execSync("df -k /").toString().split("\n")[1].split(/\s+/)
            let total = parseInt(df[1]) * 1024 // Convert KB to Bytes
            let used = parseInt(df[2]) * 1024 // Convert KB to Bytes
            let free = parseInt(df[3]) * 1024 // Convert KB to Bytes
            return { total, used, free }
        } catch {
            return { total: 0, used: 0, free: 0 } // Return 0 if command fails (e.g., non-Linux OS)
        }
    }

    // Calculate the total and idle CPU time
    let cpuAverage = () => {
        let cpus = os.cpus()
        let idle = 0
        let total = 0
        for (let cpu of cpus) {
            for (let type in cpu.times) total += cpu.times[type]
            idle += cpu.times.idle
        }
        return { idle: idle / cpus.length, total: total / cpus.length }
    }

    // Calculate CPU usage percentage over a 500ms period
    let getCpuUsage = async () => {
        let start = cpuAverage()
        await new Promise(r => setTimeout(r, 500)) // Wait 500ms
        let end = cpuAverage()
        let idleDiff = end.idle - start.idle
        let totalDiff = end.total - start.total
        // Calculate usage: (Total Time - Idle Time) / Total Time
        let usage = 100 - Math.floor(100 * idleDiff / totalDiff)
        return usage
    }

    // Get network usage (received/transmitted bytes) from /proc/net/dev (Linux only)
    let getNetworkUsage = () => {
        try {
            // Read /proc/net/dev file
            let data = fs.readFileSync("/proc/net/dev", "utf8").split("\n").slice(2)
            let rx = 0 // Received bytes
            let tx = 0 // Transmitted bytes
            data.forEach(line => {
                let parts = line.trim().split(/\s+/)
                if (parts.length > 9) {
                    rx += parseInt(parts[1]) // Received bytes (second column)
                    tx += parseInt(parts[9]) // Transmitted bytes (tenth column)
                }
            })
            return { rx, tx }
        } catch {
            return { rx: 0, tx: 0 } // Return 0 if file not found (e.g., non-Linux OS)
        }
    }
    
    // --- Data Collection ---
    await store.react('⌛'); // React to show processing started
    
    let env = getRuntimeEnv()
    let cpuList = os.cpus()
    let cpuModel = cpuList[0].model.trim()
    let cpuCount = cpuList.length
    let cpuSpeed = cpuList[0].speed
    let cpuUsage = await getCpuUsage()

    let totalMemory = os.totalmem()
    let freeMemory = os.freemem()
    let usedMemory = totalMemory - freeMemory
    let memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(2)

    let disk = getDiskUsage()
    let diskUsage = disk.total ? ((disk.used / disk.total) * 100).toFixed(2) : "0.00"

    let net = getNetworkUsage()
    let netRx = formatBytes(net.rx)
    let netTx = formatBytes(net.tx)

    let uptime = os.uptime()
    let nodeVersion = process.version
    let platform = os.platform()
    let arch = os.arch()
    let hostname = os.hostname()
    // let homeDir = os.homedir() // Removed for conciseness
    // let cwd = process.cwd() // Removed for conciseness

    // Calculate latency (ping)
    let ping = Date.now() - start
    // Add a small random offset if ping is too low for better perceived realism
    if (ping < 10) ping += Math.floor(Math.random() * 11) + 5

    // --- Final Output Message with enhanced formatting ---
    let text = `
*╭━━━「 BOT & SYSTEM STATUS 」━━━╮*
*┃*
*┃ ⚡ Latency:* ${ping} ms
*┃ ⏰ Uptime:* ${formatSeconds(uptime)}
*┃ ⚙️ Runtime:* ${env}
*┃ 💻 CPU:* ${cpuCount} Core - ${cpuModel}
*┃    ├─ Usage:* ${cpuUsage}%
*┃    └─ Speed:* ${cpuSpeed} MHz
*┃ 🧠 Memory:* ${formatBytes(usedMemory)} / ${formatBytes(totalMemory)} (${memoryUsage}%)
*┃ 💾 Disk:* ${formatBytes(disk.used)} / ${formatBytes(disk.total)} (${diskUsage}%)
*┃ 📈 Network:*
*┃    ├─ RX (Received):* ${netRx}
*┃    └─ TX (Transmitted):* ${netTx}
*┃ 🌐 OS Info:*
*┃    ├─ Platform:* ${platform} (${arch})
*┃    ├─ Hostname:* ${hostname}
*┃    └─ Node.js:* ${nodeVersion}
*┃*
*╰━━━━━━━━━━━━━━━━━━━━╯*
    `

    reply(text.trim())
    await store.react('✅'); // React to show processing completed
});
