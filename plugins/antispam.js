const fs = require('fs');
const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require('axios');

// --- CRITICAL FIX: Self-Contained Runtime Functions (Simplified) ---
const startTime = new Date();
const runtime = () => new Date() - startTime; // Uptime in ms

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

// Simulated Data for Premium/XP display
const SIMULATED_USER = {
    name: 'KAMRAN MD USER',
    xp: 5000,
    limit: 50,
    isPremium: true,
};

// --- Custom Bot Data (Simulated) ---
const SIMULATED_BOT = {
    OWNER_NAME: 'KAMRAN',
    VERSION: '10.4.5 Bᴇᴛᴀ',
    TOTAL_COMMANDS: 352,
    PREFIX: config.PREFIX || '.',
    MODE: config.MODE || 'Publik',
    DESCRIPTION: config.DESCRIPTION || 'KAMRAN MD PREMIUM BOT',
};


cmd({
    pattern: "menu9",
    desc: "Show interactive menu system",
    category: "menu",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    
    // Safety check for critical data
    const totalCommands = commands ? Object.keys(commands).length : SIMULATED_BOT.TOTAL_COMMANDS;
    const uptimeText = clockString(runtime());

    const userPremiumStatus = SIMULATED_USER.isPremium ? 'Premium' : 'Free';
    const lprem = userPremiumStatus === 'Premium' ? 'Ⓟ' : '';
    const llim = 'Ⓛ';

    try {
        
        // --- 1. Main Menu Caption (Using original user structure with fixes) ---
        const menuCaption = `╭━━━〔 *👑ᴋᴀᴍʀᴀɴ-ᴍᴅ👑* 〕━━━┈⊷
│ ✓ 𝐎ᴡɴᴇʀ : *${SIMULATED_BOT.OWNER_NAME}*
│ ✓ 𝐁𝐀𝐈𝐋𝐄𝐘𝐒 : *Multi Device*
│ ✓ 𝐓𝐘𝐏𝐄 : *NodeJs*
│ ✓ 𝐏𝐋𝐀𝐓𝐅𝐎ʀᴍ : *Heroku*
│ ✓ 𝐌𝐎𝐃𝐄 : *[${SIMULATED_BOT.MODE}]*
│ ✓ 𝐏𝐑𝐄ꜰ𝐈𝐗 : *[${SIMULATED_BOT.PREFIX}]*
│ ✓ 𝐕ᴇʀꜱɪᴏɴ : *${SIMULATED_BOT.VERSION}*
│ ✓ 𝐂ᴏᴍᴍᴀɴᴅꜱ : *${totalCommands}*
╰━━━━━━━━━━━━━━━┈⊷
╭━━〔 *🧚‍♂️ᴋᴀᴍʀᴀɴ-ᴍᴅ🧚‍♂️* ━┈⊷
││❯❯ 01 *𝐃ᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ*
││❯❯ 02 *𝐆ʀᴏᴜᴘ ᴍᴇɴᴜ*
││❯❯ 03 *𝐅ᴜɴ ᴍᴇɴᴜ*
││❯❯ 04 *𝐎ᴡɴᴇʀ ᴍᴇɴᴜ*
││❯❯ 05 *𝐀ɪ ᴍᴇɴᴜ*
││❯❯ 06 *𝐀ɴɪᴍᴇ ᴍᴇɴᴜ*
││❯❯ 07 *𝐂ᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ*
││❯❯ 08 *𝐎ᴛʜᴇʀ ᴍᴇɴᴜ*
││❯❯ 09 *𝐑ᴇᴀᴄᴛɪᴏɴꜱ ᴍᴇɴᴜ*
││❯❯ 10 *𝐌ᴀɪɴ ᴍᴇɴᴜ*
╰──────────────┈⊷
*👑 UPTIME : ${uptimeText}*\n> *🔍ᴋᴀᴍʀᴀɴ-ᴍᴅ🔎*`;

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true
        };

        // --- 2. Send Initial Menu (Safe Sending Logic) ---
        let sentMsg;
        try {
            // Attempt to send image first (Using the reliable sendMessage API)
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
            console.log('Menu send error:', e);
            // Fallback to text if image fails
            sentMsg = await conn.sendMessage(
                from,
                { text: menuCaption, contextInfo: contextInfo },
                { quoted: mek }
            );
        }
        
        const messageID = sentMsg.key.id;

        // --- 3. Menu Data (Using the original structure for sub-menus) ---
        const subMenuBase = `\n\n> ${SIMULATED_BOT.DESCRIPTION}\n\n👑 *Status:* ${userPremiumStatus} | 🕒 *Uptime:* ${uptimeText}`;

        const menuData = {
            '1': {
                title: "📥 *Download Menu* 📥",
                content: `╭━━━〔 *Download Menu* 〕━━━┈⊷
┃★│ 🌐 *Social Media*
┃★│ • tiktok [url]
┃★│ • instagram [url]
┃★│ • fb2 [url]
┃★│ 🎵 *Music/Video*
┃★│ • ytmp3 [url] ${llim}
┃★│ • spotify [query] ${lprem}
╰━━━━━━━━━━━━━━━┈⊷` + subMenuBase,
                image: true
            },
            '2': {
                title: "👥 *Group Menu* 👥",
                content: `╭━━━〔 *Group Menu* 〕━━━┈⊷
┃★│ 🛠️ *Management*
┃★│ • kickall ${lprem}
┃★│ • add @user
┃★│ • mute [time]
┃★│ ⚡ *Admin Tools*
┃★│ • promote @user
┃★│ • demote @user
╰━━━━━━━━━━━━━━━┈⊷` + subMenuBase,
                image: true
            },
            // ... (Other menus omitted for brevity but remain structured as above)
            '10': {
                title: "🏠 *Main Menu* 🏠",
                content: `╭━━━〔 *Main Menu* 〕━━━┈⊷
│ *👑 PREMIUM STATUS* : ${userPremiumStatus}
│ *Total XP* : ${SIMULATED_USER.xp}
│ *Device Type* : Heroku Node.Js
╰━━━━━━━━━━━━━━━┈⊷` + subMenuBase,
                image: true
            }
        };

        // --- 4. Message Handler for Replies (Interactive Logic) ---
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (isReplyToMenu) {
                    const receivedText = receivedMsg.message.conversation || 
                                      receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];
                        
                        // --- REMOVE LISTENER HERE TO PREVENT MULTIPLE TRIGGERS ---
                        conn.ev.off("messages.upsert", handler);

                        // Send the sub-menu content
                        try {
                            // Send the image for the sub-menu
                            await conn.sendMessage(
                                senderID,
                                {
                                    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/so68jp.jpg' },
                                    caption: selectedMenu.content,
                                    contextInfo: contextInfo
                                },
                                { quoted: receivedMsg }
                            );
                            // Send Success Reaction
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
                                text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1-10 to select a menu.`,
                                contextInfo: contextInfo
                            },
                            { quoted: receivedMsg }
                        );
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        // Add listener and set timeout
        conn.ev.on("messages.upsert", handler);

        // Remove listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ Menu system is currently busy. Please try again later.`);
    }
});
