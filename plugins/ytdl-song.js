const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "mdl", // New pattern for Media Downloader
  alias: ["media", "avdl"],
  desc: "Downloads audio (1) or video (2) based on user input.", // Audio (1) ya video (2) download karta hai.
  category: "download",
  react: "🎶",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Kripya title aur selection number dein. (1 ya 2)\n\n*Options:*\n1. Audio (Gaana)\n2. Video\n\n*Udaharan:* .mdl Naya Song 1"); // Please provide title and selection number.
    }

    let selectionNumber = null;
    let mediaType = '';
    let apiField = '';
    
    // Logic to extract the number (1 or 2) from the end of the query
    const lastArg = args[args.length - 1];
    
    // Check if the last argument is '1' or '2'
    if (['1', '2'].includes(lastArg)) {
        selectionNumber = parseInt(lastArg, 10);
        
        if (selectionNumber === 1) {
            mediaType = 'Audio';
            apiField = 'mp3';
        } else { // selectionNumber === 2
            mediaType = 'Video';
            apiField = 'mp4';
        }

        // Reconstruct the query without the number argument
        const finalQuery = args.slice(0, args.length - 1).join(' ');
        
        if (!finalQuery) {
            return reply("❌ Video/Gaane ka title gayab hai. Udaharan: .mdl Latest Song 1"); // Title missing
        }

        // 1. Search for the video on YouTube
        const search = await yts(finalQuery);
        const video = search?.videos?.[0];

        if (!video) {
          return reply("❌ Is query ke liye koi natija nahi mila."); // No result
        }

        const { url, title, image } = video;
        let res;
        let downloadData;
        let mediaUrl;

        // 2. --- Send the YouTube Thumbnail Image first ---
        if (image) {
            await conn.sendMessage(from, {
                image: { url: image },
                caption: `🔍 *Title:* ${title}\n🌐 *Source:* YouTube\n\n_Aapka ${mediaType} file laaya ja raha hai, kripya intezaar karein..._`, // Fetching your media file...
                contextInfo: { forwardingScore: 999, isForwarded: true }
            }, { quoted: mek });
        } else {
            await reply(`⏳ ${mediaType} mil gaya: *${title}*. Download link laaya ja raha hai...`); // Media found: Fetching link...
        }
        
        // 3. Call the external 'ytdl' API
        try {
            const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
            res = await axios.get(apiUrl);
            
            downloadData = res.data.result;
            mediaUrl = downloadData?.[apiField]; // Dynamic extraction (mp3 or mp4)
            
        } catch (apiError) {
            console.error("Axios API Call Failed:", apiError.message);
            return reply(`❌ External download service se connection fail ho gaya. Kripya baad mein koshish karein.`); // Connection failed
        }

        // 4. Check API response and URL validity
        if (!res.data.status || !mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.length < 10) {
          console.error("API structure error (Missing link):", res.data);
          return reply(`❌ Download service ne valid ${mediaType} link nahi diya.`); // Invalid link
        }

        // 5. --- Send the Final Media (Audio or Video) ---
        try {
            const typeKey = selectionNumber === 1 ? 'audio' : 'video';
            const mimeType = selectionNumber === 1 ? 'audio/mpeg' : 'video/mp4';
            const fileExtension = selectionNumber === 1 ? 'mp3' : 'mp4';

            await conn.sendMessage(from, {
              [typeKey]: { url: mediaUrl },
              mimetype: mimeType,
              ptt: false, // Standard audio/video file
              fileName: `${downloadData.title || title}.${fileExtension}`,
              caption: `✅ *${downloadData.title || title}* Safaltapoorvak Download ho gaya!\n*Format:* ${mediaType}\n\n_Powered by KAMRAN-MD._`,
              contextInfo: { forwardingScore: 999, isForwarded: true }
            }, { quoted: mek });

        } catch (mediaError) {
            console.error("Media Send Failed:", mediaError.message);
            return reply(`⚠️ ${mediaType} link mil gaya, lekin bhejte waqt fail ho gaya. File shayad zyada badi hai ya link expired ho gaya hai.`); // Sending media failed
        }

    } else {
        // If the last argument is not 1 or 2
        return reply("⚠️ Kripya sahi selection number dein. (1 ya 2)\n\n*Options:*\n1. Audio (Gaana)\n2. Video\n\n*Udaharan:* .mdl Top Song 2"); // Prompt for correct number
    }

  } catch (e) {
    console.error("mdl General command error:", e.name, e.message);
    reply("❌ Command process karte samay koi aam truti hui. Kripya doosra query try karein."); // General unexpected error
  }
});
