const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

// NOTE: This code relies on the multi-purpose API endpoint: https://jawad-tech.vercel.app/download/ytdl

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

// Function to fetch video/audio links using the /download/ytdl API
async function fetchVideoData(url, retries = 2) {
  const cacheKey = `data:${getVideoId(url)}`;
  if (cache.has(cacheKey)) {
    console.log(`Using cached data for: ${url}`);
    return cache.get(cacheKey);
  }

  try {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    console.log(`Fetching from API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, { timeout: 15000 });
    const data = response.data;

    // --- CRITICAL FIX: Extracting nested links from data.result ---
    if (data.status === true && data.result) {
      const downloadData = data.result;
      
      const result = {
        download_url_mp4: downloadData.mp4, // Video link
        download_url_mp3: downloadData.mp3, // Audio link
        title: downloadData.title || "",
        thumbnail: data.info?.image || `https://i.ytimg.com/vi/${getVideoId(url)}/hqdefault.jpg`,
      };
      
      cache.set(cacheKey, result);
      setTimeout(() => cache.delete(cacheKey), 3600000); // Cache for 1 hour
      return result;
    }
    
    throw new Error("API status failure or result missing.");
  } catch (error) {
    console.error(`API fetch failed: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying API fetch... (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchVideoData(url, retries - 1);
    }
    return null;
  }
}

async function searchYouTube(query, maxResults = 1) {
  const cacheKey = `search:${query}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const searchResults = await yts({ query, pages: 1 });
    const videos = searchResults.videos.slice(0, maxResults);
    cache.set(cacheKey, videos);
    setTimeout(() => cache.delete(cacheKey), 1800000); 
    return videos;
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    return [];
  }
}

// --- MAIN COMMAND ---
cmd(
  {
    pattern: "video4",
    alias: ["ytvideo4", "video6", "video5"],
    react: "🎬",
    desc: "Download video/audio from YouTube with quality selection.",
    category: "ice Pakistan",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Kripya video ka naam ya URL dein aur phir menu se select karein."); 

      await robin.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const url = normalizeYouTubeUrl(q);
      let ytdata;

      if (url) {
        const searchResults = await searchYouTube(url);
        if (!searchResults.length) return reply("❌ Video not found!");
        ytdata = searchResults[0];
      } else {
        const searchResults = await searchYouTube(q);
        if (!searchResults.length) return reply("❌ No videos found matching your query!");
        ytdata = searchResults[0];
      }

      // Format the descriptive text for the menu
      let desc = `
 🎬 KAMRAN MD DOWNLOADER 🎬

📌 *Title:* ${ytdata.title}
🎬 *Channel:* ${ytdata.author.name}
👁️ *Views:* ${ytdata.views}
⏱️ *Duration:* ${ytdata.timestamp}
🕒 *Uploaded:* ${ytdata.ago}
🔗 *Link:* ${ytdata.url}

🔢 *Reply with a number to select quality and format:*
1. Video Format 🎥
   1.1 - 144p
   1.2 - 240p
   1.3 - 360p
   1.4 - 720p
   1.5 - 1080p
2. Audio Format 🎶 
   2.1 - MP3 (Standard)
   
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ`; 

      // Send the menu message
      const vv = await robin.sendMessage(
        from,
        { image: { url: ytdata.thumbnail }, caption: desc },
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
            
          const validOptions = [
            "1.1", "1.2", "1.3", "1.4", "1.5", "2.1"
          ];
          if (!validOptions.includes(selectedOption)) {
            await robin.sendMessage(from, { react: { text: "❓", key: msg.key } });
            return reply("Kripya sahi option (jaise 1.3 ya 2.1) se reply karein."); 
          }

          await robin.sendMessage(from, { react: { text: "⏳", key: msg.key } });

          // Map selection to format 
          const qualityMap = {
            "1.1": "144p", "1.2": "240p", "1.3": "360p", "1.4": "720p", "1.5": "1080p", "2.1": "MP3",
          };
          const formatText = qualityMap[selectedOption];
          const isAudio = selectedOption.startsWith("2");

          // Fetch the download URLs using the simplified function
          const data = await fetchVideoData(ytdata.url);
          
          let downloadUrl = isAudio ? data?.download_url_mp3 : data?.download_url_mp4;

          if (!data || !downloadUrl) {
            await robin.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ Download link nahi mil paaya! Kripya dobara koshish karein."); 
          }

          const fileExtension = isAudio ? 'mp3' : 'mp4';
          const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
          const mediaKey = isAudio ? 'audio' : 'video';
          
          // Send the final media
          await robin.sendMessage(
            from,
            {
              [mediaKey]: { url: downloadUrl },
              mimetype: mimeType,
              // --- CRITICAL FIX: Explicitly setting ptt: false for audio to prevent corruption error ---
              ptt: isAudio ? false : undefined, 
              fileName: `${ytdata.title}_${formatText}.${fileExtension}`,
              caption: `✅ *${ytdata.title}* Downloaded Successfully!\n*Format:* ${formatText}`,
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
