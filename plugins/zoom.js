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

    // 3. Call the external API for video download link
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    
    const res = await axios.get(apiUrl);
    const videoUrl = res.data.result;

    // 4. Check API response
    if (!res.data.status || !videoUrl) {
      console.error("Video API response error:", res.data);
      return reply("❌ Failed to fetch video download link from the API. The download service might be down.");
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
    console.error("video3 command error:", e.message);
    reply("❌ An unexpected error occurred while processing the video download request.");
  }
});
