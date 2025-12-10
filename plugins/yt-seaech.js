const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// --- API Endpoints (from previous context) ---
const VIDEO_API = "https://jawad-tech.vercel.app/download/ytdl?url=";
const AUDIO_API = "https://jawad-tech.vercel.app/download/audio?url=";


// Function to fetch download links
async function fetchDownloadLink(url, isAudio) {
    let downloadUrl = null;
    let apiToUse = isAudio ? AUDIO_API : VIDEO_API;
    let linkField = isAudio ? 'mp3' : 'mp4';

    try {
        const apiUrl = `${apiToUse}${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });
        const data = response.data;
        
        if (data.status === true) {
            if (isAudio && apiToUse === AUDIO_API && data.result) {
                // Direct link from /download/audio (used for options 1 & 3)
                downloadUrl = data.result;
            } else if (data.result?.[linkField]) {
                // Nested link from /download/ytdl (used for video and audio fallback)
                downloadUrl = data.result[linkField];
            }
        }
    } catch (error) {
        console.error(`Download API failed for ${isAudio ? 'audio' : 'video'}: ${error.message}`);
    }
    return downloadUrl;
}

// Global variable to temporarily store search results and map index to video data
const searchCache = new Map();

cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    use: '.yts [query]',
    react: "🔎",
    desc: "YouTube par khojta hai aur interactive download option deta hai.", // Searches YouTube and gives interactive download option.
    category: "search",
    filename: __filename
},
async(conn, mek, m, {from, q, reply}) => {
try{
    if (!q) return reply('❌ Kripya khojne ke liye kuch shabd dein.'); // Please provide words to search

    await reply(`⏳ *"${q}"* ke liye YouTube par khoja ja raha hai...`); // Searching on YouTube...
    
    let searchResults;
    try {
        // Using local yts library for reliable search
        searchResults = await yts(q);
    } catch(e) {
        console.error("YouTube search error:", e);
        return await reply('❌ YouTube search karte samay truti aayi!'); 
    }
    
    // Filter videos, limit to top 5 for cleaner menu
    const videos = searchResults.videos.slice(0, 5);

    if (videos.length === 0) {
        return await reply(`🤷‍♀️ *"${q}"* ke liye koi video natija nahi mila.`);
    }

    let resultMessage = '📺 *YouTube Search Results* 📺\n\n';
    
    // Store results in the cache for later retrieval
    const currentResults = [];
    
    // Format the results
    videos.map((video, index) => {
        resultMessage += `*${index + 1}. ${video.title.trim()}*\n`;
        resultMessage += `   ⏱️ Duration: ${video.timestamp}\n`;
        resultMessage += `   👁️ Views: ${video.views}\n\n`;
        currentResults.push({ index: index + 1, title: video.title, url: video.url, thumbnail: video.thumbnail });
    });
    
    resultMessage += `\n*Kripya download karne ke liye number (1-${videos.length}) se reply karein.*`;
    
    // Store the results temporarily in cache, keyed by the sender's ID and message ID
    const cacheKey = `${from}-${mek.key.id}`;
    searchCache.set(cacheKey, currentResults);
    
    // Send the search results and prompt for selection
    const sentSearchMsg = await conn.sendMessage(from , { text: resultMessage }, { quoted: mek } );
    
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    // --- STEP 2: LISTEN FOR VIDEO SELECTION (HANDLER 1) ---
    const selectionHandler = async (msgUpdate) => {
        const msg = msgUpdate.messages[0];
        if (!msg?.message || msg.key.remoteJid !== from) return;

        // Check if the received message is a reply to the search results
        const repliedToSearch = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentSearchMsg.key.id;
        if (!repliedToSearch) return;

        const selectedIndex = parseInt(msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim());
        const cachedResults = searchCache.get(cacheKey);

        if (cachedResults && selectedIndex >= 1 && selectedIndex <= cachedResults.length) {
            // Found a valid video selection, remove the first listener
            conn.ev.off("messages.upsert", selectionHandler);
            
            const selectedVideo = cachedResults[selectedIndex - 1];
            
            // --- STEP 3: PROMPT FOR AUDIO/VIDEO FORMAT (HANDLER 2 SETUP) ---
            const formatPrompt = `
*Video Select Ho Gaya!*
🎞️ *Title:* ${selectedVideo.title}

*Aapko kis format mein chahiye?*
1 - MP3 (Audio) 🎧
2 - MP4 (Video) 🎥

*Kripya 1 ya 2 se reply karein.*
`;
            
            await conn.sendMessage(from, { react: { text: '▶️', key: msg.key } });
            // Send the prompt and capture its ID for the next handler
            const sentPromptMsg = await reply(formatPrompt); 
            
            // --- STEP 4: LISTEN FOR FORMAT SELECTION (HANDLER 2) ---
            const formatHandler = async (fMsgUpdate) => {
                const fMsg = fMsgUpdate.messages[0];
                if (!fMsg?.message || fMsg.key.remoteJid !== from) return;
                
                // Check if the received message is a reply to the format prompt
                const repliedToPrompt = fMsg.message.extendedTextMessage?.contextInfo?.stanzaId === sentPromptMsg.key.id;
                if (!repliedToPrompt) return;

                const formatSelection = fMsg.message.conversation?.trim() || fMsg.message.extendedTextMessage?.text?.trim();

                if (formatSelection === '1' || formatSelection === '2') {
                    // Final valid selection, remove the second listener and clean cache
                    conn.ev.off("messages.upsert", formatHandler);
                    searchCache.delete(cacheKey);
                    
                    const isAudio = formatSelection === '1';
                    const mediaType = isAudio ? 'Audio' : 'Video';
                    
                    await conn.sendMessage(from, { react: { text: '⏳', key: fMsg.key } });
                    await reply(`⏳ *${selectedVideo.title}* ka ${mediaType} link laaya ja raha hai...`);

                    // 5. FETCH AND SEND DOWNLOAD LINK
                    const downloadUrl = await fetchDownloadLink(selectedVideo.url, isAudio);

                    if (!downloadUrl) {
                        await conn.sendMessage(from, { react: { text: '❌', key: fMsg.key } });
                        return await reply(`❌ Download link nahi mil paaya. Kripya doosra video try karein.`);
                    }
                    
                    const mediaKey = isAudio ? 'audio' : 'video';
                    const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
                    const fileExtension = isAudio ? 'mp3' : 'mp4';
                    
                    await conn.sendMessage(from, {
                      [mediaKey]: { url: downloadUrl },
                      mimetype: mimeType,
                      ptt: mediaKey === 'audio' ? false : undefined, 
                      fileName: `${selectedVideo.title}.${fileExtension}`,
                      caption: `✅ *${selectedVideo.title}* Downloaded Successfully!\n*Format:* ${mediaType}`,
                    }, { quoted: fMsg });
                    
                    await conn.sendMessage(from, { react: { text: '✅', key: fMsg.key } });


                } else {
                    // Invalid selection, keep listener on
                    await reply("❌ Kripya sirf 1 ya 2 se reply karein.");
                }
            };
            
            // Add listener for format selection and set timeout (e.g., 2 minutes)
            conn.ev.on("messages.upsert", formatHandler);
            setTimeout(() => {
                conn.ev.off("messages.upsert", formatHandler);
                if (searchCache.has(cacheKey)) {
                    reply("⚠️ Samay seema samapt ho gayi. Kripya dobara khojein.");
                    searchCache.delete(cacheKey);
                }
            }, 120000); // 2 minutes timeout

        } else if (cachedResults) {
            // Invalid number reply for step 1
            await reply(`❌ Kripya sahi number (1 se ${cachedResults.length}) se reply karein.`);
        }
    };
    
    // Add listener for video selection and set timeout (e.g., 2 minutes)
    conn.ev.on("messages.upsert", selectionHandler);
    setTimeout(() => {
        conn.ev.off("messages.upsert", selectionHandler);
        if (searchCache.has(cacheKey)) {
            reply("⚠️ Samay seema samapt ho gayi. Kripya dobara khojein.");
            searchCache.delete(cacheKey);
        }
    }, 120000); // 2 minutes timeout


} catch (e) {
    console.error("YTS Command General Error:", e);
    reply('⚠️ YTS command process karte samay truti aayi.');
}
});
