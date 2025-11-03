const fetch = require("node-fetch");
const { cmd } = require("../command");

cmd({
  pattern: "ysearch",
  alias: ["yfind", "ys"],
  desc: "Search for YouTube videos using a query.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {
  if (!args[0]) {
    return reply("🎥 What do you want to search on YouTube?\n\n*Usage Example:*\n.ytsearch <query>");
  }

  const query = args.join(" ");
  await store.react('⌛');

  try {
    reply(`🔎 Searching YouTube for: *${query}*`);
    
    const response = await fetch(`https://silva-ytapi.onrender.com/api/download/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      await store.react('❌');
      return reply("❌ No results found for your query. Please try with a different keyword.");
    }

    // Get up to 5 top results
    const results = data.results.slice(0, 5);

    for (const video of results) {
      const message = `🎬 *YouTube Video Result*:\n\n`
        + `*• Title*: ${video.title}\n`
        + `*• Channel*: ${video.channel || 'Unknown'}\n`
        + `*• Duration*: ${video.duration || "Unknown"}\n`
        + `*• URL*: ${video.url}\n\n`
        + `━━━━━━━━━━━━━━\n⚡ Powered by DR KAMRAN YTSearch API`;

      if (video.thumbnail) {
        await conn.sendMessage(from, {
          image: { url: video.thumbnail },
          caption: message
        }, { quoted: m });
      } else {
        await conn.sendMessage(from, { text: message }, { quoted: m });
      }
    }

    await store.react('✅');
  } catch (error) {
    console.error("Error in ytsearch command:", error);
    await store.react('❌');
    reply("❌ An error occurred while searching YouTube. Please try again later.");
  }
});
     
