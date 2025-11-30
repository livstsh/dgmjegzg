const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "play3", // New pattern for the legacy endpoint
  alias: ["play2", "sania"],
  desc: "Downloads YouTube audio using the older /download/audio endpoint (for testing/legacy use).",
  category: "download",
  react: "📻",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a song name.");
    }

    // 1. Search for the video on YouTube
    const search = await yts(q);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No song results found for that query.");
    }

    const { url, title, image } = video;
    let res;
    let audioUrl;

    // 2. --- Send the YouTube Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Fetching audio file using the OLD endpoint, please wait..._`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Found song: *${title}*. Fetching download link...`);
    }
    
    // 3. Call the external '/download/audio' API endpoint
    try {
        // --- USING THE LEGACY ENDPOINT PROVIDED BY THE USER ---
        const apiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        
        // This old endpoint usually returns the URL directly in 'result'
        audioUrl = res.data.result; 

    } catch (apiError) {
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ The LEGACY download service failed to connect. Status: ${apiError.response?.status || 'Connection Error'}. Please try again later.`);
    }

    // 4. Check API response structure and validity of the audio URL
    if (!res.data.status || !audioUrl || typeof audioUrl !== 'string' || audioUrl.length < 10) {
      console.error("Audio API structure error (Missing direct link):", res.data);
      return reply("❌ The LEGACY download service failed to generate a valid audio link for this song. Please use the default *play2* command.");
    }

    // 5. --- Attempt to Send the Audio file ---
    try {
        await conn.sendMessage(from, {
          audio: { url: audioUrl },
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`, 
          caption: `✅ *${title}* Downloaded Successfully!\n\n_Using legacy endpoint. Powered by KAMRAN-MD._`, 
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

    } catch (mediaError) {
        console.error("Audio Send Failed:", mediaError.message);
        return reply("⚠️ Audio link found, but failed to send the audio. The file might be too large or the link may have expired.");
    }

  } catch (e) {
    console.error("play4 command General error:", e.name, e.message);
    reply("❌ A command processing error occurred during search or setup. Try a different query.");
  }
});
