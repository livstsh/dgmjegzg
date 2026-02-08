const { cmd } = require('../command');

cmd({
    pattern: "hack",
    desc: "Displays a dynamic and playful 'Hacking' message for fun.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { 
    from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, sender, isCreator, reply 
}) => {
    try {
        // Owner check (short message for unauthorized users)
        if (!isCreator) {
            return reply("🚫 Only owner can use this");
        }

        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        const signature = '\n\n🎭ᴘᴏᴡᴇʀᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ🎭';

        const steps = [
            '💻 *HACK STARTING...* 💻',
            '*Initializing hacking tools...* 🛠️',
            '*Connecting to remote servers...* 🌐',
            '```[██████████] 10%``` ⏳',
            '```[███████████████████] 20%``` ⏳',
            '```[███████████████████████] 30%``` ⏳',
            '```[██████████████████████████] 40%``` ⏳',
            '```[███████████████████████████████] 50%``` ⏳',
            '```[█████████████████████████████████████] 60%``` ⏳',
            '```[██████████████████████████████████████████] 70%``` ⏳',
            '```[██████████████████████████████████████████████] 80%``` ⏳',
            '```[██████████████████████████████████████████████████] 90%``` ⏳',
            '```[████████████████████████████████████████████████████] 100%``` ✅',
            '🔒 *System Breach: Successful!* 🔓',
            '🚀 *Command Execution: Complete!* 🎯',
            '*📡 Transmitting data...* 📤',
            '_🕵️‍♂️ Ensuring stealth..._ 🤫',
            '*🔧 Finalizing operations...* 🏁',
            '⚠️ *Note:* All actions are for demonstration purposes only.',
            '⚠️ *Reminder:* Ethical hacking is the only way to ensure security.',
            '> *PROVA-MD-HACKING-COMPLETE ☣*'
        ];

        for (let i = 0; i < steps.length; i++) {
            const textToSend = (i === steps.length - 1) ? (steps[i] + signature) : steps[i];
            await conn.sendMessage(from, { text: textToSend }, { quoted: mek });
            await sleep(1000);
        }
    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});