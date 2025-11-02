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

 *🖊️  𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ _~➙ https://chat.whatsapp.com/DpQBd7WqmP89jQnyUzJcL9?mode=wwt*

*👀  𝒦𝒜𝑀𝑅𝒜𝒩-𝑀𝒟 𝛅ʊ̊℘ᯭ℘ᯭ๏፝֟ɼ̚†ː͢⤹ ~_➙ https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O_~*

*⚘━━━━━━━╶╶╶╶━━━━━━━⚘*
`
return reply(`${status}`)

}catch(e){
console.log(e)
reply(`${e}`)

}
})
