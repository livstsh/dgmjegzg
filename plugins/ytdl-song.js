const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "vdl",
  alias: ["videodl", "vquality"],
  desc: "Downloads YouTube video, optionally specifying quality (e.g., 720p).",
  category: "download",
  react: "📹",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a video title and optionally the quality (e.g., 720p).");
    }

    let quality = null;
    let finalQuery = q;

    // Logic to parse quality from the end of the query string
    const lastArg = args[args.length - 1]?.toLowerCase();
    const qualityRegex = /\d{3,4}p|hd|sd/i; // Matches 360p, 720p, 1080p, HD, SD, etc.

    if (qualityRegex.test(lastArg)) {
        quality = lastArg.toUpperCase();
        // Reconstruct the query without the quality argument
        finalQuery = args.slice(0, args.length - 1).join(' ');
    }
    
    const requestedQuality = quality || 'Standard';

    if (!finalQuery) {
        return reply("❌ The video title is missing. Example: .vdl Latest Song 720p");
    }

    // 1. Search for the video on YouTube
    const search = await yts(finalQuery);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found for that query.");
    }

    const { url, title, image } = video;
    let res;
    let downloadData;
    let videoUrl;

    // 2. --- Send the YouTube Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Fetching ${requestedQuality} version, please wait..._`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Found video: *${title}*. Fetching ${requestedQuality} link...`);
    }
    
    // 3. Call the external 'ytdl' API (It will only return one link, regardless of the 'quality' variable)
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        
        downloadData = res.data.result;
        videoUrl = downloadData?.mp4; 
        
    } catch (apiError) {
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ The external download service failed to connect. Status: ${apiError.response?.status || 'Connection Error'}. Please try again later.`);
    }

    // 4. Check API response and validity of the URL
    if (!res.data.status || !videoUrl || typeof videoUrl !== 'string' || videoUrl.length < 10) {
      console.error("Video API structure error (Missing mp4 link):", res.data);
      return reply("❌ The download service failed to generate a valid video link for this video.");
    }

    // 5. --- Attempt to Send the Video file ---
    try {
        await conn.sendMessage(from, {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption: `✅ *${downloadData.title || title}* Downloaded Successfully in ${requestedQuality} Quality!\n\n_Powered by KAMRAN-MD._`, 
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

    } catch (mediaError) {
        console.error("Video Send Failed:", mediaError.message);
        return reply("⚠️ Video link found, but failed to send the video. The file might be too large or the link may have expired.");
    }

  } catch (e) {
    console.error("vdl General command error:", e.name, e.message);
    reply("❌ A command processing error occurred during search or setup. Try a different query.");
  }
});
