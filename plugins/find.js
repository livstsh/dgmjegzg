const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const Buffer = require('buffer').Buffer;
const fetch = require('node-fetch');

// --- API Endpoints ---
const SEARCH_API = 'https://www.restwave.my.id/search/lirikv2?title=';
// NOTE: We use a different API that generates the image directly, as 'canvas' is blocked.
const IMAGE_GENERATOR_API = 'https://api.deline.web.id/maker/lirik?title='; // Placeholder for Image Generator

// --- Global State Cache for Interactive Steps ---
const searchCache = new Map();

// --- API Functions (Simplified and Adapted) ---

async function appleSearch(query) {
  // Use the original search API
  const res = await axios.get(`${SEARCH_API}${encodeURIComponent(query)}`, { timeout: 15000 });

  if (!res.data.status || !res.data.result || !res.data.result.length) {
    throw new Error('❌ Maaf, koi natija nahi mila.');
  }

  // Ensure lyrics are available (or will be fetched later)
  return res.data.result.slice(0, 7).map(v => ({
      title: v.trackName,
      artist: v.artistName,
      lyrics: v.plainLyrics || v.syncedLyrics || "Lirik tidak tersedia", // Get available lyrics
  }));
}

// Function to replace renderLyrics by calling an external API that handles the canvas work
async function generateLyricsImage(trackName, artistName, lyrics) {
    const encodedTitle = encodeURIComponent(trackName);
    const encodedArtist = encodeURIComponent(artistName);
    // Note: Most image APIs require a specific lyrics format/length, which is complex.
    // For simplicity, we just send the text and hope the API handles the formatting.
    
    // We send the first 500 characters of the lyrics to the API.
    const encodedLyrics = encodeURIComponent(lyrics.substring(0, 500)); 

    const url = `${IMAGE_GENERATOR_API}${encodedLyrics}&title=${encodedTitle}&artist=${encodedArtist}`;
    
    // Attempt to fetch the final image buffer
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    
    if (!response.data || response.data.byteLength === 0) {
        throw new Error("API se image buffer nahi mila.");
    }
    
    return Buffer.from(response.data);
}


// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, from, prefix, command }) => {
    
    if (!q) return reply(`❌ Kripya gaane ka title dein!\n\n*Udaharan:* ${prefix + command} menepi`);

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await reply('⏳ *Lyrics* khoje ja rahe hain...');

    try {
        // 1. Search for lyrics
        const results = await appleSearch(q);
        
        // 2. Format the list for the user
        let teks = `🎵 *Lyrics Khoje Gaye* 🎵\n\n*Kripya image banane ke liye number (1 - ${results.length}) se reply karein:*\n\n`;
        results.forEach((v, i) => {
            teks += `${i + 1}. *${v.title}*\n   ➤ ${v.artist}\n\n`;
        });

        // Store results temporarily in cache
        const cacheKey = `${from}-${mek.key.id}`;
        searchCache.set(cacheKey, { results, q });

        // 3. Send the selection prompt
        const msg = await conn.sendMessage(m.chat, { text: teks.trim() }, { quoted: mek });

        // --- LISTEN FOR USER'S SELECTION (HANDLER 2) ---
        const selectionHandler = async (msgUpdate) => {
            const receivedMsg = msgUpdate.messages[0];
            if (!receivedMsg?.message || receivedMsg.key.remoteJid !== from) return;

            const repliedToPrompt = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === msg.key.id;
            if (!repliedToPrompt) return;

            const selectedIndex = parseInt(receivedMsg.message.conversation?.trim() || receivedMsg.message.extendedTextMessage?.text?.trim()) - 1;
            const cachedData = searchCache.get(cacheKey);
            
            if (cachedData && selectedIndex >= 0 && selectedIndex < cachedData.results.length) {
                // Valid selection found, remove listener and clean cache
                conn.ev.off("messages.upsert", selectionHandler);
                searchCache.delete(cacheKey);

                const selectedTrack = cachedData.results[selectedIndex];

                await conn.sendMessage(from, { react: { text: '🖼️', key: receivedMsg.key } });
                await reply(`⏳ *${selectedTrack.title}* ke lyrics ki image banai jaa rahi hai...`);

                // 4. Generate the Lyrics Image (via external API)
                const buffer = await generateLyricsImage(selectedTrack.title, selectedTrack.artist, selectedTrack.lyrics);
                
                // 5. Send the final image
                await conn.sendMessage(m.chat, {
                    image: buffer,
                    caption: `✅ *Lyrics Image Taiyaar!*\n${selectedTrack.title} — ${selectedTrack.artist}`
                }, { quoted: receivedMsg });

                await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });

            } else if (cachedData) {
                // Invalid selection number
                await reply(`❌ Kripya sahi number (1 se ${cachedData.results.length}) se reply karein.`);
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
        console.error("Lyrics Canvas Command Error:", err);
        reply('❌ Gagal search ya image banane mein truti aayi: ' + err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
};

cmd({
    pattern: "lirik",
    alias: ["lyrics"],
    desc: "Lyrics khojta aur unki image banaata hai.", // Searches lyrics and converts them into an image.
    category: "search",
    react: "🎶",
    filename: __filename,
    limit: true
}, handler);

module.exports = handler;
