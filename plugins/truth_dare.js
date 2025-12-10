const {
    cmd
} = require('../command');

cmd({
    pattern: "fancytext",
    alias: ["style", "stylish"],
    desc: "Diye gaye text ko alag-alag stylish fonts mein badalta hai.",
    category: "fun",
    react: "🖋️",
    filename: __filename
},
async (conn, mek, m, {
    from,
    q,
    reply
}) => {
    
    // Custom function to send message
    const sendMessage = async (text, options = {}) => {
        await conn.sendMessage(from, { text: text, ...options }, { quoted: mek });
    };

    if (!q) {
        return sendMessage("❌ Kripya woh text dein jisko aap stylish banana chahte hain. Jaise: *.fancytext Hello World*");
    }

    // --- Character Mapping (Limited set for demonstration) ---
    // Unicode characters ka istemaal karke fonts change karna
    const styles = [
        { name: "Serif Bold", map: "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭" },
        { name: "Monospace", map: "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉" },
        { name: "Cursive Bold", map: "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩" },
        { name: "Double Struck", map: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ" },
        { name: "Bubble Text", map: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ" },
        { name: "Small Caps", map: "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ" }
    ];

    const standardChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const transformText = (text, targetMap) => {
        let transformed = "";
        for (const char of text) {
            const index = standardChars.indexOf(char);
            if (index !== -1) {
                transformed += targetMap[index];
            } else {
                transformed += char; // Symbols and numbers wahi rahenge
            }
        }
        return transformed;
    };

    let resultMessage = `🖋️ *Stylish Text Generator* 🖋️\n\n*Original:* ${q}\n\n`;

    // Har style apply karna
    styles.forEach(style => {
        const styledText = transformText(q, style.map);
        resultMessage += `*${style.name}:*\n\`\`\`\n${styledText}\n\`\`\`\n`;
    });
    
    sendMessage(resultMessage);
    await conn.sendMessage(from, { react: { text: '✨', key: m.key } });
});
