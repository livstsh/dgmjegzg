const config = require('../config')
const {cmd , commands} = require('../command')
const os = require("os")
const {runtime} = require('../lib/functions')
cmd({
    pattern: "link",
    alias: ["status","botinfo"],
    desc: "check up time , ram usage and more",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumner, botNumner2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let status = `
☣️ *ᴋᴀᴍʀᴀɴ-ᴍᴅ ꜱᴜᴘᴘᴏʀᴛ LINKS* ☣️


*⚘━━━━━━━╶╶╶╶━━━━━━━⚘*

 *🖊️  𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ _~➙ https://chat.whatsapp.com/Gy5FKDF7iNjDCEsYF9di7P?mode=wwt~_*

*👀  𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ ~_➙ https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O_~*

*👻  𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ ~_➙ https://chat.whatsapp.com/CqahmGbL0I18HB7nT9IqSO?mode=wwt_~*

*👽  𝗝ᴀᴡᴀᴅ𝐓ᴇᴄʜ 𝐒ᴜᴘᴘᴏʀᴛ 🇵🇸 ➙ ~_https://chat.whatsapp.com/J0ILxrBp8Pj48XBkYtSDQj?mode=wwt*

*🎠 𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ ➙ _~https://chat.whatsapp.com/CftWz95txXu0kvrr3zuknL?mode=wwt~_*

> *ᴘᴏᴡᴇʀᴅ ʙʏ   𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ : )*

*⚘━━━━━━━╶╶╶╶━━━━━━━⚘*
`
return reply(`${status}`)

}catch(e){
console.log(e)
reply(`${e}`)

}
})
