const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "video3",
  alias: ["v3", "youtube"],
  desc: "Downloads YouTube video by title (sends thumbnail first).",
  category: "download",
  react: "🎬",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a video title or name to search.");
    }

    // 1. Search video on YouTube
    const search = await yts(q);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found for that query.");
    }

    const { url, title, image } = video;

    // 2. --- Send the YouTube Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Fetching video file, please wait..._`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Found video: *${title}*. Fetching download link...`);
    }

    let res;
    let videoUrl;
    
    // 3. Call the external 'ytdl' API for video download link
    try {
        // Using the new, more general ytdl endpoint
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        videoUrl = res.data.result;
    } catch (apiError) {
        // Handles connection errors (e.g., API server is down or timed out)
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ The external download service failed to connect. Status: ${apiError.response?.status || 'Connection Error'}. Please try again later.`);
    }

    // 4. Check API response structure and validity of URL
    if (!res.data.status || typeof videoUrl !== 'string' || videoUrl.length < 10) {
      console.error("Video API response structure error:", res.data);
      // This is the error the user previously received, indicating a bad link from the API.
      return reply("❌ The download service returned an invalid or empty video link. The service might not support this specific video.");
    }

    // 5. --- Attempt to Send the Video file ---
    try {
        await conn.sendMessage(from, {
          video: { url: videoUrl }, // Send the video file
          mimetype: "video/mp4", 
          caption: `✅ *${title}* Downloaded Successfully!\n\n_Powered by KAMRAN-MD._`,
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

        // 6. Reply with final success message ONLY if the video send succeeded
        await reply(`🎉 Video *${title}* has been successfully sent! KAMRAN-MD!`);
    } catch (mediaError) {
        console.error("Video Send Failed:", mediaError.message);
        // This handles cases where the link is valid but the file is too large or not streamable by the platform.
        return reply("⚠️ Video link found, but failed to send the video. This often happens if the video file is too large or the source URL is not directly accessible by the platform's media server.");
    }

  } catch (e) {
    // General error handler (for issues like parsing, initial search failure, etc.)
    console.error("video3 General command error:", e.name, e.message);
    reply("❌ A command processing error occurred during search or setup. Try a different query.");
  }
});
