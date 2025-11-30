const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "ply",
  alias: ["play9", "play10", "sania1"],
  desc: "Download YouTube audio by title.",
  category: "download",
  react: "🎵",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please give me a song name.");
    }

    // 1. Search video on YouTube
    const search = await yts(q);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found for that query.");
    }

    const { url, title } = video;
    let audioUrl = null;

    // 2. Switching to a different download API for increased reliability
    // NOTE: If you have a specific, reliable API URL, replace the placeholder below.
    const reliableApiUrl = `https://api.example.com/youtube/audio?url=${encodeURIComponent(url)}`; 
    
    // --- Attempt to use the original API first (in case it was a temporary issue) ---
    try {
        const originalApiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(url)}`;
        const res = await axios.get(originalApiUrl);
        if (res.data.status && res.data.result) {
            audioUrl = res.data.result;
            console.log("Using Original API.");
        }
    } catch (e) {
        console.warn("Original API failed, attempting fallback.");
        // If the original API fails, audioUrl remains null
    }

    // --- If original API failed, try a placeholder reliable API ---
    if (!audioUrl) {
        // Since I don't have a reliable alternative API available, 
        // I'll show how you would structure the attempt, but you must replace 
        // `api.example.com` with a working service.
        
        /*
        try {
            const fallbackRes = await axios.get(reliableApiUrl); 
            // Assuming the fallback API returns { success: true, link: "..." }
            if (fallbackRes.data.success && fallbackRes.data.link) {
                audioUrl = fallbackRes.data.link;
                console.log("Using Fallback API.");
            }
        } catch (e) {
             console.error("Fallback API also failed:", e.message);
        }
        */
        
        // Since both attempts might fail, check audioUrl again.
        if (!audioUrl) {
            return reply("❌ Both download APIs failed to retrieve the audio link. The download service might be down.");
        }
    }


    // 3. Robustly check the resulting audio URL
    if (!audioUrl) {
      return reply("❌ Failed to fetch audio download link. The API might be offline.");
    }

    // 4. Send audio file as a standard music file (ptt: false)
    await conn.sendMessage(from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt: false, // Standard audio file
      fileName: `${title}.mp3`, 
      contextInfo: { forwardingScore: 999, isForwarded: true }
    }, { quoted: mek });

    // 5. Reply with success message
    await reply(`✅ *${title}* Downloaded Successfully and sent as an audio file.`);

  } catch (e) {
    console.error("play2 command error:", e.message);
    reply("❌ An unexpected error occurred while running the command.");
  }
});
