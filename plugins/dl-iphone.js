const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');

// --- API Endpoints ---
const SEARCH_API = 'https://theresapis.vercel.app/search/applemusic';
const DL_API = 'https://theresapis.vercel.app/download/applemusic';

// --- Global State Cache for Interactive Steps ---
// Used to store search results temporarily for the user to select.
const searchCache = new Map();

// --- API Functions (Converted to CJS syntax) ---

async function appleSearch(query) {
  const res = await axios.get(SEARCH_API, { 
      params: { query },
      timeout: 15000 
  });

  if (!res.data.status || !res.data.results || res.data.results.length === 0) {
    throw new Error('❌ Maaf, koi natija nahi mila.');
  }

  return res.data.results;
}

async function appleDownload(url) {
  const res = await axios.get(DL_API, { 
      params: { url },
      timeout: 20000 
  });

  if (!res.data.status || !res.data.result) {
    throw new Error('❌ Gana download karne mein vifal raha.');
  }

  return res.data.result;
}

cmd({
    pattern: "applemusic",
    alias: ["applesearch", "amusic"],
    desc: "Apple Music par gaane khojta hai aur download ka option deta hai.", // Searches Apple Music and offers download option.
    category: "download",
    react: "🍎",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❌ Kripya gaane ka title ya artist dein!\n\n*Udaharan:*\n${prefix + command} consume`);

        await m.reply('🔍 *Apple Music* par khoja ja raha hai...');

        // 1. Search for the music
        const results = await appleSearch(q);
        const topResults = results.slice(0, 5); // Limit to top 5 for clean menu

        // 2. Format the list for the user
        const list = topResults
            .map(
                (v, i) =>
                    `*${i + 1}.* ${v.title}\n` +
                    `   👤 Artist: ${v.artist}\n` +
                    `   🔗 Link: ${v.link}`
            )
            .join('\n\n');

        const resultMessage = `
🎵 *Apple Music Search Results* 🎵

${list}

*Kripya download karne ke liye number (1 - ${topResults.length}) se reply karein.*
`;

        // Store results temporarily in cache
        const cacheKey = `${from}-${mek.key.id}`;
        searchCache.set(cacheKey, topResults);

        // 3. Send the search results and prompt for selection
        const sentSearchMsg = await conn.sendMessage(
            from,
            {
                image: { url: topResults[0].image },
                caption: resultMessage
            },
            { quoted: mek }
        );
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // --- LISTEN FOR USER'S SELECTION (HANDLER 1) ---
        const selectionHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToSearch = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentSearchMsg.key.id;
            if (!repliedToSearch) return;

            const selectedIndex = parseInt(msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim());
            const cachedList = searchCache.get(cacheKey);
            
            if (cachedList && selectedIndex >= 1 && selectedIndex <= cachedList.length) {
                // Valid selection found, remove listener and proceed
                conn.ev.off("messages.upsert", selectionHandler);
                searchCache.delete(cacheKey); // Clean cache

                const selectedTrack = cachedList[selectedIndex - 1];

                await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
                await reply(`⏳ *${selectedTrack.title}* - ${selectedTrack.artist} ka audio laaya jaa raha hai...`);

                // 4. Download the audio file
                const dl = await appleDownload(selectedTrack.link);

                // 5. Send the audio file
                await conn.sendMessage(
                    from,
                    {
                        audio: { url: dl.url },
                        mimetype: 'audio/mpeg',
                        fileName: `${dl.name}.m4a`,
                        caption:
                            `🎵 *${dl.name}*\n` +
                            `👤 *Artist:* ${dl.artist}\n` +
                            `💿 *Album:* ${dl.album_name}\n` +
                            `⏱ *Duration:* ${dl.duration}\n\n` +
                            `_✅ Safaltapoorvak download hua!_`
                    },
                    { quoted: msg }
                );
                
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
        console.error("Apple Music Command Error:", err);
        conn.reply(m.chat, `❌ *Apple Music* khojne mein truti aayi:\n\n${err.message || 'Unknown Error'}`, m);
    }
});
