const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

// Helper function to format duration in HH:MM:SS
const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    // Add leading zero if needed and format as H:MM:SS or MM:SS
    const parts = [m, s].map(v => v.toString().padStart(2, '0'));
    if (h > 0) {
        parts.unshift(h.toString());
    }
    return parts.join(':');
};

// Map for selection options
const formatMap = {
    '1.1': { type: 'Video', quality: '144p' },
    '1.2': { type: 'Video', quality: '240p' },
    '1.3': { type: 'Video', quality: '360p' },
    '1.4': { type: 'Video', quality: '720p' },
    '1.5': { type: 'Video', quality: '1080p' },
    '2.1': { type: 'Document', quality: '144p' },
    '2.2': { type: 'Document', quality: '240p' },
    '2.3': { type: 'Document', quality: '360p' },
    '2.4': { type: 'Document', quality: '720p' },
    '2.5': { type: 'Document', quality: '1080p' },
};

const menuOptions = `
*Reply with a number to select quality and format:*

*1. Video Format 🎥*
1.1 - 144p
1.2 - 240p
1.3 - 360p
1.4 - 720p
1.5 - 1080p

*2. Document Format 📁*
2.1 - 144p
2.2 - 240p
2.3 - 360p
2.4 - 720p
2.5 - 1080p

*Example:* .vdl Song Title 1.4
`;

cmd({
  pattern: "vdl",
  alias: ["videodl", "vquality"],
  desc: "Downloads video with multi-format and quality selection (e.g., 1.3, 2.5).",
  category: "download",
  react: "📹",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide the video title and a selection number.\n\n" + menuOptions); // Display full menu on missing query
    }

    let selectedOption = null;
    let finalQuery = q;

    // Logic to extract the selection number (e.g., 1.3, 2.5) from the end
    const lastArg = args[args.length - 1];
    
    // Check if the last argument is a valid selection key
    if (formatMap[lastArg]) {
        selectedOption = formatMap[lastArg];
        finalQuery = args.slice(0, args.length - 1).join(' ');
    } else {
        // If the selection is missing or incorrect, send the prompt again.
        return reply("⚠️ Invalid selection number. Please use a valid format (e.g., 1.4 or 2.3).\n\n" + menuOptions);
    }
    
    if (!finalQuery) {
        return reply("❌ The video title is missing. Example: .vdl Latest Song 1.3");
    }

    // 1. Search for the video on YouTube
    const search = await yts(finalQuery);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found for this query.");
    }

    const { url, title, image, duration, views, author, uploadedAt } = video;
    
    let res;
    let downloadData;
    let videoUrl;

    // Format the detailed info for the thumbnail caption
    const detailedInfo = `
*Title:* ${title}
*Channel:* ${author.name}
*Views:* ${views}
*Duration:* ${formatDuration(duration.seconds)}
*Uploaded:* ${uploadedAt}
*Link:* ${url}
        
*Selected:* ${selectedOption.type} Format, ${selectedOption.quality}
*Status:* _Fetching download link, please wait..._
`;
    // 2. --- Send the Detailed Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `👑 *KAMRAN MD VIDEO DOWNLOADER* 👑\n\n${detailedInfo}`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Video found: *${title}*. Fetching link for ${selectedOption.quality}...`); 
    }
    
    // 3. Call the external 'ytdl' API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        
        downloadData = res.data.result;
        videoUrl = downloadData?.mp4; 
        
    } catch (apiError) {
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ External download service connection failed. Please try again later.`); 
    }

    // 4. Check API response and URL validity
    if (!res.data.status || !videoUrl || typeof videoUrl !== 'string' || videoUrl.length < 10) {
      console.error("Video API structure error (Missing mp4 link):", res.data);
      return reply("❌ Download service failed to generate a video link."); 
    }

    // 5. --- Send the Final Media (Video or Document) ---
    try {
        const fileName = `${title} (${selectedOption.quality}).${selectedOption.type === 'Video' ? 'mp4' : 'doc'}`;
        
        await conn.sendMessage(from, {
          // Send as video or document based on user selection.
          [selectedOption.type === 'Video' ? 'video' : 'document']: { url: videoUrl }, 
          mimetype: "video/mp4", // Mimetype remains mp4 as source is mp4
          fileName: fileName,
          caption: `✅ *${downloadData.title || title}* Downloaded Successfully!\n*Format:* ${selectedOption.type}, ${selectedOption.quality}\n\n_POWERED BY KAMRAN MD_`,
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

    } catch (mediaError) {
        console.error("Media Send Failed:", mediaError.message);
        return reply("⚠️ Video link found, but failed to send the media. The file might be too large or the link may have expired.");
    }

  } catch (e) {
    console.error("vdl General command error:", e.name, e.message);
    reply("❌ A general command processing error occurred. Please try a different query.");
  }
});
