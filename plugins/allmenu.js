const fs = require('fs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime, formatTime } = require('../lib/functions'); // formatTime assumed to be available
const axios = require('axios');

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
    pattern: "menu",
    desc: "Show interactive menu system with dynamic greeting and uptime.",
    category: "menu",
    react: "⭐",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const totalCommands = Object.keys(commands).length;
        const upTime = runtime(); // Assuming runtime returns milliseconds

        // --- 1. Main Menu Caption (Ultimate Styling) ---
        const menuCaption = `
╭━━━『 *👑 KAMRAN MD BOT 👑* 』━━━╮
┆ 🌟 *${getGreeting()}!* I am ready to serve.
┆ 🟢 *Status:* Online
┆ 
┆ 👨‍💻 Owner: *${config.OWNER_NAME || 'KAMRAN'}*
┆ ⏱️ Uptime: *${formatTime(upTime) || 'Loading...'}*
┆ 🛠️ Prefix: *[${config.PREFIX}]*
┆ 📈 Commands: *${totalCommands}*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╔═.★.════════════════════════════╗
║    『 💎 M E N U   S E L E C T I O N 💎 』
╠══════════════════════════════════╣
║ ◇ 01 ⬇️ *Download Menu*
║ ◇ 02 👨‍👩‍👧‍👦 *Group Menu*
║ ◇ 03 😂 *Fun Menu*
║ ◇ 04 🔑 *Owner Menu*
║ ◇ 05 💡 *AI Menu*
║ ◇ 06 🍥 *Anime Menu*
║ ◇ 07 🔄 *Convert Menu*
║ ◇ 08 ⚙️ *Utility Menu*
║ ◇ 09 🎉 *Reactions Menu*
║ ◇ 10 🏠 *Main Info*
╚═══════════════════════════════════════╝

*Kripya option number (1-10) se reply karein.*
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ`;

        // Context info structure
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true
        };

        // --- 2. Sub Menu Content (Kept Clean) ---
        const subMenuBase = `\n\n> © ${config.DESCRIPTION || 'KAMRAN MD BOT'}`;

        const menuData = {
            '1': {
                title: "⬇️ *Download Menu*",
                content: `╔═════『 DOWNLOADS ⬇️ 』═════╗
│ 🌐 *Social Media*
│ • facebook [url]
│ • mediafire [url]
│ • tiktok [url]
│ • twitter [url]
│ • insta [url]
│ • pinterest [url]
│ 
│ 🎶 *Music/Video*
│ • play [song]
│ • video [name]
│ • ytmp3 [url]
│ • ytmp4 [url]
╚══════════════════════════════╝` + subMenuBase,
                image: true
            },
            '2': {
                title: "👨‍👩‍👧‍👦 *Group Menu*",
                content: `╔════════『 GROUP TOOLS 👨‍👩‍👧‍👦 』════════╗
│ 🛡️ *Admin/Management*
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
            '3': {
                title: "😂 *Fun Menu*",
                content: `╔══════════『 FUN & GAMES 😂 』══════════╗
│ 🤪 *Interactive*
│ • shapar
│ • rate @user
│ • insult @user
│ • hack @user
│ • ship @u1 @u2
│ • joke
│ 
│ 🤣 *Random Reactions*
│ • hrt
│ • hpy
│ • syd
│ • anger
│ • kiss
│ • mon
╚═══════════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '4': {
                title: "🔑 *Owner Menu*",
                content: `╔════════『 OWNER TOOLS 🔑 』════════╗
│ ⚠️ *Restricted Control*
│ • block @user
│ • unblock @user
│ • setpp [img]
│ • restart
│ • shutdown
│ 
│ ℹ️ *Info*
│ • gjid
│ • jid @user
│ • listcmd
│ • allmenu
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '5': {
                title: "💡 *AI Menu*",
                content: `╔══════════『 AI TOOLS 💡 』══════════╗
│ 💬 *Chatbots*
│ • ai [query]
│ • gpt [query]
│ • meta [query]
│ 
│ 🎨 *Image Generation*
│ • imagine [text]
│ • imagine2 [text]
│ 
│ 💻 *Specialized*
│ • blackbox [query]
│ • luma [query]
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '6': {
                title: "🍥 *Anime Menu*",
                content: `╔════════『 ANIME & IMAGES 🍥 』════════╗
│ 🖼️ *Random Images*
│ • waifu
│ • neko
│ • maid
│ • loli
│ • foxgirl
│ 
│ 🎭 *Characters*
│ • animegirl
│ • naruto
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '7': {
                title: "🔄 *Convert Menu*",
                content: `╔════════『 CONVERTERS 🔄 』════════╗
│ 🖼️ *Media*
│ • sticker [img/video]
│ • tomp3 [video]
│ • emojimix [emoji1+emoji2]
│ 
│ 📝 *Text*
│ • fancy [text]
│ • tts [text]
│ • trt [text]
│ • base64 [text]
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '8': {
                title: "⚙️ *Utility Menu*",
                content: `╔════════『 UTILITIES & SEARCH ⚙️ 』════════╗
│ ⏱️ *Time/Math*
│ • timenow
│ • date
│ • calculate [expr]
│ 
│ 🔍 *Search*
│ • define [word]
│ • news [query]
│ • movie [name]
│ • weather [loc]
│ 
│ 🎲 *Random*
│ • flip
│ • coinflip
│ • roll
╚═══════════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '9': {
                title: "🎉 *Reactions Menu*",
                content: `╔════════『 USER REACTIONS 🎉 』════════╗
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
│ 
│ 😊 *Expressions*
│ • blush @user
│ • smile @user
╚═══════════════════════════════════════╝` + subMenuBase,
                image: true
            },
            '10': {
                title: "🏠 *Main Menu/Info*",
                content: `╔════════『 BOT INFO 🏠 』════════╗
│ ℹ️ *Bot Status*
│ • ping
│ • live
│ • alive
│ • runtime
│ • uptime
│ • repo
│ • owner
│ 
│ ⚙️ *Controls*
│ • menu (to reload this menu)
│ • restart
╚═══════════════════════════════════╝` + subMenuBase,
                image: true
            }
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
                    ptt: true, // Send as Voice Note for the 'voice' effect
                    contextInfo: contextInfo
                },
                { quoted: mek }
            );
        } catch (audioError) {
            console.error('Menu Audio send failed:', audioError);
            // Inform user if audio fails (optional, but good for debugging)
            await reply("⚠️ Voice intro audio bhejte samay masla hua."); 
        }

        const messageID = sentMsg.key.id;

        // --- 5. Message Handler for Replies (Interactive Logic) ---
        const handler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

            // Check if it is a direct reply to the menu message
            const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            
            if (isReplyToMenu) {
                const receivedText = receivedMsg.message.conversation?.trim() || 
                                     receivedMsg.message.extendedTextMessage?.text?.trim();
                const senderID = receivedMsg.key.remoteJid;
                
                // Remove listener immediately after receiving a reply
                conn.ev.off("messages.upsert", handler);

                if (menuData[receivedText]) {
                    const selectedMenu = menuData[receivedText];
                    
                    // Send the sub-menu content (with image preference)
                    try {
                        await conn.sendMessage(
                            senderID,
                            {
                                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/so68jp.jpg' },
                                caption: selectedMenu.content,
                                contextInfo: contextInfo
                            },
                            { quoted: receivedMsg }
                        );
                        await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });

                    } catch (e) {
                        // Fallback to text if sending the sub-menu image fails
                        await conn.sendMessage(
                            senderID,
                            { text: selectedMenu.content, contextInfo: contextInfo },
                            { quoted: receivedMsg }
                        );
                        await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
                    }

                } else {
                    // Invalid Option Response
                    await conn.sendMessage(
                        senderID,
                        {
                            text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1-10 to select a menu.\n\n*Example:* Reply with "1" for Download Menu`,
                            contextInfo: contextInfo
                        },
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
        // Send basic error message if the entire process fails
        reply(`⚠️ *Error:* Failed to load the menu system. Please check bot status.`);
    }
});
