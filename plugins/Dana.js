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

cmd({
    pattern: "kamran6",
    desc: "Show interactive menu system with the Final Boxed Aesthetic.",
    category: "menu",
    react: "⭐",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const totalCommands = commands ? Object.keys(commands).length : 0; 
        const upTime = runtime(); 

        // --- 1. Main Header (Mimics Boxed Aesthetic from screenshot) ---
        const headerBlock = `
*${getGreeting()}* KAMRAN MD 🤝

*╔════ 『 🤖 BOT INFO 🤖 』 ════╗*
*║ Owner ➡️ ${config.OWNER_NAME || 'DR KAMRAN'}⭐*
*║ Creator ➡️ GEMPT*
*║ BotName ➡️ KAMRAN MD BOT*
*║ Mode ➡️ PUBLIC*
*║ Runtime ➡️ ${formatTime(upTime) || '00:00:00'}*
*╚═════════════════════════╝*
`;
        
        // --- 2. Selection List (Mimics the clean list from the second screenshot) ---
        const menuList = `
*SILAHKAN PILIH MENU DI BAWAH*

╔════ 『 *LIST MENU* 』 ════╗
║
║ 📥 [1] DOWNLOADER MENU
║ 🛠️ [2] BOT INFO / STATUS
║ 🤝 [3] GROUP MENU
║ 💡 [4] AI MENU
║ 🎨 [5] STICKER & CONVERTER
║ 🎲 [6] FUN MENU
║ ✨ [7] REACTION MENU
║ 📜 [8] LYRICS & SEARCH
║ 🔑 [9] OWNER MENU
║ 🏡 [10] ALL MENU
║
╚═════════════════════════╝
`;
        
        const menuCaption = `${headerBlock}\n${menuList}`;


        // Context info structure
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true
        };
        
        // --- 3. Send Initial Menu (Image/Text) ---
        let sentMsg;
        try {
            // Attempt to send image first
            sentMsg = await conn.sendMessage(
                from,
                {
                    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/so68jp.jpg' },
                    caption: menuCaption,
                    contextInfo: contextInfo
                },
                { quoted: mek }
            );
        } catch (e) {
            console.log('Menu Image send failed, falling back to text:', e);
            // Fallback to text if image fails
            sentMsg = await conn.sendMessage(
                from,
                { text: menuCaption, contextInfo: contextInfo },
                { quoted: mek }
            );
        }
        
        // --- 4. Send the Menu Audio (Voice Note) ---
        try {
            await conn.sendMessage(
                from,
                {
                    audio: { url: MENU_AUDIO_URL },
                    mimetype: 'audio/mp3',
                    ptt: true, // Send as Voice Note
                    contextInfo: contextInfo
                },
                { quoted: mek }
            );
        } catch (audioError) {
            console.error('Menu Audio send failed:', audioError);
        }

        const messageID = sentMsg.key.id;

        // --- 5. Message Handler for Replies (Interactive Logic) ---
        // (NOTE: Sub-menu content remains the same as previous clean version)
        const subMenuBase = `\n\n> © ${config.DESCRIPTION || 'KAMRAN MD BOT'}`;

        const menuData = {
            '1': {
                title: "⬇️ *DOWNLOADER MENU*",
                content: `╔═════『 DOWNLOADS ⬇️ 』═════╗
│ 🌐 *Links*
│ • fb [url]
│ • mediafire [url]
│ • instagram [url]
│ • pinterest [url]
│ 
│ 🎶 *Music/Video*
│ • play3 [song]
│ • drama [name]
│ • ytmp3 [url]
│ • ytmp4 [url]
│ • gdrive [url]
╚══════════════════════════════╝` + subMenuBase,
                image: true
            },
            '2': {
                title: "🛠️ *BOT INFO / STATUS*",
                content: `╔════════『 BOT STATUS 🛠️ 』════════╗
│ 🟢 *Status:* Online
│ ⏱️ *Uptime:* ${formatTime(upTime) || 'Loading...'}
│ 🛠️ *Prefix:* [${config.PREFIX || '!'}]
│ 📈 *Total Cmds:* ${totalCommands}
│ 
│ ℹ️ *Commands*
│ • ping
│ • alive
│ • runtime
│ • owner
╚══════════════════════════════════╝` + subMenuBase,
                image: false 
            },
            '3': {
                title: "🤝 *GROUP MENU*",
                content: `╔════════『 GROUP TOOLS 🤝 』════════╗
│ 🛡️ *Management*
│ • grouplink
│ • kickall
│ • add @user
│ • remove @user
│ • promote @user
│ • demote @user
│ • mute / unmute
│ • lockgc / unlockgc
│ 
│ 📣 *Tagging*
│ • hidetag [msg]
│ • tagall
╚══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '4': {
                title: "💡 *AI MENU*",
                content: `╔══════════『 AI TOOLS 💡 』══════════╗
│ 💬 *Chatbots*
│ • ai [query]
│ • gsearch [query]
│ 
│ 🎨 *Enhancer/Image Gen*
│ • remini [reply-img]
│ • imagine [text]
│ 
│ 💻 *Utility*
│ • blackbox [query]
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '5': {
                title: "🎨 *STICKER & CONVERTER*",
                content: `╔════════『 CONVERTERS 🎨 』════════╗
│ 🖼️ *Media*
│ • sticker [img/video]
│ • tomp3 [video]
│ • emojimix [emoji1+emoji2]
│ 
│ 📝 *Text*
│ • font [text]
│ • tts [text]
│ • trt [text]
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '6': {
                title: "🎲 *FUN MENU*",
                content: `╔════════『 FUN & GAMES 🎲 』════════╗
│ 🎮 *Games/Interactive*
│ • truthdare (2 steps)
│ • shapar
│ • rate @user
│ • ship @u1 @u2
│ • joke
│ 
│ 🤣 *Random*
│ • flip
│ • coinflip
│ • roll
│ • fact
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '7': {
                title: "✨ *REACTION MENU*",
                content: `╔════════『 USER REACTIONS ✨ 』════════╗
│ 🫂 *Affection*
│ • cuddle @user
│ • hug @user
│ • kiss @user
│ • pat @user
│ 
│ 💥 *Action*
│ • bully @user
│ • bonk @user
│ • slap @user
│ • kill @user
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '8': {
                title: "📜 *LYRICS & SEARCH*",
                content: `╔════════『 SEARCH TOOLS 📜 』════════╗
│ 🎵 *Music*
│ • lyrics [song title]
│ • shazam [reply-audio]
│ 
│ 🔍 *General Search*
│ • define [word]
│ • news [query]
│ • movie [name]
│ • weather [loc]
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '9': {
                title: "🔑 *OWNER MENU*",
                content: `╔════════『 OWNER CONTROLS 🔑 』════════╗
│ ⚠️ *Restricted Control*
│ • block @user
│ • unblock @user
│ • setpp [img]
│ • restart
│ • shutdown
│ 
│ ℹ️ *Info*
│ • listcmd
│ • allmenu
│ • eval [code]
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '10': {
                title: "🏡 *ALL MENU*",
                content: "Aapke dwara maange gaye saare commands ki list. Kripya *owner* se `.allmenu` command ke liye request karein." + subMenuBase,
                image: false
            }
        };


        const handler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

            const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            
            if (isReplyToMenu) {
                const receivedText = receivedMsg.message.conversation?.trim() || receivedMsg.message.extendedTextMessage?.text?.trim();
                const senderID = receivedMsg.key.remoteJid;
                
                // Remove listener immediately after receiving a valid reply
                if (menuData[receivedText]) {
                    conn.ev.off("messages.upsert", handler);

                    const selectedMenu = menuData[receivedText];
                    
                    try {
                        // Decide if to send image or just text for sub-menu
                        const contentKey = selectedMenu.image ? 'image' : 'text';
                        const contentValue = selectedMenu.image ? { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/so68jp.jpg' } : {};

                        await conn.sendMessage(
                            senderID,
                            {
                                ...contentValue,
                                caption: selectedMenu.content,
                                text: selectedMenu.content,
                            },
                            { quoted: receivedMsg }
                        );
                        await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });

                    } catch (e) {
                        console.log('Sub-menu send error:', e);
                        await conn.sendMessage(senderID, { text: selectedMenu.content }, { quoted: receivedMsg });
                        await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
                    }
                } else {
                    // Invalid Option Response
                    await conn.sendMessage(
                        senderID,
                        { text: `❌ *Invalid Option!* ❌\nKripya sahi number (1-10) se reply karein.` },
                        { quoted: receivedMsg }
                    );
                    await conn.sendMessage(senderID, { react: { text: '❓', key: receivedMsg.key } });
                }
            }
        };

        // Add listener and set timeout to automatically remove it after 5 minutes
        conn.ev.on("messages.upsert", handler);
        setTimeout(() => conn.ev.off("messages.upsert", handler), 300000);

    } catch (e) {
        console.error('Menu Command General Error:', e);
        reply(`⚠️ *Error:* Failed to load the menu system. Please check bot status.`);
    }
});
