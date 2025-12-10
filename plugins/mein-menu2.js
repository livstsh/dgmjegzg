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
    react: "ðŸ¤–",
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
        let dec = `â€Ž*â•­â”€â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹ââ”‹. Ê™á´á´› É´á´€á´á´‡: ${config.BOT_NAME}*
â€Ž*â”‹ââ”‹. á´ á´‡Ê€êœ±Éªá´É´: 5.0.0*
â€Ž*â”‹ââ”‹. Ê€á´œÉ´á´›Éªá´á´‡: ${runtime(process.uptime())}*
â€Ž*â”‹ââ”‹. á´…á´‡á´  : á´‹á´€á´Ê€á´€É´-á´á´…* â€Ž*â”‹ââ”‹. á´˜ÊŸá´€á´›Ò“á´Ê€á´: ${os.platform()}*
â€Ž*â”‹ââ”‹. á´á´á´…á´‡: ${config.MODE}*
â€Ž*â”‹ââ”‹. á´˜Ê€á´‡Ò“Éªx: [${config.PREFIX}]*
â€Ž*â”‹ââ•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*
â€Ž
â€Ž*â•­â”€â ð™³ð™¾ðš†ð™½ð™»ð™¾ð™°ð™³ â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. á´›Éªá´‹á´›á´á´‹*
â€Ž*â”‹â€â”ƒ. Ò“á´€á´„á´‡Ê™á´á´á´‹*
â€Ž*â”‹â€â”ƒ. á´€á´˜á´‹*
â€Ž*â”‹â€â”ƒ. ÉªÉ´sá´›á´€*
â€Ž*â”‹â€â”ƒ. á´›á´¡Éªá´›á´›á´‡Ê€*
â€Ž*â”‹â€â”ƒ. á´˜ÊŸá´€Ê*
â€Ž*â”‹â€â”ƒ. á´˜ÊŸá´€Ê2*
â€Ž*â”‹â€â”ƒ. á´˜ÊŸá´€Ê3*
â€Ž*â”‹â€â”ƒ. á´˜ÊŸá´€Ê4*
â€Ž*â”‹â€â”ƒ. á´˜ÊŸá´€Ê5*
â€Ž*â”‹â€â”ƒ. á´˜ÉªÉ´á´›á´‡Ê€á´‡sá´›*
â€Ž*â”‹â€â”ƒ. sá´˜á´á´›ÉªÒ“Ê*
â€Ž*â”‹â€â”ƒ. á´€á´œá´…Éªá´*
â€Ž*â”‹â€â”ƒ. á´ Éªá´…á´‡á´*
â€Ž*â”‹â€â”ƒ. á´ Éªá´…á´‡á´2*
â€Ž*â”‹â€â”ƒ. Êá´›á´á´˜4*
â€Ž*â”‹â€â”ƒ. á´á´‡á´…Éªá´€Ò“ÉªÊ€á´‡*
â€Ž*â”‹â€â”ƒ. É¢á´…Ê€Éªá´ á´‡*
â€Ž*â”‹â€â”ƒ. á´›Éªá´‹s*
â€Ž*â”‹â€â”ƒ. ssá´¡á´‡Ê™*
â€Ž*â”‹â€â”ƒ. á´…Ê€á´€á´á´€*
â€Ž*â”‹â€â”ƒ. á´‹á´€á´Ê€á´€É´*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*
â€Ž
â€Ž*â•­â”€â ð™»ð™¾ð™¶ð™¾ ð™¼ð™°ð™ºð™´ð™´ðš â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. á´…Ê€á´€É¢á´É´Ê™á´€ÊŸÊŸ*
â€Ž*â”‹â€â”ƒ. Ê™ÊŸá´€á´„á´‹á´˜ÉªÉ´á´‹*
â€Ž*â”‹â€â”ƒ. É´á´‡á´É´ÊŸÉªÉ¢Êœá´›*
â€Ž*â”‹â€â”ƒ. sá´€á´…É¢ÉªÊ€ÊŸ*
â€Ž*â”‹â€â”ƒ. É´á´€Ê€á´œá´›á´*
â€Ž*â”‹â€â”ƒ. 3á´…á´„á´á´Éªá´„*
â€Ž*â”‹â€â”ƒ. 3á´…á´˜á´€á´˜á´‡Ê€*
â€Ž*â”‹â€â”ƒ. Ò“á´œá´›á´œÊ€Éªsá´›Éªá´„*
â€Ž*â”‹â€â”ƒ. á´„ÊŸá´á´œá´…s*
â€Ž*â”‹â€â”ƒ. ÊŸá´‡á´€Ò“*
â€Ž*â”‹â€â”ƒ. á´‡Ê€á´€sá´‡Ê€*
â€Ž*â”‹â€â”ƒ. sá´œÉ´sá´‡á´›*
â€Ž*â”‹â€â”ƒ. É¢á´€ÊŸá´€xÊ*
â€Ž*â”‹â€â”ƒ. sá´€É´s*
â€Ž*â”‹â€â”ƒ. Ê™á´á´á´*
â€Ž*â”‹â€â”ƒ. Êœá´€á´„á´‹á´‡Ê€*
â€Ž*â”‹â€â”ƒ. á´…á´‡á´ ÉªÊŸá´¡ÉªÉ´É¢s*
â€Ž*â”‹â€â”ƒ. É´ÉªÉ¢á´‡Ê€Éªá´€*
â€Ž*â”‹â€â”ƒ. Ê™á´œÊŸÊ™*
â€Ž*â”‹â€â”ƒ. á´€É´É¢á´‡ÊŸá´¡ÉªÉ´É¢s*
â€Ž*â”‹â€â”ƒ. á´¢á´á´…Éªá´€á´„*
â€Ž*â”‹â€â”ƒ. ÊŸá´œxá´œÊ€Ê*
â€Ž*â”‹â€â”ƒ. á´˜á´€ÉªÉ´á´›*
â€Ž*â”‹â€â”ƒ. Ò“Ê€á´á´¢á´‡É´*
â€Ž*â”‹â€â”ƒ. á´„á´€sá´›ÊŸá´‡*
â€Ž*â”‹â€â”ƒ. á´›á´€á´›á´á´*
â€Ž*â”‹â€â”ƒ. á´ á´€ÊŸá´Ê€á´€É´á´›*
â€Ž*â”‹â€â”ƒ. Ê™á´‡á´€Ê€*
â€Ž*â”‹â€â”ƒ. á´›Êá´˜á´É¢Ê€á´€á´˜ÊœÊ*
â€Ž*â”‹â€â”ƒ. Ê™ÉªÊ€á´›Êœá´…á´€Ê*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*

â€Ž*â•­â”€â ð™¼ð™°ð™¸ð™½ â•â•â•â•â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. á´á´‡É´á´œ*
â€Ž*â”‹â€â”ƒ. á´á´¡É´á´‡Ê€*
â€Ž*â”‹â€â”ƒ. ÊŸÉªsá´›á´„á´á´…*
â€Ž*â”‹â€â”ƒ. Ê€á´‡á´˜á´*
â€Ž*â”‹â€â”ƒ. Ê™ÊŸá´á´„á´‹*
â€Ž*â”‹â€â”ƒ. á´œÉ´Ê™ÊŸá´á´„á´‹*
â€Ž*â”‹â€â”ƒ. Ê€á´‡sá´›á´€Ê€á´›*
â€Ž*â”‹â€â”ƒ. Ò“á´œÊŸÊŸá´˜á´˜*
â€Ž*â”‹â€â”ƒ. sá´‡á´›á´˜á´˜*
â€Ž*â”‹â€â”ƒ. á´€ÊŸÉªá´ á´‡*
â€Ž*â”‹â€â”ƒ. á´œá´˜á´…á´€á´›á´‡á´„á´á´…*
â€Ž*â”‹â€â”ƒ. sÊœá´œá´›á´…á´á´¡É´*
â€Ž*â”‹â€â”ƒ. á´ŠÉªá´…*
â€Ž*â”‹â€â”ƒ. á´˜ÉªÉ´É¢* â€Ž*â”‹â€â”ƒ. É¢á´ŠÉªá´…*
â€Ž*â”‹â€â”ƒ. sá´‡á´›á´˜á´˜*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*
â€Ž
â€Ž*â•­â”€â ð™¾ðšƒð™·ð™´ðš â•â•â•â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. á´€ÊŸÉªá´ á´‡*
â€Ž*â”‹â€â”ƒ. ÊŸÉªá´ á´‡*
â€Ž*â”‹â€â”ƒ. sá´˜á´‡á´‡á´…*
â€Ž*â”‹â€â”ƒ. Ê€á´‡á´˜á´*
â€Ž*â”‹â€â”ƒ. á´œá´˜á´›Éªá´á´‡*
â€Ž*â”‹â€â”ƒ. Ê€á´œÉ´á´›Éªá´á´‡*
â€Ž*â”‹â€â”ƒ. á´›Éªá´á´‡É´á´á´¡*
â€Ž*â”‹â€â”ƒ. á´„á´€ÊŸá´„á´œÊŸá´€á´›á´‡*
â€Ž*â”‹â€â”ƒ. á´„á´á´œÉ´á´›*
â€Ž*â”‹â€â”ƒ. á´…á´€á´›á´‡*
â€Ž*â”‹â€â”ƒ. á´„á´˜á´˜*
â€Ž*â”‹â€â”ƒ. Ò“á´€á´„á´›*
â€Ž*â”‹â€â”ƒ. á´¡á´‡á´€á´›Êœá´‡Ê€*
â€Ž*â”‹â€â”ƒ. Ò“á´€É´á´„Ê*
â€Ž*â”‹â€â”ƒ. á´…á´‡Ò“ÉªÉ´á´‡*
â€Ž*â”‹â€â”ƒ. É´á´‡á´¡s*
â€Ž*â”‹â€â”ƒ. sÊ€á´‡á´˜á´*
â€Ž*â”‹â€â”ƒ. É¢Éªá´›Êœá´œÊ™sá´›á´€ÊŸá´‹*
â€Ž*â”‹â€â”ƒ. á´¡Éªá´‹Éªá´˜á´‡á´…Éªá´€*
â€Ž*â”‹â€â”ƒ. sá´€á´ á´‡*
â€Ž*â”‹â€â”ƒ. á´„á´ÉªÉ´Ò“ÊŸÉªá´˜*
â€Ž*â”‹â€â”ƒ. Ê€á´„á´ÊŸá´Ê€*
â€Ž*â”‹â€â”ƒ. Ê€á´ÊŸÊŸ*
â€Ž*â”‹â€â”ƒ. ÊŸá´É¢á´*
â€Ž*â”‹â€â”ƒ. Ê€á´¡*
â€Ž*â”‹â€â”ƒ. á´˜á´€ÉªÊ€*
â€Ž*â”‹â€â”ƒ. á´á´á´ Éªá´‡*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*
â€Ž
â€Ž*â•­â”€â ð™²ð™¾ð™½ðš…ð™´ðšðšƒð™´ðš â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. sá´›Éªá´„á´‹á´‡Ê€*
â€Ž*â”‹â€â”ƒ. á´›á´€á´‹á´‡*
â€Ž*â”‹â€â”ƒ. á´‡á´á´á´ŠÉªá´Éªx*
â€Ž*â”‹â€â”ƒ. á´›á´›s*
â€Ž*â”‹â€â”ƒ. á´›á´á´á´˜3*
â€Ž*â”‹â€â”ƒ. á´›Ê€á´›*
â€Ž*â”‹â€â”ƒ. Ê™á´€sá´‡64*
â€Ž*â”‹â€â”ƒ. á´œÉ´Ê™á´€sá´‡64*
â€Ž*â”‹â€â”ƒ. á´…Ê™ÉªÉ´á´€Ê€Ê*
â€Ž*â”‹â€â”ƒ. á´›ÉªÉ´Êá´œÊ€ÊŸ*
â€Ž*â”‹â€â”ƒ. á´œÊ€ÊŸ*
â€Ž*â”‹â€â”ƒ. á´œÊ€ÊŸá´‡É´á´„á´á´…á´‡*
â€Ž*â”‹â€â”ƒ. á´œÊ€ÊŸá´…á´‡á´„á´á´…á´‡*
â€Ž*â”‹â€â”ƒ. Ê€á´‡á´€á´…á´á´Ê€á´‡*
â€Ž*â”‹â€â”ƒ. Ê€á´‡á´˜á´‡á´€á´›*
â€Ž*â”‹â€â”ƒ. á´€sá´‹*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*
â€Ž
â€Ž*â•­â”€â ð™°ð™½ð™¸ð™¼ð™´ â•â•â•â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. Ò“á´xÉ¢ÉªÊ€ÊŸ*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡É´á´‡á´¡s*
â€Ž*â”‹â€â”ƒ. É´á´€Ê€á´œá´›á´*
â€Ž*â”‹â€â”ƒ. á´…á´€Ê€á´‡*
â€Ž*â”‹â€â”ƒ. Ò“á´€á´„á´‹*
â€Ž*â”‹â€â”ƒ. á´›Ê€á´œá´›Êœ*
â€Ž*â”‹â€â”ƒ. É¢á´€Ê€ÊŸ*
â€Ž*â”‹â€â”ƒ. á´€á´¡á´á´*
â€Ž*â”‹â€â”ƒ. á´…á´É¢*
â€Ž*â”‹â€â”ƒ. É´á´‡á´‹á´*
â€Ž*â”‹â€â”ƒ. á´¡á´€ÉªÒ“á´œ*
â€Ž*â”‹â€â”ƒ. ÊŸá´ÊŸÉª*
â€Ž*â”‹â€â”ƒ. á´á´€Éªá´…*
â€Ž*â”‹â€â”ƒ. á´á´‡É¢É´á´œá´ÉªÉ´*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡É¢ÉªÊ€ÊŸ*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡É¢ÉªÊ€ÊŸ1*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡É¢ÉªÊ€ÊŸ2*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡1*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡2*
â€Ž*â”‹â€â”ƒ. á´€É´Éªá´á´‡3*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*
â€Ž
â€Ž*â•­â”€â ð™°ð™¸ â•â•â•â•â•â•â•â•â•â•â•âŠ·â*
â€Ž*â”‹â€â”ƒ. ð™°ð™¸*
â€Ž*â”‹â€â”ƒ. ÊŸá´œá´á´€*
â€Ž*â”‹â€â”ƒ. Éªá´á´€É¢ÉªÉ´á´‡*
â€Ž*â”‹â€â”ƒ. Éªá´á´€É¢ÉªÉ´á´‡2*
â€Ž*â”‹â€â”ƒ. É¢á´˜á´›4*
â€Ž*â”‹â€â”ƒ. á´„á´á´˜ÉªÊŸá´á´›*
â€Ž*â”‹â€â”ƒ. Ê™ÉªÉ´É¢*
â€Ž*â”‹â€â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*
â€Ž*â•°â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•âŸ*`;

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
        reply(`âŒ Error during menu display: ${e}`);
    }
});
