const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID, 
    makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents');
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type');
const axios = require('axios')
const { File } = require('megajs')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')
const prefix = config.PREFIX

const ownerNumber = ['923195068309']

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(tempDir, file), err => {
                if (err) throw err;
            });
        }
    });
}
setInterval(clearTempDir, 5 * 60 * 1000);

// =================== MAIN BOT LOGIC ============================

async function connectToWA() {
    console.log("Connecting to WhatsApp ⏳️...");
    
    // Session Auth Logic
    const sessionsPath = path.join(__dirname, 'sessions');
    if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath);

    if (!fs.existsSync(sessionsPath + '/creds.json')) {
        if (config.SESSION_ID && config.SESSION_ID.trim() !== "") {
            const sessdata = config.SESSION_ID.replace("IK~", '');
            try {
                const decodedData = Buffer.from(sessdata, 'base64').toString('utf-8');
                fs.writeFileSync(sessionsPath + '/creds.json', decodedData);
                console.log("✅ Session loaded from SESSION_ID");
            } catch (err) {
                console.error("❌ Error decoding session data:", err);
            }
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionsPath + '/')
    var { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version
    })

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWA();
            }
        } else if (connection === 'open') {
            console.log('🧬 Installing Plugins')
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() == ".js") {
                    require("./plugins/" + plugin);
                }
            });
            console.log('Plugins installed successful ✅')
            console.log('Bot connected to whatsapp ✅')
            
            const myJid = jidNormalizedUser(conn.user.id);
            let up = `*HELLO THERE BAGGA-SHER-MD USER*\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ BAGGA-SHER-MD 🍨`;
            await conn.sendMessage(myJid, { image: { url: `https://files.catbox.moe/sx07qa.jpg` }, caption: up });
        }
    });

    conn.ev.on('creds.update', saveCreds);

    // Anti Call Logic
    conn.ev.on("call", async (json) => {
        if (config.ANTI_CALL === 'true') {
            for (const call of json) {
                if (call.status === 'offer') {
                    await conn.rejectCall(call.id, call.from);
                    await conn.sendMessage(call.from, { text: config.REJECT_MSG || '*📞 Call Rejected*' });
                }
            }
        }
    });

    conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));

    // Message Handling
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0]
        if (!mek.message) return
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

        // Auto Status Seen/React
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([mek.key]);
            if (config.AUTO_STATUS_REACT === "true") {
                const emojis = ['❤️', '🔥', '✨', '💯', '✅'];
                await conn.sendMessage(mek.key.remoteJid, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: mek.key } }, { statusJidList: [mek.key.participant] });
            }
        }

        const m = sms(conn, mek)
        const from = mek.key.remoteJid
        const body = (getContentType(mek.message) === 'conversation') ? mek.message.conversation : (getContentType(mek.message) === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : ''
        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const isOwner = ownerNumber.includes(mek.key.participant?.split('@')[0] || from.split('@')[0])

        // Command Handler
        const events = require('./command')
        const cmd = events.commands.find((c) => c.pattern === command)
        if (cmd) {
            if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
            await cmd.function(conn, mek, m, { from, body, isCmd, command, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) });
        }
    });

    // Helper Functions (decodeJid, sendFile, etc.)
    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };
}

// Express Server
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("BAGGA-SHER-MD IS ALIVE! 🚀"));
app.listen(process.env.PORT || 9090, () => {
    console.log(`Server running on port ${process.env.PORT || 9090}`);
    connectToWA();
});
					
