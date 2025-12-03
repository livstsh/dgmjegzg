const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search"); // Added yts for fallback search

// --- API Endpoints ---
const SEARCH_API = "https://jawad-tech.vercel.app/search/youtube?q=";
const VIDEO_API = "https://jawad-tech.vercel.app/download/ytdl?url=";
const AUDIO_API = "https://jawad-tech.vercel.app/download/audio?url=";

const cache = new Map(); // Caching search results

// --- Helper Functions ---

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

function getVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Function to perform the search with Fallback logic
async function searchYouTube(query) {
    const cacheKey = `search:${query}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    let formattedVideo = null;
    
    // --- Attempt 1: External Search API ---
    try {
        const apiUrl = `${SEARCH_API}${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const data = response.data;

        if (data.status === true && data.result && data.result.length > 0) {
            const video = data.result[0];
            formattedVideo = {
                url: normalizeYouTubeUrl(video.url) || video.url,
                title: video.title || 'Video',
                duration: video.duration,
                thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${getVideoId(video.url)}/hqdefault.jpg`,
            };
        } else {
             throw new Error("API returned no results or failed status.");
        }
    } catch (error) {
        console.warn(`Primary Search API failed. Trying fallback (yts)...`);
    }
    
    // --- Attempt 2: Local yts Fallback ---
    if (!formattedVideo) {
        try {
            const searchResults = await yts(query);
            const video = searchResults.videos[0];
            
            if (video) {
                formattedVideo = {
                    url: video.url,
                    title: video.title,
                    duration: video.timestamp, // yts uses timestamp for duration string
                    thumbnail: video.thumbnail,
                };
            }
        } catch(e) {
            console.error(`Local yts search failed: ${e.message}`);
        }
    }

    if (formattedVideo) {
        cache.set(cacheKey, formattedVideo);
        setTimeout(() => cache.delete(cacheKey), 1800000); 
        return formattedVideo;
    }
    
    return null;
}

// Function to fetch download links based on format and selected API
async function fetchDownloadLink(url, isAudio, useAudioApi) {
    let downloadUrl = null;
    
    // Determine which API to use
    const apiToUse = isAudio && useAudioApi ? AUDIO_API : VIDEO_API;
    const linkField = isAudio ? 'mp3' : 'mp4';
    
    try {
        const apiUrl = `${apiToUse}${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });
        const data = response.data;
        
        if (data.status === true) {
            if (isAudio && useAudioApi && data.result) {
                // Direct link from /download/audio
                downloadUrl = data.result;
            } else if (data.result?.[linkField]) {
                // Nested link from /download/ytdl
                downloadUrl = data.result[linkField];
            }
        }
    } catch (error) {
        console.error(`Download API failed for ${isAudio ? 'audio' : 'video'}: ${error.message}`);
    }
    
    return downloadUrl;
}

// --- MAIN COMMAND ---
cmd(
  {
    pattern: "dwnld", // New pattern
    alias: ["dl", "playlist"],
    react: "⬇️",
    desc: "Interactive downloader using three APIs for 4 media format options.",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Kripya video ka naam ya URL dein."); 

      // 1. Send the initial searching message
      await robin.sendMessage(from, { react: { text: "🔍", key: mek.key } });
      await reply(`⏳ *"${q}"* ke liye YouTube Search se jaankari laayi ja rahi hai...`);

      // 2. Search for video using the Search API (with Fallback)
      const videoInfo = await searchYouTube(q);

      if (!videoInfo) {
          return reply("❌ Video khojne mein vifal rahe ya koi natija nahi mila. Kripya doobara prayas karein.");
      }

      // --- Simplified Menu for User (4 Options) ---
      let desc = `
 👑 *KAMRAN MD DOWNLOADER* 👑

📌 *Title:* ${videoInfo.title}
⏱️ *Duration:* ${videoInfo.duration || 'N/A'}

🔢 *Kripya format select karne ke liye number se reply karein:*
1 - MP3 (AUDIO) 🎧
2 - MP4 (VIDEO) 🎥
3 - DOCUMENT (MP3) 📁
4 - DOCUMENT (MP4) 📄
   
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN MD`; 

      // Send the menu message (Now the menu comes after searching)
      const vv = await robin.sendMessage(
        from,
        { image: { url: videoInfo.thumbnail }, caption: desc },
        { quoted: mek }
      );

      await robin.sendMessage(from, { react: { text: "✅", key: mek.key } });

      // --- LISTEN FOR USER'S REPLY ---
      robin.ev.on("messages.upsert", async (msgUpdate) => {
        const msg = msgUpdate.messages[0];
        
        // Ensure the message is a reply to the menu we just sent
        if (
          !msg.message || 
          !msg.message.extendedTextMessage || 
          msg.message.extendedTextMessage.contextInfo.stanzaId !== vv.key.id
        ) return;

        const selectedOption = msg.message.extendedTextMessage.text.trim();
        
        try {
            
          const validOptions = ["1", "2", "3", "4"]; 
          if (!validOptions.includes(selectedOption)) {
            await robin.sendMessage(from, { react: { text: "❓", key: msg.key } });
            return reply("Kripya sahi option (1, 2, 3 ya 4) se reply karein."); 
          }

          await robin.sendMessage(from, { react: { text: "⏳", key: msg.key } });

          // 2. Determine Media/Format based on selection
          const isAudio = selectedOption === "1" || selectedOption === "3";
          const useAudioApi = selectedOption === "1" || selectedOption === "3"; // Options 1 & 3 use Audio API
          const sendAsDocument = selectedOption === "3" || selectedOption === "4";
          
          let downloadUrl = null;
          let formatText;
          let fileExtension;
          let mimeType;
          let mediaKey;
          
          if (isAudio) {
              formatText = selectedOption === "1" ? "MP3 Audio" : "MP3 Document";
              mediaKey = selectedOption === "3" ? 'document' : 'audio'; 
              fileExtension = 'mp3';
              mimeType = 'audio/mpeg';
              
              // Use /download/audio API for options 1 & 3
              downloadUrl = await fetchDownloadLink(videoInfo.url, true, true);
          } else {
              formatText = selectedOption === "2" ? "MP4 Video" : "MP4 Document";
              mediaKey = selectedOption === "4" ? 'document' : 'video'; 
              fileExtension = 'mp4';
              mimeType = 'video/mp4';
              // Use /download/ytdl API for options 2 & 4
              downloadUrl = await fetchDownloadLink(videoInfo.url, false, false);
          }


          if (!downloadUrl) {
            await robin.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ Download link nahi mil paaya! Kripya dobara koshish karein."); 
          }
          
          // 3. Send the final media
          await robin.sendMessage(
            from,
            {
              [mediaKey]: { url: downloadUrl },
              mimetype: mimeType,
              // CRITICAL FIX: Explicitly setting ptt: false for audio to prevent corruption error
              ptt: mediaKey === 'audio' ? false : undefined, 
              fileName: `${videoInfo.title}_${formatText}.${fileExtension}`,
              caption: `✅ *${videoInfo.title}* Downloaded Successfully!\n*Format:* ${formatText}`,
            },
            { quoted: msg }
          );
          
          // Final success reaction
          await robin.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
          console.error("Download error:", error);
          await robin.sendMessage(from, { react: { text: "❌", key: msg.key } });
          reply(`⚠️ Download karte samay truti aayi: ${error.message}`);
        }
      });
    } catch (e) {
      console.error("Command error:", e);
      await robin.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Anjaan truti hui"}`);
    }
  }
);
