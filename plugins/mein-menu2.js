const config = require('../config')
const { cmd, commands } = require('../command');
const os = require("os")
const {runtime} = require('../lib/functions')
const axios = require('axios')

// --- TTS Helper Functions (Required for Voice Note Generation) ---

/** Converts Base64 string to ArrayBuffer. Required for audio processing. */
function base64ToArrayBuffer(base64) {
    const binaryString = Buffer.from(base64, 'base64');
    return binaryString.buffer.slice(binaryString.byteOffset, binaryString.byteOffset + binaryString.length);
}

/** Converts raw PCM audio data (from TTS API) to a WAV Buffer. */
function pcmToWav(pcmData, sampleRate) {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit PCM

    const buffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(buffer);
    let offset = 0;

    // RIFF identifier 'RIFF'
    writeString(view, offset, 'RIFF'); offset += 4;
    // file length
    view.setUint32(offset, 36 + pcmData.byteLength, true); offset += 4;
    // RIFF type 'WAVE'
    writeString(view, offset, 'WAVE'); offset += 4;
    // format chunk identifier 'fmt '
    writeString(view, offset, 'fmt '); offset += 4;
    // format chunk length
    view.setUint32(offset, 16, true); offset += 4;
    // sample format (1 = PCM)
    view.setUint16(offset, 1, true); offset += 2;
    // number of channels
    view.setUint16(offset, numChannels, true); offset += 2;
    // sample rate
    view.setUint32(offset, sampleRate, true); offset += 4;
    // byte rate
    view.setUint32(offset, sampleRate * numChannels * bytesPerSample, true); offset += 4;
    // block align
    view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2;
    // bits per sample
    view.setUint16(offset, bytesPerSample * 8, true); offset += 2;
    // data chunk identifier 'data'
    writeString(view, offset, 'data'); offset += 4;
    // data chunk length
    view.setUint32(offset, pcmData.byteLength, true); offset += 4;

    // Write PCM data
    const pcmView = new Int16Array(pcmData);
    for (let i = 0; i < pcmView.length; i++) {
        view.setInt16(offset, pcmView[i], true);
        offset += 2;
    }

    return Buffer.from(buffer); // Return as Node.js Buffer
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
// --- End TTS Helper Functions ---


cmd({
    pattern: "menu",
    alias: ["allmenu2","fullmenu"],
    use: '.menu',
    desc: "Show all bot commands",
    category: "menu",
    react: "🤖",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        // Use the configured prefix for the button IDs
        const usedPrefix = config.PREFIX || '.'; 

        // 1. --- Send Interactive List Button Menu (User's exact request) ---
        // We ensure we are using a robust structure for interactive messages.
        const listMessage = {
            text: `jarr amja`,
            footer: "baten",
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Click',
                        sections: [
                            {
                                title: 'Title 1',
                                highlight_label: 'Highlight label 1',
                                rows: [
                                    { title: "Semua Menu", id: `${usedPrefix}menu all` },
                                    { title: "Menu Owner", id: `${usedPrefix}menu owner` }
                                ]
                            }
                        ]
                    })
                }
            ],
        };
        
        // Use conn.sendMessage (sock.sendMessage equivalent) to send the list message
        await conn.sendMessage(from, listMessage, { quoted: mek });
        
        // 2. --- Full Menu Text with Image ---
        let dec = `‎*╭─══════════════⊷❍*
‎*┋❁┋. ʙᴏᴛ ɴᴀᴍᴇ: ${config.BOT_NAME}*
‎*┋❁┋. ᴠᴇʀꜱɪᴏɴ: 5.0.0*
‎*┋❁┋. ʀᴜɴᴛɪᴍᴇ: ${runtime(process.uptime())}*
‎*┋❁┋. ᴅᴇᴠ : ᴋᴀᴍʀᴀɴ-ᴍᴅ* ‎*┋❁┋. ᴘʟᴀᴛғᴏʀᴍ: ${os.platform()}*
‎*┋❁┋. ᴍᴏᴅᴇ: ${config.MODE}*
‎*┋❁┋. ᴘʀᴇғɪx: [${config.PREFIX}]*
‎*┋❁╰───────────────*
‎*╰═════════════════⍟*
‎
‎*╭─❍ 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 ══════⊷❍*
‎*┋❀┃. ᴛɪᴋᴛᴏᴋ*
‎*┋❀┃. ғᴀᴄᴇʙᴏᴏᴋ*
‎*┋❀┃. ᴀᴘᴋ*
‎*┋❀┃. ɪɴsᴛᴀ*
‎*┋❀┃. ᴛᴡɪᴛᴛᴇʀ*
‎*┋❀┃. ᴘʟᴀʏ*
‎*┋❀┃. ᴘʟᴀʏ2*
‎*┋❀┃. ᴘʟᴀʏ3*
‎*┋❀┃. ᴘʟᴀʏ4*
‎*┋❀┃. ᴘʟᴀʏ5*
‎*┋❀┃. ᴘɪɴᴛᴇʀᴇsᴛ*
‎*┋❀┃. sᴘᴏᴛɪғʏ*
‎*┋❀┃. ᴀᴜᴅɪᴏ*
‎*┋❀┃. ᴠɪᴅᴇᴏ*
‎*┋❀┃. ᴠɪᴅᴇᴏ2*
‎*┋❀┃. ʏᴛᴍᴘ4*
‎*┋❀┃. ᴍᴇᴅɪᴀғɪʀᴇ*
‎*┋❀┃. ɢᴅʀɪᴠᴇ*
‎*┋❀┃. ᴛɪᴋs*
‎*┋❀┃. ssᴡᴇʙ*
‎*┋❀┃. ᴅʀᴀᴍᴀ*
‎*┋❀┃. ᴋᴀᴍʀᴀɴ*
‎*┋❀╰────────────────*
‎*╰══════════════════⍟*
‎
‎*╭─❍ 𝙻𝙾𝙶𝙾 𝙼𝙰𝙺𝙴𝙴𝚁 ══════⊷❍*
‎*┋❀┃. ᴅʀᴀɢᴏɴʙᴀʟʟ*
‎*┋❀┃. ʙʟᴀᴄᴋᴘɪɴᴋ*
‎*┋❀┃. ɴᴇᴏɴʟɪɢʜᴛ*
‎*┋❀┃. sᴀᴅɢɪʀʟ*
‎*┋❀┃. ɴᴀʀᴜᴛᴏ*
‎*┋❀┃. 3ᴅᴄᴏᴍɪᴄ*
‎*┋❀┃. 3ᴅᴘᴀᴘᴇʀ*
‎*┋❀┃. ғᴜᴛᴜʀɪsᴛɪᴄ*
‎*┋❀┃. ᴄʟᴏᴜᴅs*
‎*┋❀┃. ʟᴇᴀғ*
‎*┋❀┃. ᴇʀᴀsᴇʀ*
‎*┋❀┃. sᴜɴsᴇᴛ*
‎*┋❀┃. ɢᴀʟᴀxʏ*
‎*┋❀┃. sᴀɴs*
‎*┋❀┃. ʙᴏᴏᴍ*
‎*┋❀┃. ʜᴀᴄᴋᴇʀ*
‎*┋❀┃. ᴅᴇᴠɪʟᴡɪɴɢs*
‎*┋❀┃. ɴɪɢᴇʀɪᴀ*
‎*┋❀┃. ʙᴜʟʙ*
‎*┋❀┃. ᴀɴɢᴇʟᴡɪɴɢs*
‎*┋❀┃. ᴢᴏᴅɪᴀᴄ*
‎*┋❀┃. ʟᴜxᴜʀʏ*
‎*┋❀┃. ᴘᴀɪɴᴛ*
‎*┋❀┃. ғʀᴏᴢᴇɴ*
‎*┋❀┃. ᴄᴀsᴛʟᴇ*
‎*┋❀┃. ᴛᴀᴛᴏᴏ*
‎*┋❀┃. ᴠᴀʟᴏʀᴀɴᴛ*
‎*┋❀┃. ʙᴇᴀʀ*
‎*┋❀┃. ᴛʏᴘᴏɢʀᴀᴘʜʏ*
‎*┋❀┃. ʙɪʀᴛʜᴅᴀʏ*
‎*┋❀╰────────────────*
‎*╰══════════════════⍟*

‎*╭─❍ 𝙼𝙰𝙸𝙽 ══════════⊷❍*
‎*┋❀┃. ᴍᴇɴᴜ*
‎*┋❀┃. ᴏᴡɴᴇʀ*
‎*┋❀┃. ʟɪsᴛᴄᴍᴅ*
‎*┋❀┃. ʀᴇᴘᴏ*
‎*┋❀┃. ʙʟᴏᴄᴋ*
‎*┋❀┃. ᴜɴʙʟᴏᴄᴋ*
‎*┋❀┃. ʀᴇsᴛᴀʀᴛ*
‎*┋❀┃. ғᴜʟʟᴘᴘ*
‎*┋❀┃. sᴇᴛᴘᴘ*
‎*┋❀┃. ᴀʟɪᴠᴇ*
‎*┋❀┃. ᴜᴘᴅᴀᴛᴇᴄᴍᴅ*
‎*┋❀┃. sʜᴜᴛᴅᴏᴡɴ*
‎*┋❀┃. ᴊɪᴅ*
‎*┋❀┃. ᴘɪɴɢ* ‎*┋❀┃. ɢᴊɪᴅ*
‎*┋❀┃. sᴇᴛᴘᴘ*
‎*┋❀╰───────────────*
‎*╰═════════════════⍟*
‎
‎*╭─❍ 𝙾𝚃𝙷𝙴𝚁 ═════════⊷❍*
‎*┋❀┃. ᴀʟɪᴠᴇ*
‎*┋❀┃. ʟɪᴠᴇ*
‎*┋❀┃. sᴘᴇᴇᴅ*
‎*┋❀┃. ʀᴇᴘᴏ*
‎*┋❀┃. ᴜᴘᴛɪᴍᴇ*
‎*┋❀┃. ʀᴜɴᴛɪᴍᴇ*
‎*┋❀┃. ᴛɪᴍᴇɴᴏᴡ*
‎*┋❀┃. ᴄᴀʟᴄᴜʟᴀᴛᴇ*
‎*┋❀┃. ᴄᴏᴜɴᴛ*
‎*┋❀┃. ᴅᴀᴛᴇ*
‎*┋❀┃. ᴄᴘᴘ*
‎*┋❀┃. ғᴀᴄᴛ*
‎*┋❀┃. ᴡᴇᴀᴛʜᴇʀ*
‎*┋❀┃. ғᴀɴᴄʏ*
‎*┋❀┃. ᴅᴇғɪɴᴇ*
‎*┋❀┃. ɴᴇᴡs*
‎*┋❀┃. sʀᴇᴘᴏ*
‎*┋❀┃. ɢɪᴛʜᴜʙsᴛᴀʟᴋ*
‎*┋❀┃. ᴡɪᴋɪᴘᴇᴅɪᴀ*
‎*┋❀┃. sᴀᴠᴇ*
‎*┋❀┃. ᴄᴏɪɴғʟɪᴘ*
‎*┋❀┃. ʀᴄᴏʟᴏʀ*
‎*┋❀┃. ʀᴏʟʟ*
‎*┋❀┃. ʟᴏɢᴏ*
‎*┋❀┃. ʀᴡ*
‎*┋❀┃. ᴘᴀɪʀ*
‎*┋❀┃. ᴍᴏᴠɪᴇ*
‎*┋❀╰────────────────*
‎*╰══════════════════⍟*
‎
‎*╭─❍ 𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙴𝚁 ══════⊷❍*
‎*┋❀┃. sᴛɪᴄᴋᴇʀ*
‎*┋❀┃. ᴛᴀᴋᴇ*
‎*┋❀┃. ᴇᴍᴏᴊɪᴍɪx*
‎*┋❀┃. ᴛᴛs*
‎*┋❀┃. ᴛᴏᴍᴘ3*
‎*┋❀┃. ᴛʀᴛ*
‎*┋❀┃. ʙᴀsᴇ64*
‎*┋❀┃. ᴜɴʙᴀsᴇ64*
‎*┋❀┃. ᴅʙɪɴᴀʀʏ*
‎*┋❀┃. ᴛɪɴʏᴜʀʟ*
‎*┋❀┃. ᴜʀʟ*
‎*┋❀┃. ᴜʀʟᴇɴᴄᴏᴅᴇ*
‎*┋❀┃. ᴜʀʟᴅᴇᴄᴏᴅᴇ*
‎*┋❀┃. ʀᴇᴀᴅᴍᴏʀᴇ*
‎*┋❀┃. ʀᴇᴘᴇᴀᴛ*
‎*┋❀┃. ᴀsᴋ*
‎*┋❀╰────────────────*
‎*╰══════════════════⍟*
‎
‎*╭─❍ 𝙰𝙽𝙸𝙼𝙴 ═════════⊷❍*
‎*┋❀┃. ғᴏxɢɪʀʟ*
‎*┋❀┃. ᴀɴɪᴍᴇɴᴇᴡs*
‎*┋❀┃. ɴᴀʀᴜᴛᴏ*
‎*┋❀┃. ᴅᴀʀᴇ*
‎*┋❀┃. ғᴀᴄᴋ*
‎*┋❀┃. ᴛʀᴜᴛʜ*
‎*┋❀┃. ɢᴀʀʟ*
‎*┋❀┃. ᴀᴡᴏᴏ*
‎*┋❀┃. ᴅᴏɢ*
‎*┋❀┃. ɴᴇᴋᴏ*
‎*┋❀┃. ᴡᴀɪғᴜ*
‎*┋❀┃. ʟᴏʟɪ*
‎*┋❀┃. ᴍᴀɪᴅ*
‎*┋❀┃. ᴍᴇɢɴᴜᴍɪɴ*
‎*┋❀┃. ᴀɴɪᴍᴇɢɪʀʟ*
‎*┋❀┃. ᴀɴɪᴍᴇɢɪʀʟ1*
‎*┋❀┃. ᴀɴɪᴍᴇɢɪʀʟ2*
‎*┋❀┃. ᴀɴɪᴍᴇ1*
‎*┋❀┃. ᴀɴɪᴍᴇ2*
‎*┋❀┃. ᴀɴɪᴍᴇ3*
‎*┋❀╰───────────────*
‎*╰═════════════════⍟*
‎
‎*╭─❍ 𝙰𝙸 ═══════════⊷❍*
‎*┋❀┃. 𝙰𝙸*
‎*┋❀┃. ʟᴜᴍᴀ*
‎*┋❀┃. ɪᴍᴀɢɪɴᴇ*
‎*┋❀┃. ɪᴍᴀɢɪɴᴇ2*
‎*┋❀┃. ɢᴘᴛ4*
‎*┋❀┃. ᴄᴏᴘɪʟᴏᴛ*
‎*┋❀┃. ʙɪɴɢ*
‎*┋❀╰───────────────*
‎*╰═════════════════⍟*`;

        // 2. --- Full Menu Text with Image ---
        await conn.sendMessage(
            from,
            {
                // Using the neon-themed placeholder image
                image: { url: 'https://placehold.co/600x400/101010/8A2BE2/png?text=KAMRAN+BOT+MENU+%E2%9C%A8' },
                caption: dec,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: config.BOT_NAME,
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

        // 3. --- TTS Voice Note Generation ---
        const userPrompt = "Say cheerfully: Welcome to Kamran MD Bot. Your menu details are displayed above. Use the prefix to activate commands.";
        const apiKey = ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: { 
                        prebuiltVoiceConfig: { voiceName: "Puck" } 
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.[0];
            const audioData = part?.inlineData?.data;
            const mimeType = part?.inlineData?.mimeType;

            if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
                const rateMatch = mimeType.match(/rate=(\d+)/);
                const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
                
                const pcmData = base64ToArrayBuffer(audioData);
                const wavBuffer = pcmToWav(pcmData, sampleRate);

                await conn.sendMessage(from, {
                    audio: wavBuffer,
                    mimetype: 'audio/wav',
                    ptt: true
                }, { quoted: mek });
                
            } else {
                console.log("TTS Error: Could not generate or retrieve audio data from API.", result);
            }
        } catch (ttsError) {
            console.error("TTS API Call Failed:", ttsError);
        }
        // --- END TTS GENERATION BLOCK ---
        
    } catch (e) {
        console.log(e);
        reply(`❌ Error during menu display: ${e}`);
    }
});
                
