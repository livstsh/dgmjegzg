const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk'); // Kept for console logging aesthetic

// --- API Endpoints ---
const API_KEY = 'THERESA'; // API key provided in the original code
const SEARCH_API = `https://theresapis.vercel.app/search/douyin?apikey=${API_KEY}&q=`;
const DOWNLOAD_API = `https://theresapis.vercel.app/download/douyin?apikey=${API_KEY}&url=`;

// --- Global State Cache for Interactive Steps ---
const searchCache = new Map();

// --- API Functions ---

// 1. Search Function
async function douyinSearch(query) {
  try {
    const response = await axios.get(`${SEARCH_API}${encodeURIComponent(query)}`, { timeout: 15000 });
    
    if (!response.data?.result || response.data.result.length === 0) {
        throw new Error('❌ Koi natija nahi mila.');
    }
    return response.data.result;
  } catch (err) {
    console.error('Kesalahan saat mencari:', err.message);
    throw new Error('❌ Douyin search API se natija nahi mila.');
  }
}

// 2. Download Function
async function downloadVideo(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await axios.get(`${DOWNLOAD_API}${encodedUrl}`, { timeout: 20000 });
    
    // API provides HD link directly in result.hd
    return response.data?.result?.hd || null; 
  } catch (err) {
    console.error('Kesalahan saat download video:', err.message);
    return null;
  }
}

cmd({
    pattern: "dysearch",
    alias: ["douyins", "douyinsearch", "dyvideo"],
    desc: "Douyin/TikTok CN par video khojta aur download ka option deta hai.", // Searches Douyin and offers download option.
    category: "download",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❌ Kripya khojne ke liye kuch likhein!\n\n*Udaharan:* ${prefix + command} Beijing`);

        await m.reply('🔍 *Douyin/TikTok CN* par video khoja jaa raha hai...');

        // 1. Search for the video
        const results = await douyinSearch(q);
        const topResults = results.slice(0, 5); // Limit to top 5 for clean menu

        // 2. Format the list for the user
        const list = topResults
            .map(
                (v, i) =>
                    `*${i + 1}.* ${v.description || 'Unknown Title'}\n` +
                    `   👤 Author: ${v.author || 'Unknown'}\n` +
                    `   ❤️ Likes: ${v.likes || 0}\n` +
                    `   💬 Comments: ${v.comments || 0}`
            )
            .join('\n\n');

        const resultMessage = `
 *Douyin Video Search Results* 

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
                text: resultMessage
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

                const videoDetails = cachedList[selectedIndex];

                await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
                await reply(`⏳ *${videoDetails.description || 'Video'}* ka HD link taiyaar kiya jaa raha hai...`);

                // 4. Download the HD video link
                const hdVideoUrl = await downloadVideo(videoDetails.video_url);

                if (!hdVideoUrl) {
                     await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
                     return reply(`❌ HD Video link nikaalne mein vifal rahe. Kripya doosra video try karein.`);
                }
                
                // 5. Send the video file
                await conn.sendMessage(
                    m.chat,
                    {
                        video: { url: hdVideoUrl },
                        mimetype: 'video/mp4',
                        caption: `✅ *${videoDetails.description || 'Douyin Video'}*\n\n_HD Quality_`
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
        console.error('❌ Error handler utama:', err.message);
        conn.reply(m.chat, `❌ Terjadi kesalahan saat menjalankan perintah: ${err.message || 'Unknown Error'}`, m);
    }
});
