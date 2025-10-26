const config = require('../config')
const { runtime } = require('../lib/functions');
const {cmd , commands} = require('../command')
cmd({
    pattern: "about",
    alias: "xtre",
    react: "🤖",
    desc: "get owner dec",
    category: "misc",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    const uptime = runtime(process.uptime());
    const startTime = new Date(Date.now() - process.uptime() * 1000);
let about = `╭─ 「 *\`BOT ONLINE\`* 」
│꙳ *ʙᴏᴛ ɴᴀᴍᴇ*乛ᴋᴀᴍʀᴀɴ-ᴍᴅ*sᴛᴀᴛᴜs* ↔ ᴏɴʟɪɴᴇ
│꙳ *ᴀᴜᴛᴏ ʀᴇsᴛᴀʀᴛ* ↔ ᴏɴʟɪɴᴇ
│꙳ *ʙᴏᴛ ʀᴜɴ* ↔ ${uptime}
│꙳ *ᴅᴇᴠɪᴄᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ*
╰────────────────❍
> *乛ᴋᴀᴍʀᴀɴ-ᴍᴅ ꜱᴜᴘᴘᴏʀᴛ +923195068309*`
await conn.sendMessage(from, {
    image: { url: 'https://files.catbox.moe/so68jp.jpg' },
    caption: about,
    contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363418144382782@newsletter', // ou ton JID actuel
            newsletterName: 'KAMRAN-MD',
            serverMessageId: 1251
        }
    }
}, { quoted: mek })

}catch(e){
console.log(e)
reply(`${e}`)
}
})


                    
