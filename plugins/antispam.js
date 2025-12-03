const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio'); // Assuming cheerio is available in the environment
const fs = require('fs'); // Kept fs only for file structure completeness

// --- API Endpoints ---
const SEARCH_API = 'https://theresapis.vercel.app/search/happymod';
const API_KEY = 'THERESA'; // API key provided in the original code

// --- Global State Cache for Interactive Steps ---
// Used to store search results temporarily for the user to select.
const searchCache = new Map();

// --- API Functions ---

// 1. Search Function
async function happymodSearch(query) {
  if (!query) throw new Error('❌ Kripya us application ka naam dein jise aap khojna chahte hain.');

  const res = await axios.get(SEARCH_API, {
    params: { apikey: API_KEY, q: query },
    timeout: 15000 
  });

  if (!res.data?.status || !res.data?.result?.length)
    throw new Error('❌ Koi natija nahi mila. Kripya doosra naam try karein.');

  return res.data.result;
}

// 2. Link Extraction Function (Scraping the download page)
async function getApkLink(pageUrl) {
  try {
    const { data } = await axios.get(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Android 13; Mobile; rv:124.0)' },
      timeout: 20000
    });
    const $ = cheerio.load(data);
    
    // Find the first link ending in .apk
    const link = $('a[href$=".apk"]').attr('href');
    
    return link || null;
  } catch (e) {
    console.error('❌ Gagal ambil link APK:', e.message);
    return null;
  }
}

cmd({
    pattern: "happymod",
    alias: ["hmsearch", "apksearch"],
    desc: "HappyMod se applications khojta aur download ka option deta hai.", // Searches HappyMod and offers download option.
    category: "download",
    react: "🎮",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q)
            return reply(
                `❌ Kripya application ka naam dein.\n\n*Udaharan:*\n${prefix + command} minecraft`
            );

        await reply('🔍 *HappyMod* par application khoji jaa rahi hai...');

        // 1. Search for the app
        const results = await happymodSearch(q);
        const topResults = results.slice(0, 5); // Limit to top 5 for clean menu

        // 2. Format the list for the user
        const list = topResults
            .map(
                (v, i) =>
                    `*${i + 1}.* ${v.name}\n📦 Versi: ${v.version}\n📁 Ukuran: ${v.size}\n⭐ Mod: ${v.extra || '-'}`
            )
            .join('\n\n');

        const resultMessage = `
🎮 *HappyMod Search Results* 🎮

${list}

*Kripya download link laane ke liye number (1 - ${topResults.length}) se reply karein.*
`;

        // Store results temporarily in cache
        const cacheKey = `${from}-${mek.key.id}`;
        searchCache.set(cacheKey, topResults);

        // 3. Send the search results and prompt for selection
        const sentSearchMsg = await conn.sendMessage(
            from,
            {
                image: { url: results[0].icon },
                caption: resultMessage
            },
            { quoted: mek }
        );
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // --- LISTEN FOR USER'S SELECTION ---
        const selectionHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToSearch = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentSearchMsg.key.id;
            if (!repliedToSearch) return;

            const selectedIndex = parseInt(msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim()) - 1;
            const cachedList = searchCache.get(cacheKey);
            
            if (cachedList && selectedIndex >= 0 && selectedIndex < cachedList.length) {
                // Valid selection found, remove listener and proceed
                conn.ev.off("messages.upsert", selectionHandler);
                searchCache.delete(cacheKey); // Clean cache

                const app = cachedList[selectedIndex];

                await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
                await reply(`🔗 *${app.name}* ke liye download link taiyaar kiya jaa raha hai...`);

                // 4. Scrape the download page to get the direct APK link
                const apkUrl = await getApkLink(app.link);
                const finalLink = apkUrl || app.link; // Fallback to page link if direct link extraction fails

                if (!finalLink) {
                     await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
                     return reply(`❌ Download link nikaalne mein vifal rahe. Kripya doosra app try karein.`);
                }

                // 5. Send the final link and details
                const finalMessage = `
✅ *Download Taiyaar!*

📦 *App:* ${app.name}
📝 *Versi:* ${app.version}
📏 *Size:* ${app.size}
⭐ *Mod Info:* ${app.extra || 'None'}

📥 *Link:* ${finalLink}

_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_
`;
                await conn.reply(m.chat, finalMessage, msg);
                await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

            } else if (cachedList) {
                await reply(`❌ Kripya sahi number (1 se ${cachedList.length}) se reply karein.`);
            }
        };

        // Add listener and set timeout (e.g., 3 minutes)
        conn.ev.on("messages.upsert", selectionHandler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", selectionHandler);
            if (searchCache.has(cacheKey)) {
                reply("⚠️ Samay seema samapt ho gayi. Kripya dobara khojein.");
                searchCache.delete(cacheKey);
            }
        }, 180000); // 3 minutes timeout

    } catch (err) {
        console.error('❌ Error handler utama:', err.message);
        conn.reply(m.chat, '❌ Terjadi kesalahan saat mencari aplikasi di HappyMod.', m);
    }
});
