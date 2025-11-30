const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "play", // Naya pattern use kar rahe hain
  alias: ["playaudio1", "song4"],
  desc: "Downloads YouTube audio by title (sends thumbnail first).",
  category: "download",
  react: "🎵",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a song title or name to search.");
    }

    // 1. Search video on YouTube
    const search = await yts(q);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No song results found for that query.");
    }

    const { url, title, image } = video;

    // 2. --- Send the YouTube Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Fetching audio file, please wait..._`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Found song: *${title}*. Fetching download link...`);
    }

    let res;
    let downloadData;
    let audioUrl;
    
    // 3. Call the external 'ytdl' API for audio download link
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        
        // --- Extracting the nested result object and the 'mp3' field ---
        downloadData = res.data.result;
        audioUrl = downloadData?.mp3; // We need the specific 'mp3' field
        
    } catch (apiError) {
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ The external download service failed to connect. Status: ${apiError.response?.status || 'Connection Error'}. Please try again later.`);
    }

    // 4. Check API response structure and validity of URL
    if (!res.data.status || !audioUrl || typeof audioUrl !== 'string' || audioUrl.length < 10) {
      console.error("Audio API response structure error:", res.data);
      // The API gave a response, but the 'mp3' link was missing or invalid.
      return reply("❌ The download service failed to generate a valid audio link for this song.");
    }

    // 5. --- Attempt to Send the Audio file ---
    try {
        await conn.sendMessage(from, {
          audio: { url: audioUrl }, // Send the audio file
          mimetype: "audio/mpeg", 
          ptt: false, // Standard audio file for reliable playback
          fileName: `${downloadData.title || title}.mp3`,
          caption: `✅ *${downloadData.title || title}* Downloaded Successfully!\n\n_Powered by KAMRAN-MD._`,
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

        // No extra success reply to prevent duplicate messages.
        
    } catch (mediaError) {
        console.error("Audio Send Failed:", mediaError.message);
        return reply("⚠️ Audio link found, but failed to send the audio. The file might be too large or the link may have expired.");
    }

  } catch (e) {
    console.error("play3 General command error:", e.name, e.message);
    reply("❌ A command processing error occurred during search or setup. Try a different query.");
  }
});
