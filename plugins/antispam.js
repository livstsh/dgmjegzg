const { cmd } = require('../command');
const { promises } = require('fs');
const { join } = require('path');
const os = require('os');
const fetch = require('node-fetch');
const fs = require('fs');
const config = require('../config');

// --- CRITICAL FIX: Self-Contained Runtime Functions ---
const startTime = new Date();
const runtime = () => new Date() - startTime; 

function clockString(ms) {
  let d = Math.floor(ms / 86400000);
  let h = Math.floor(ms / 3600000) % 24;
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  
  return [d, ' *Days ☀️*\n ', h, ' *Hours 🕐*\n ', m, ' *Minute ⏰*\n ', s, ' *Second ⏱️*'].map(v => v.toString().padStart(2, 0)).join('');
}

function ucapan() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 10) return "Pagi Lord 🌄";
  if (hour >= 10 && hour < 15) return "Siang Lord ☀️";
  if (hour >= 15 && hour < 18) return "Sore Lord 🌇";
  if (hour >= 18 || hour < 4) return "Malam Lord 🌙";
  return "Hai Kak";
}
// --- END LOCAL FUNCTIONS ---

// --- Audio URL for the Menu Voice Intro ---
const MENU_AUDIO_URL = 'https://files.catbox.moe/ufq5ub.mp3';

// --- STYLING TAGS ---
const llim = 'Ⓛ'; // Limit Tag
const lprem = 'Ⓟ'; // Premium Tag
const readMore = String.fromCharCode(8206).repeat(4001); // Read more functionality

// --- 1. Authentic Menu Structure (Restored from your code with clean Unicode) ---
const defaultMenu = {
  before: `
╭─────═[ INFO USER ]═─────⋆
│╭───────────────···
┴│☂︎ *Name:* %name
⬡│☂︎ *Tag:* %tag
⬡│☂︎ *Premium:* %prems
⬡│☂︎ *Limit:* %limit
┬│☂︎ *Total Xp:* %totalexp
│╰────────────────···
┠─────═[ TODAY ]═─────⋆
│╭────────────────···
┴│    *${ucapan()} %name!*
⬡│☂︎ *Tanggal:* %week %date
┬│☂︎ *Waktu:* %time
│╰────────────────···
┠─────═[ INFO BOT ]═─────⋆
│╭────────────────···
┴│☂︎ *Nama Bot:* %me
⬡│☂︎ *Mode:* %mode
⬡│☂︎ *Prefix:* [ *%_p* ]
⬡│☂︎ *Platform:* %platform
⬡│☂︎ *Uptime:* %muptime
┬│☂︎ *Database:* %rtotalreg dari %totalreg
│╰────────────────···
╰──────────═┅═──────────

⃝▣──「 *INFO CMD* 」───⬣
│ *Ⓟ* = Premium
│ *Ⓛ* = Limit
▣────────────⬣
%readmore
`.trimStart(),
  header: '⃝▣──「 %category 」───⬣',
  body: '│○ %cmd %isPremium %islimit',
  footer: '▣────────────⬣\n',
  after: ``,
}


let handler = async (conn, mek, m, { usedPrefix: _p, args, command, reply }) => {
    
    // --- 2. GATHER CORE INFO (Simulated Premium Status for demonstration) ---
    const totalCommands = 352; 
    const limit = 50; 
    const totalexp = 5000; 
    const totalreg = 500;
    const rtotalreg = 200;
    const premiumTime = 1; // SIMULATED: Setting premium time > 0
    
    const name = await conn.getName(m.sender);
    const time = new Date().toLocaleTimeString('id', { hour: 'numeric', minute: 'numeric', second: 'numeric' });
    const platform = os.platform();
    const date = new Date().toLocaleDateString('id', { day: 'numeric', month: 'long', year: 'numeric' });
    const week = new Date().toLocaleDateString('id', { weekday: 'long' });
    
    const _muptime = runtime(); 
    const muptime = clockString(_muptime);
    
    const mode = global.opts?.['self'] ? 'Private' : 'Publik';
    const prems = `${premiumTime > 0 ? 'Premium': 'Free'}`; // Displaying Premium status
    const tag = `@${m.sender.split('@')[0]}`;
    
    // --- 3. DUMMY COMMANDS (To demonstrate P and L tags) ---
    let tags = {
      'downloader': 'Downloader',
      'premium': 'Premium', // Added dedicated Premium category
      'owner': 'Owner',
      'main': 'Main',
    }
    let help = [ 
        { help: ['tiktok <url>'], tags: ['downloader'], limit: true, premium: false },
        { help: ['ytmp3 <url>'], tags: ['downloader'], limit: true, premium: false },
        { help: ['buypremium'], tags: ['premium'], limit: false, premium: false }, // Command to buy premium
        { help: ['kick @user'], tags: ['group'], limit: true, premium: false },
        { help: ['restart'], tags: ['owner'], limit: false, premium: true }, // Premium required
        { help: ['ping'], tags: ['main'], limit: false, premium: false },
    ];
    let groups = {};
    for (let tag in tags) {
      groups[tag] = help.filter(menu => menu.tags && menu.tags.includes(tag));
    }
    
    // --- 4. APPLY MENU TEMPLATE (Filling the placeholders) ---
    
    let _text = [
      defaultMenu.before,
      ...Object.keys(tags).map(tag => {
        return defaultMenu.header.replace(/%category/g, tags[tag]) + '\n' + [
          ...groups[tag].map(menu => {
            return menu.help.map(help => {
              // Apply P and L tags dynamically
              return defaultMenu.body.replace(/%cmd/g, '%_p' + help)
                .replace(/%islimit/g, menu.limit ? llim : '')
                .replace(/%isPremium/g, menu.premium ? lprem : '')
                .trim()
            }).join('\n')
          }),
          defaultMenu.footer
        ].join('\n')
      }),
      defaultMenu.after
    ].join('\n')
    
    let text = _text; 
    
    let replace = {
      '%': '%',
      muptime: muptime,
      me: conn.getName(conn.user.jid),
      totalexp: totalexp,
      limit: limit,
      totalreg: totalreg,
      rtotalreg: rtotalreg,
      tag: tag,
      name: name,
      prems: prems,
      platform: platform,
      mode: mode, 
      _p: _p || '.', 
      date: date,
      week: week, 
      time: time,
      readmore: readMore
    }
    
    // Final text compilation
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    
    // --- 5. PREMIUM BUTTON HINT (Mimicking a button for Premium feature) ---
    const premiumHint = `
╭━━━━━━━━━━━━━━━━━━╮
│ 🌟 *PREMIUM FEATURES*
│ TYPE *.buypremium* TO ACTIVATE
╰━━━━━━━━━━━━━━━━━━╯
`;
    
    // --- 6. SEND FINAL MESSAGE (Most Stable Method) ---
    
    // FAKE TROLLEY (Aesthetic Quoted Message)
    const ftrol = {
        key : {
        remoteJid: 'status@broadcast',
        participant : '0@s.whatsapp.net'
        },
        message: {
        orderMessage: {
        itemCount : 2024,
        status: 1,
        surface : 1,
        message: `Hai Kak ${name}!`, 
        orderTitle: `▮Menu ▸`,
        thumbnail: fs.readFileSync('./thumbnail.jpg'), // Placeholder image
        sellerJid: '0@s.whatsapp.net' 
        }
        }
    }
    
    // --- Send Menu Audio ---
    try {
        await conn.sendMessage(
            from,
            {
                audio: { url: MENU_AUDIO_URL },
                mimetype: 'audio/mp3',
                ptt: true, // Send as Voice Note
            },
            { quoted: mek }
        );
    } catch (audioError) {
        console.error('Menu Audio send failed:', audioError);
    }
    
    // Final response: Text Message + Premium Button Hint
    const finalMessage = text.trim() + '\n\n' + premiumHint;
    
    // Final reliable send method: Text Message with aesthetic quote
    return conn.reply(m.chat, finalMessage, ftrol, { contextInfo: { mentionedJid: [m.sender] } });
}

// --- COMMAND WRAPPER ---
cmd({
    pattern: "menu9", // <--- Pattern is correctly set
    alias: ['allmenu9', 'help9', '?'],
    desc: "Show the interactive menu system.",
    category: "main",
    react: "⭐",
    filename: __filename,
    command: /^(menu|allmenu|help|\?)$/i // The regex is now redundant but kept for completeness
}, handler);

module.exports = handler;
