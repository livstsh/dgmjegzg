const fs = require('fs');
const config = require('../config');
const { cmd, commands } = require('../command'); 
const axios = require('axios');

// --- CRITICAL FIX: Self-Contained Runtime Functions ---
const startTime = new Date();
const runtime = () => new Date() - startTime; 

const formatTime = (ms) => {
    let seconds = Math.floor(ms / 1000);
    const d = Math.floor(seconds / (3600 * 24));
    seconds -= d * 3600 * 24;
    const h = Math.floor(seconds / 3600);
    seconds -= h * 3600;
    const m = Math.floor(seconds / 60);
    seconds -= m * 60;
    const s = Math.floor(seconds);

    let final = '';
    if (d > 0) final += `${d}d `;
    if (h > 0) final += `${h}h `;
    if (m > 0) final += `${m}m `;
    if (s > 0 && d === 0 && h === 0) final += `${s}s`;
    if (final === '') return '0s';
    return final.trim();
};

// --- Audio URL for the Menu Voice Intro ---
const MENU_AUDIO_URL = 'https://files.catbox.moe/ufq5ub.mp3';

// Function to get time-based greeting
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️ Good Morning";
    if (hour < 17) return "🌤️ Good Afternoon";
    if (hour < 20) return "夕方 Good Evening";
    return "🌙 Good Night";
};


// --- Command Data (Simplified for Final List) ---
// Note: In a real bot, you would iterate over the 'commands' object to generate this list dynamically.
// Here we use static groups for the requested aesthetic.
const commandGroups = {
    "DOWNLOADS ⬇️": [
        "playvideo [title]", "playaudio [title]", "fb [url]", "drama [title]", "remini [reply-img]", "gsearch [query]", "lyrics [title]",
    ],
    "OWNER/ADMIN 🔑": [
        "vip", "nice", "vv", "eval", "logout", "ban", "unban", "listban", "setsudo", "kickall", "promote", "demote"
    ],
    "UTILITIES ⚙️": [
        "note [text]", "note list", "font [text]", "truthdare", "ping", "runtime", "alive", "repo"
    ],
    "AI/FUN 💡": [
        "ai [query]", "imagine [text]", "hidetag [msg]", "tagall", "ship @u1 @u2", "rate @user", "joke"
    ]
};

// Function to format two columns for the command list
function formatDualColumnList() {
    let output = '';
    const groupKeys = Object.keys(commandGroups);

    groupKeys.forEach((groupName, groupIndex) => {
        const commands = commandGroups[groupName];
        const half = Math.ceil(commands.length / 2);
        
        output += `╔═══════『 ${groupName} 』═══════╗\n`;
        
        for (let i = 0; i < half; i++) {
            const leftCmd = `• ${commands[i]}`.padEnd(25);
            const rightCmd = commands[i + half] ? `• ${commands[i + half]}` : '';
            output += `║ ${leftCmd} ${rightCmd}\n`;
        }
        
        output += `╚═══════════════════════════╝\n`;
    });
    
    return output.trim();
}


cmd({
    pattern: "kamran6",
    desc: "Show full command list in a clear dual-column format.",
    category: "menu",
    react: "⭐",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const totalCommands = commands ? Object.keys(commands).length : 0; 
        const upTime = runtime(); 

        // --- 1. Main Header ---
        const headerCaption = `
╭━━━『 *👑 KAMRAN MD BOT 👑* 』━━━╮
┆ 🌟 *${getGreeting()}!* I am ready to serve.
┆ 
┆ 👨‍💻 Owner: *${config.OWNER_NAME || 'KAMRAN'}*
┆ ⏱️ Uptime: *${formatTime(upTime) || 'Loading...'}*
┆ 🛠️ Prefix: *[${config.PREFIX || '!'}]*
┆ 📈 Commands: *${totalCommands}*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n`;

        // --- 2. Generate Command List ---
        const commandList = formatDualColumnList();

        // --- 3. Final Full Caption ---
        const menuCaption = `${headerCaption}\n${commandList}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;


        // --- 4. Send Initial Menu (Image/Text) ---
        let sentMsg;
        try {
            // Attempt to send image first
            sentMsg = await conn.sendMessage(
                from,
                {
                    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/so68jp.jpg' },
                    caption: menuCaption,
                },
                { quoted: mek }
            );
        } catch (e) {
            console.log('Menu Image send failed, falling back to text:', e);
            // Fallback to text if image fails
            sentMsg = await conn.sendMessage(
                from,
                { text: menuCaption },
                { quoted: mek }
            );
        }
        
        // --- 5. Send the Menu Audio (Voice Note) ---
        try {
            await conn.sendMessage(
                from,
                {
                    audio: { url: MENU_AUDIO_URL },
                    mimetype: 'audio/mp3',
                    ptt: true, // Send as Voice Note
                },
                { quoted: mek }
            );
        } catch (audioError) {
            console.error('Menu Audio send failed:', audioError);
        }

        // Final success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('Menu Command General Error:', e);
        // Send basic error message if the entire process fails
        reply(`⚠️ *Error:* Failed to load the menu system. Please check bot status.`);
    }
});
