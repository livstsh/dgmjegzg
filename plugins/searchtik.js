const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data'); // Assuming form-data is available

// --- Core API Function ---
async function searchTikWM(query) {
  try {
    const form = new FormData();
    form.append("keywords", query);
    form.append("count", 20); // Limiting to 20 for cleaner search result
    form.append("cursor", 0);
    form.append("web", 1);
    form.append("hd", 2);

    // POST request to TikWM search API
    const { data: res } = await axios.post("https://tikwm.com/api/feed/search", form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 20000
    });

    if (!res?.data?.videos) throw new Error("API se koi video natija nahi mila.");
    
    // Format the videos for user presentation
    return res.data.videos.map(v => ({
      id: v.video_id,
      title: v.title,
      cover: `https://tikwm.com${v.cover}`,
      play: `https://tikwm.com${v.play}`,
      music: `https://tikwm.com${v.music}`,
      duration: v.duration,
      author: {
        nickname: v.author.nickname,
        unique_id: v.author.unique_id,
      },
      stats: {
        play_count: v.play_count,
        digg_count: v.digg_count,
      },
    })) || [];
  } catch (error) {
    console.error("TikWM Search Error:", error.message);
    throw new Error(`❌ Video khojne mein vifal rahe. ${error.message}`);
  }
}


// --- MAIN COMMAND HANDLER ---
cmd({
    pattern: "ttsearch2",
    alias: ["tiktoksearch2", "tks2"],
    desc: "TikTok par video keywords se khojta hai.", // Searches videos on TikTok by keyword.
    category: "search",
    react: "🔎",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q) {
            return reply(`❌ Kripya khojne ke liye kuch shabd dein.\n\n*Udaharan:* ${prefix + command} anita tumbler`);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply(`⏳ *"${q}"* ke liye TikTok par khoja jaa raha hai...`);

        // 1. Perform the search
        const videos = await searchTikWM(q);

        if (videos.length === 0) {
            return reply(`🤷‍♀️ Maaf karein, *"${q}"* se sambandhit koi video nahi mila.`);
        }

        // 2. Format and Send Results
        let resultMessage = `🎬 *TikTok Search Results* 🎬\n\n`;
        
        const topVideos = videos.slice(0, 10); // Limit to 10 for cleaner display
        
        topVideos.forEach((v, i) => {
            resultMessage += `*${i + 1}. ${v.title.trim() || 'No Title'}*\n`;
            resultMessage += `   👤 Author: ${v.author.nickname} (@${v.author.unique_id})\n`;
            resultMessage += `   ⏱️ Duration: ${v.duration || 'N/A'}s\n`;
            resultMessage += `   ❤️ Likes: ${v.stats.digg_count?.toLocaleString() || '0'}\n\n`;
        });
        
        resultMessage += `\n_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;

        // Send the thumbnail of the first video and the result list
        const firstVideo = topVideos[0];
        
        await conn.sendMessage(from, {
            image: { url: firstVideo.cover },
            caption: resultMessage
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("TT Search Command Error:", e.message);
        reply(`⚠️ Video khojte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
