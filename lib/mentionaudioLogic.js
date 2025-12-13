const axios = require('axios');

// --- List of Audio URLs ---
const audioUrls = [
    "https://files.catbox.moe/7yifvx.mp3",
    "https://files.catbox.moe/f7hzc0.mp3",
    "https://files.catbox.moe/qnyv2n.mp3",
    "https://files.catbox.moe/4k8jzw.mp3",
    "https://files.catbox.moe/wmrxsq.mp3",
    "https://files.catbox.moe/jj2vt9.mp3",
    "https://files.catbox.moe/y2dqga.mp3",
    "https://files.catbox.moe/ix3okp.mp3",
    "https://files.catbox.moe/2j5xgz.mp3",
    "https://files.catbox.moe/69ssk0.mp3"
];

/**
 * This function processes incoming messages to check for bot mentions.
 * If the bot is tagged (@) in a group chat, it sends a random audio URL as a Voice Note (PTT).
 * * NOTE: This is an EVENT HANDLER (not a CMD). It must be integrated into the bot's 
 * main message processing loop (where you usually handle 'messages-upsert' events).
 */
module.exports = async function mentionAudioLogic(conn, m) {
    // Attempt to get the bot's JID (identifier)
    const botJid = conn.user?.jid || conn.user?.id; 
    
    // 1. Basic Checks: Must be a group, not sent by bot, and must have mentioned JIDs
    if (!m.isGroup || m.key.fromMe || !m.mentionedJid || !botJid) {
        return;
    }

    // 2. Check if the bot was specifically mentioned in the message
    // Compare only the numerical part of the JID for reliability
    const botMentioned = m.mentionedJid.some(jid => 
        jid.includes(botJid.split('@')[0])
    );

    if (botMentioned) {
        // 3. Select a random audio URL
        const randomIndex = Math.floor(Math.random() * audioUrls.length);
        const selectedUrl = audioUrls[randomIndex];

        console.log(`[Mention Handler] Bot mentioned! Sending audio: ${selectedUrl}`);
        
        try {
            // 4. Download the audio buffer
            const audioBuffer = (await axios.get(selectedUrl, { 
                responseType: 'arraybuffer',
                timeout: 15000 
            })).data;

            // 5. Send the audio as a Voice Note (PTT)
            await conn.sendMessage(m.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg', // Use original file type
                ptt: true,             // Send as a Voice Note
                contextInfo: {
                    // Mention the user who tagged the bot in the context
                    mentionedJid: [m.sender] 
                }
            }, { quoted: m });

        } catch (error) {
            console.error(`[Mention Handler] Error sending audio on mention: ${error.message}`);
            // Fail silently if the audio cannot be sent
        }
    }
  }
