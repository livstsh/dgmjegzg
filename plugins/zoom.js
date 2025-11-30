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
    // Get the first video result
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found for that query.");
    }

    const { url, title, image } = video; // Destructure the video details, including the thumbnail 'image' URL

    // 2. --- Send the YouTube Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image }, // Use the thumbnail image URL
            caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Fetching video file, please wait..._`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Found video: *${title}*. Fetching download link...`);
    }

    let res;
    let videoUrl;
    
    // 3. Call the external API for video download link (Error handling specific to the API call)
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        videoUrl = res.data.result;
    } catch (apiError) {
        // Log the specific error for debugging
        console.error("Axios API Call Failed:", apiError.message);
        // Inform the user that the external service is likely the issue
        return reply(`❌ The external video download service failed to respond. Status: ${apiError.response?.status || 'Connection Error'}. Please try again later.`);
    }

    // 4. Check API response structure
    if (!res.data.status || !videoUrl) {
      console.error("Video API response structure error:", res.data);
      return reply("❌ The download service is online but returned an invalid video link. The service might not support this specific video.");
    }

    // 5. Send the Video file after the image
    await conn.sendMessage(from, {
      video: { url: videoUrl }, // Send the video file
      mimetype: "video/mp4", 
      caption: `✅ *${title}* Downloaded Successfully!\n\n_Powered by KAMRAN-MD._`,
      contextInfo: { forwardingScore: 999, isForwarded: true }
    }, { quoted: mek });

    // 6. Reply with success message
    await reply(`🎉 Video *${title}* has been successfully sent!`);

  } catch (e) {
    // General error handler (for issues like send message failure, etc.)
    console.error("video3 General command error:", e.message);
    reply("❌ An unexpected error occurred while running the command. Please check your network connection.");
  }
});
