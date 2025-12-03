/**
@credit RijalGanzz (Original Logic)
@KAMRAN Md (Bot Integration)
**/

const axios = require("axios");
const { cmd } = require("../command");

// --- API Endpoints ---
const SPOTIFY_DOWNLOAD_API = "https://api.deline.web.id/downloader/spotifyplay?q=";
const CANVAS_IMAGE_API = "https://anabot.my.id/api/maker/spotify?apikey=freeApikey";
// Note: CANVAS_IMAGE_API uses 'freeApikey' and requires image/title/author to be encoded.

// Function to search and get Spotify track data
async function spotifyPlay(query) {
  const { data } = await axios.get(
    `${SPOTIFY_DOWNLOAD_API}${encodeURIComponent(query)}`,
    { timeout: 20000 }
  );
  
  if (!data?.status || !data?.result) {
    throw new Error('❌ Maaf, gaana nahi mila ya download link prapt nahi hua.'); // Song not found or download link missing
  }
  
  // Extracting necessary fields
  const metadata = data.result.metadata;

  if (!metadata || !data.result.dlink) {
      throw new Error('❌ Gaane ka data ya audio link adhoora hai.'); // Incomplete track data or audio link
  }
  
  return {
    title: metadata.title,
    artist: metadata.artist,
    duration: metadata.duration,
    cover: metadata.cover,
    url: metadata.url, // Spotify original URL
    audioUrl: data.result.dlink // Direct download link
  };
}

cmd({
  pattern: "spotifyplay",
  alias: ["spplay", "splay", "spotify"],
  desc: "Spotify se gaana khojta aur download karta hai.", // Searches and downloads song from Spotify.
  category: "download",
  react: "🎶",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
  if (!q) {
    return reply(`❌ Kripya gaane ka title ya artist dein!\n\n*Udaharan:*\n${prefix + command} my city`);
  }

  await reply("🔎 *Spotify* par gaana khoja ja raha hai...");

  try {
    const track = await spotifyPlay(q);
    
    // 1. Generate the custom canvas image URL (for aesthetic display)
    // Removed timestamp and blur for simplicity and reliability
    const canvasUrl = `${CANVAS_IMAGE_API}&author=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}&image=${encodeURIComponent(track.cover)}`;

    // 2. Prepare the caption
    const caption = `
🎵 *Spotify Play* 🎵
-----------------------------------
∘ *Title:* ${track.title}
∘ *Artist:* ${track.artist}
∘ *Duration:* ${track.duration}
∘ *Link:* ${track.url}

_✅ Audio file bheji ja rahi hai..._
`;
    
    // 3. Send the image/cover with details
    await conn.sendMessage(from, {
      image: { url: canvasUrl },
      caption
    }, { quoted: mek }).catch(() => conn.reply(from, caption, mek)); // Fallback to text if image fails

    // 4. Send the audio file
    await conn.sendMessage(from, {
      audio: { url: track.audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${track.title.replace(/[^\w\s]/gi, '')}.mp3`,
      caption: `*${track.title}* downloaded successfully!`
    }, { quoted: mek }).catch(() => {
      // Audio sending failed, notify user for manual download
      conn.reply(from, `⚠️ Audio bhejte samay truti aayi. Aap manual download yahan se kar sakte hain:\n${track.audioUrl}`, mek);
    });
    
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (e) {
    console.error("Spotify Play Error:", e);
    
    return conn.reply(
      from,
      `❌ *Spotify Download mein truti*\n\n${e.message || 'Anjaan galti hui.'}\n\n_Kripya doosra title try karein._`,
      mek
    );
  }
});
