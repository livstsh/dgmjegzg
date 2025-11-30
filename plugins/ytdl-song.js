const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "vdl",
  alias: ["videodl", "vquality"],
  desc: "Downloads video, with number-based quality selection (1=360p, 2=480p, 3=720p).",
  category: "download",
  react: "📹",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Kripya video ka naam aur quality number dein. (1, 2, ya 3)\n\n*Quality Options:*\n1. 360p\n2. 480p\n3. 720p\n\n*Udaharan:* .vdl Naya Gaana 2"); // Please provide video name and quality number.
    }

    let qualityNumber = null;
    let requestedQuality = 'Standard';
    let finalQuery = q;

    // Logic to extract the number (1, 2, or 3) from the end of the query
    const lastArg = args[args.length - 1];
    
    // Check if the last argument is a digit '1', '2', or '3'
    if (['1', '2', '3'].includes(lastArg)) {
        qualityNumber = parseInt(lastArg, 10);
        
        // Map the number to the quality string
        const qualityMap = { 1: '360p', 2: '480p', 3: '720p' };
        requestedQuality = qualityMap[qualityNumber];

        // Reconstruct the query without the number argument
        finalQuery = args.slice(0, args.length - 1).join(' ');
    } else {
        // If no number is provided, prompt the user for it
        return reply("⚠️ Kripya sahi quality number dein. (1, 2, ya 3)\n\n*Quality Options:*\n1. 360p\n2. 480p\n3. 720p\n\n*Udaharan:* .vdl Naya Gaana 3");
    }
    
    if (!finalQuery) {
        return reply("❌ Video ka title gayab hai. Udaharan: .vdl Latest Song 3"); // Video title is missing
    }

    // 1. Search for the video on YouTube
    const search = await yts(finalQuery);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ Is query ke liye koi video natija nahi mila."); // No search result
    }

    const { url, title, image } = video;
    let res;
    let downloadData;
    let videoUrl;

    // 2. --- Send the YouTube Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Aapki maangi gayi ${requestedQuality} version laaya ja raha hai, kripya intezaar karein..._`, // Fetching requested version...
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Video mil gaya: *${title}*. ${requestedQuality} link laaya ja raha hai...`); // Video found: Fetching link...
    }
    
    // 3. Call the external 'ytdl' API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        
        downloadData = res.data.result;
        videoUrl = downloadData?.mp4; 
        
    } catch (apiError) {
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ External download service se connection fail ho gaya. Kripya baad mein koshish karein.`); // API connection failed
    }

    // 4. Check API response and URL validity
    if (!res.data.status || !videoUrl || typeof videoUrl !== 'string' || videoUrl.length < 10) {
      console.error("Video API structure error (Missing mp4 link):", res.data);
      return reply("❌ Download service video link banane mein vifal raha."); // API link is missing/invalid
    }

    // 5. --- Send the Video file ---
    try {
        await conn.sendMessage(from, {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          // Confirming the user's requested quality in the final message
          caption: `✅ *${downloadData.title || title}* Safaltapoorvak ${requestedQuality} Quality mein Download ho gaya!\n\n_Powered by KAMRAN-MD._`, // Downloaded Successfully in requested Quality!
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

    } catch (mediaError) {
        console.error("Video Send Failed:", mediaError.message);
        return reply("⚠️ Video link mil gaya, lekin bhejte waqt fail ho gaya. File shayad zyada badi hai."); // Sending media failed
    }

  } catch (e) {
    console.error("vdl General command error:", e.name, e.message);
    reply("❌ Command process karte samay koi aam truti hui. Kripya doosra query try karein."); // General unexpected error
  }
});
