const fetch = require("node-fetch");
// Assuming the command infrastructure utility is available at this path
const { cmd } = require("../command"); 

cmd({
  pattern: "tiktok",
  alias: ["tiktoks", "tiks", "tiktoksearch", "tiktokdl"],
  desc: "Download a TikTok video from a link or search for videos using a keyword.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {
  // Check if input is provided
  if (!args[0]) {
    return reply("🌸 Please provide a TikTok link or a search query.\n\n*Usage Example (Link):*\n.tiktok https://vm.tiktok.com/ZM.../\n*Usage Example (Search):*\n.tiktok Funny Cats");
  }

  const input = args.join(" ");
  await store.react('⌛');

  try {
    // --- URL Validation/Detection Logic ---
    let isUrl = false;
    let urlObject;
    
    // Check if the input looks like a valid TikTok URL
    try {
        urlObject = new URL(input);
        // Basic check for common TikTok domains
        if (urlObject.hostname.includes("tiktok.com") || urlObject.hostname.includes("vt.tiktok.com") || urlObject.hostname.includes("vm.tiktok.com")) {
            isUrl = true;
        }
    } catch (e) {
        // Input is not a valid URL
        isUrl = false;
    }

    if (isUrl) {
      // --- Download Logic (If input is a URL) ---
      reply(`📥 Downloading TikTok video from link: *${input}*`);
      
      // Download API endpoint using the provided URL
      const downloadApiUrl = `https://apis-starlights-team.koyeb.app/starlight/tiktok?url=${encodeURIComponent(input)}`;
      
      const response = await fetch(downloadApiUrl);
      
      if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();

      // Check if download data is valid and contains the video URL
      if (!data || !data.data || !data.data.nowm) {
          await store.react('❌');
          return reply("❌ Failed to download the video from the link. Please check the URL or it might be private.");
      }

      const video = data.data;
      const message = `✅ *TikTok Video Download Successful*\n\n`
          + `*• Title*: ${video.title || 'Unknown'}\n`
          + `*• Author*: ${video.author || 'Unknown'}\n`
          + `*• URL*: ${input}\n\n`;

      // Send the video without watermark
      await conn.sendMessage(from, {
          video: { url: video.nowm }, 
          caption: message
      }, { quoted: m });
      
      await store.react('✅');

    } else {
      // --- Search Logic (If input is a Text Query) ---
      reply(`🔎 Searching TikTok for: *${input}*`);

      // Search API endpoint
      const searchApiUrl = `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(input)}`;
      
      const response = await fetch(searchApiUrl);
      
      if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.data || data.data.length === 0) {
          await store.react('❌');
          return reply("❌ No results found for your query. Please try with a different keyword.");
      }

      // Get up to 7 random results for variety
      const results = data.data.slice(0, 7).sort(() => Math.random() - 0.5);

      for (const video of results) {
          const message = `🌸 *TikTok Video Search Result*:\n\n`
              + `*• Title*: ${video.title}\n`
              + `*• Author*: ${video.author || 'Unknown'}\n`
              + `*• Duration*: ${video.duration || "Unknown"}\n`
              + `*• URL*: ${video.link}\n\n`;

          if (video.nowm) {
              await conn.sendMessage(from, {
                  video: { url: video.nowm },
                  caption: message
              }, { quoted: m });
          } else {
              reply(`❌ Failed to retrieve video without watermark for *"${video.title}"*.`);
          }
      }

      await store.react('✅');
    }
  } catch (error) {
    console.error("Error in TikTok command:", error.message);
    await store.react('❌');
    reply("❌ An error occurred while using the TikTok service. Please try again later.");
  }
});
