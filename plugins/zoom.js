const axios = require("axios");
const yts = require("yt-search");
const config = require("../config"); 
const { cmd } = require("../command");

cmd({
  pattern: "ytdltest",
  alias: ["apidump"],
  desc: "Searches for a video and prints the RAW JSON response from the ytdl API for debugging.",
  category: "utility",
  react: "⚙️",
  filename: __filename 
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a video title to test.");
    }

    // 1. Search video on YouTube
    const search = await yts(q);
    const video = search?.videos?.[0];

    if (!video) {
      return reply("❌ No video results found.");
    }

    const { url, title } = video;
    
    await reply(`🔍 *Testing API for:* ${title}\n*URL:* ${url}\n\n_Calling external API..._`);
    
    // 2. Call the external 'ytdl' API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(apiUrl);

        // 3. Print the RAW JSON response
        const jsonResponse = JSON.stringify(res.data, null, 2);

        await conn.sendMessage(from, {
            text: `✅ *API Response Dump (Raw JSON)*\n\n\`\`\`json\n${jsonResponse}\n\`\`\``
        }, { quoted: mek });
        
        // Check if the expected result field is present
        if (res.data.result && typeof res.data.result === 'string') {
             await reply("🎉 *Success Tip:* The API returned a result string! You might need to check if that URL is valid.");
        } else {
             await reply("⚠️ *Warning:* The 'result' field is missing or not a string. The API is not behaving as expected.");
        }


    } catch (apiError) {
        // Handles connection errors
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ API Connection Failed. Status: ${apiError.response?.status || 'Connection Error'}.`);
    }

  } catch (e) {
    console.error("ytdltest General command error:", e.name, e.message);
    reply("❌ A general error occurred during search or setup.");
  }
});
