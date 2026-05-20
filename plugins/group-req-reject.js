const config = require('../config')
const { cmd, commands } = require('../command')
const { sleep } = require('../lib/functions')

// LID aur JID fix karne ke liye normalize function
const normalizeId = (id) => {
    if (!id) return '';
    return id
        .split('@')[0]          // Domain hatayen
        .replace(/:[0-9]+/g, '') // Device ID hatayen
        .replace(/[^\d]/g, '');  // Sirf numbers rakhen
};

const COUNTRY_CODES = {
    "afghanistan": "93", "albania": "355", "algeria": "213", "andorra": "376",
    "angola": "244", "argentina": "54", "armenia": "374", "australia": "61",
    "austria": "43", "azerbaijan": "994", "bahrain": "973", "bangladesh": "880", 
    "belarus": "375", "belgium": "32", "pakistan": "92", "india": "91", 
    "saudiarabia": "966", "uae": "971", "uk": "44", "usa": "1"
    // ... baki codes wahi rahen ge
};

cmd({
    pattern: "reject",
    desc: "Reject group join requests by country name or code",
    category: "owner",
    react: "❌",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, reply, isCreator }) => {
    try {
        if (!isCreator) {
            return reply(`❌ *Access Denied!*

This command can only be used by the group *Owner*.
Admins do not have permission. 🔒`)
        }

        if (!isGroup) return reply("⚠️ This command only works in groups.")

        if (!args[0]) return reply(
            "❌ Please provide country name or code.\n\n" +
            "📌 *Examples:*\n" +
            "▸ .reject india\n" +
            "▸ .reject pakistan\n" +
            "▸ .reject 92"
        )

        const input = args[0].toLowerCase().replace(/\s+/g, '')
        let countryCode = ''
        let countryName = ''

        if (/^\d+$/.test(input)) {
            countryCode = input
            countryName = `+${input}`
        } else {
            if (!COUNTRY_CODES[input]) {
                return reply(`❌ Country "*${args[0]}*" not found!`)
            }
            countryCode = COUNTRY_CODES[input]
            countryName = `${args[0].toUpperCase()} (+${countryCode})`
        }

        // Fetch pending requests list
        let pending = await conn.groupRequestParticipantsList(from)
        
        if (!pending || pending.length === 0) {
            return reply("❌ No pending join requests found.")
        }

        // Deep filter for all matching numbers
        let toReject = pending.filter(user => {
            const jid = user.jid || user.id;
            const fullNumber = normalizeId(jid);
            return fullNumber.startsWith(countryCode);
        })

        if (toReject.length === 0) {
            return reply(`❌ No pending requests found from *${countryName}*`)
        }

        await reply(`⏳ Found *${toReject.length}* requests from *${countryName}*. Starting rejection process...`)

        let rejected = 0
        let failed = 0

        for (const user of toReject) {
            try {
                const jid = user.jid || user.id
                await conn.groupRequestParticipantsUpdate(from, [jid], "reject")
                rejected++
                // Fast processing but safe delay
                await sleep(1500) 
            } catch (err) {
                console.log("REJECT ITEM ERROR:", err)
                failed++
                await sleep(2000) // Error par thoda zyada ruken
            }
        }

        return reply(`✅ *Process Completed!*

● *Country:* ${countryName}
● *Total Found:* ${toReject.length}
● *Rejected:* ${rejected}
● *Failed:* ${failed}

${failed > 0 ? "_Note: Kuch requests server issue ki wajah se skip hui hain._" : "_All matching requests cleared._"}`)

    } catch (e) {
        console.log("REJECT ERROR:", e)
        return reply(`❌ *Access Denied!*

This command can only be used by the group *Owner*.
Admins do not have permission. 🔒`)
    }
})
