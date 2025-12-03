const { cmd } = require('../command');
const axios = require('axios');
const util = require('util'); // For general utilities

// --- API Endpoints ---
const TTS_API = 'https://api.nekorinn.my.id/tools/ttsba';

// --- Static Data (Character List for User Reference) ---
const CHARACTER_LIST = `
⌬┄┄┄┄┄┄┄┄┄┄┄┄┄┄⌬  
       *L I S T - K I R D A R* ⌬┄┄┄┄┄┄┄┄┄┄┄┄┄┄⌬  
  
• *airi* - Airi 🩷  
• *akane* - Akane 🌸  
• *akari* - Akari 🧡  
• *ako* - Ako 💼  
• *aris* - Aris 🎯  
• *arona* - Arona 🤖  
• *aru* - Aru 💣  
• *asuna* - Asuna 📚  
• *atsuko* - Atsuko 🧃  
• *ayane* - Ayane 🦋  
• *azusa* - Azusa 🌙  
• *cherino* - Cherino ❄️  
• *chihiro* - Chihiro 🗂️  
• *chinatsu* - Chinatsu 💊  
• *chise* - Chise 🔥  
• *eimi* - Eimi 👓  
• *erica* - Erica 🎀  
• *fubuki* - Fubuki 🍃  
• *fuuka* - Fuuka 🧺  
• *hanae* - Hanae 💐  
• *hanako* - Hanako 🛏️  
• *hare* - Hare 🦊  
• *haruka* - Haruka 🥋  
• *haruna* - Haruna 🎯  
• *hasumi* - Hasumi 🔫  
• *hibiki* - Hibiki 🎧  
• *hihumi* - Hihumi 🔮  
• *himari* - Himari 🌼  
• *hina* - Hina 👑  
• *hinata* - Hinata 🐇  
• *hiyori* - Hiyori 🍭  
• *hoshino* - Hoshino ⭐  
• *iori* - Iori 💥  
• *iroha* - Iroha 🚀  
• *izumi* - Izumi 🍞  
• *izuna* - Izuna 🐺  
• *juri* - Juri 🧪  
• *kaede* - Kaede 🍁  
• *karin* - Karin 🎯  
• *kayoko* - Kayoko 🎭  
• *kazusa* - Kazusa 🥀  
• *kirino* - Kirino 🎀  
• *koharu* - Koharu ☀️  
• *kokona* - Kokona 🐤  
• *kotama* - Kotama 🎮  
• *kotori* - Kotori 🐦  
• *main* - Main 🎙️  
• *maki* - Maki 🔫  
• *mari* - Mari 🍰  
• *marina* - Marina ⚓  
• *mashiro* - Mashiro 🐱  
• *michiru* - Michiru 🎨  
• *midori* - Midori 🧩  
• *miku* - Miku 💙  
• *mimori* - Mimori 🧶  
• *misaki* - Misaki 💄  
• *miyako* - Miyako 🎀  
• *miyu* - Miyu 🦈  
• *moe* - Moe 💡  
• *momoi* - Momoi 🖥️  
• *momoka* - Momoka 🎤  
• *mutsuki* - Mutsuki 🎇  
• *NP0013* - NP0013 🤖  
• *natsu* - Natsu ☀️  
• *neru* - Neru 🏍️  
• *noa* - Noa 💻  
• *nodoka* - Nodoka 📖  
• *nonomi* - Nonomi 🍔  
• *pina* - Pina 🍬  
• *rin* - Rin 🌸  
• *saki* - Saki 🎵  
• *saori* - Saori 🔫  
• *saya* - Saya 💉  
• *sena* - Sena 🧃  
• *serika* - Serika 🎒  
• *serina* - Serina 💊  
• *shigure* - Shigure 🌧️  
• *shimiko* - Shimiko 🍓  
• *shiroko* - Shiroko 🚲  
• *shizuko* - Shizuko 📦  
• *shun* - Shun 🎓  
• *ShunBaby* - Shun (Baby ver.) 👶  
• *sora* - Sora ☁️  
• *sumire* - Sumire 🌸  
• *suzumi* - Suzumi 📚  
• *tomoe* - Tomoe 🎭  
• *tsubaki* - Tsubaki 🛡️  
• *tsurugi* - Tsurugi 🗡️  
• *ui* - Ui 🍓  
• *utaha* - Utaha 🖋️  
• *wakamo* - Wakamo 🐍  
• *yoshimi* - Yoshimi 🍡  
• *yuuka* - Yuuka 📏  
• *yuzu* - Yuzu 🍋  
• *zunko* - Zunko 🎶  
  
Gunakan format:  
*.ttsba teks|kirdaar* Udaharan:  
*.ttsba hello world|shiroko|1.2* (speed optional hai)
`;

// Final handler (renamed from furina)
let handler = async (conn, mek, m, { q, reply, from, command }) => {
  
  // Use 'q' (the text input after command) for processing
  if (!q || !q.includes('|')) {  
    return reply(`❌ Format galat hai. ${CHARACTER_LIST}`);  
  }  
  
  // Split text by pipe (|)
  let [teks, char, speed] = q.split('|').map(v => v.trim());  
  
  if (!teks || !char) return reply(`❌ Format galat hai!\nSahi udaharan: .${command} hello world|shiroko`);  
  
  // Speed is optional, default to 1 (normal)
  speed = speed || '1';  

  await conn.sendMessage(from, { react: { text: "⏱️", key: m.key } });  
  
  try {  
    // 1. Construct the API URL
    const url = `${TTS_API}?text=${encodeURIComponent(teks)}&char=${encodeURIComponent(char)}&speed=${speed}`;  
    
    // 2. Fetch the audio buffer
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });  
  
    // 3. Send the audio file
    await conn.sendMessage(from, {  
      audio: Buffer.from(response.data),  
      mimetype: 'audio/mpeg',  
      // Send as standard audio file, PTT causes errors
      ptt: false, 
      fileName: `${char}_${Date.now()}.mp3`,
      caption: `✅ *TTS Pura Hua*\nKirdar: ${char}\nSpeed: ${speed}`
    }, { quoted: m });  
  
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    
  } catch (err) {  
    console.error("TTS BA Error:", err);
    return reply(`❌ Gagal memproses awaaz.\nNischit karein ki kirdar *${char}* sahi hai aur API chal rahi hai.`);  
  }  
};

cmd({
    pattern: "ttsba",
    alias: ["ttsanime"],
    desc: "Blue Archive ke kirdaaron ki awaaz mein TTS generate karta hai.",
    category: "ai",
    react: "🎤",
    filename: __filename,
    help: ['ttsba [text]|[character]|[speed]']
}, handler);
