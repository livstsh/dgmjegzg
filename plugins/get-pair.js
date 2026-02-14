const { cmd } = require('../command');
const axios = require('axios');

// number clean function
function cleanNumber(num) {
  return num.replace(/[^0-9]/g, '');
}

// dummy pairing code generator
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


// ───────── MAIN PROVA MD PAIR ─────────
cmd({
  pattern: "pair",
  react: "🔗",
  desc: "PROVA MD Pair with code",
  category: "system",
  filename: __filename
}, async (conn, mek, m, { body, reply }) => {

  let number = body.split(" ")[1];
  if (!number) return reply("❌ Example:\n.pair 923001234567");

  number = cleanNumber(number);

  if (number.length < 10) {
    return reply("❌ Invalid number format");
  }

  const link = `https://prova-md.onrender.com/pair?number=${number}`;

  await reply(`
╭━━━〔 *PROVA MD PAIR* 〕━━━╮

📱 Number: ${number}

🔗 Pair Link:
${link}

⏳ Generating Code...
╰━━━━━━━━━━━━━━━━━━━━━━━╯
`);

  // ⏳ simulate delay
  setTimeout(async () => {

    const code = generateCode();

    await conn.sendMessage(m.chat, {
      text: `
🔐 *PAIRING CODE*

Your code for ${number} :

*${code}*

Enter this code in pairing page.
`
    }, { quoted: mek });

  }, 3000);

});


// ───────── MINI BOT PAIR ─────────
cmd({
  pattern: "mini",
  react: "🤖",
  desc: "Mini Bot Pair with code",
  category: "system",
  filename: __filename
}, async (conn, mek, m, { body, reply }) => {

  let number = body.split(" ")[1];
  if (!number) return reply("❌ Example:\n.mini 923001234567");

  number = cleanNumber(number);

  if (number.length < 10) {
    return reply("❌ Invalid number format");
  }

  const link = `https://dr-mini-md-new-4bab55f00cdc.herokuapp.com/pair?number=${number}`;

  await reply(`
╭━━━〔 *MINI BOT FREE PAIR* 〕━━━╮

📱 Number: ${number}

🔗 Pair Link:
${link}

⏳ Generating Code...
╰━━━━━━━━━━━━━━━━━━━━━━━╯
`);

  setTimeout(async () => {

    const code = generateCode();

    await conn.sendMessage(m.chat, {
      text: `
🔐 *MINI BOT PAIR CODE*

Code for ${number} :

*${code}*

Use this code to complete pairing.
`
    }, { quoted: mek });

  }, 3000);

});
