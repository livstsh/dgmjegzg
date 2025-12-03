const { cmd } = require('../command');
const yts = require('yt-search'); // Only keeping yt-search for simplicity

cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    use: '.yts [query]',
    react: "🔎",
    desc: "YouTube par keyword se videos khojta hai aur unki list deta hai.", // Searches videos on YouTube by keyword and lists them.
    category: "search",
    filename: __filename
},
async(conn, mek, m, {from, q, reply}) => {
try{
    if (!q) return reply('❌ Kripya khojne ke liye kuch shabd dein.'); // Please provide words to search

    await reply(`⏳ *"${q}"* ke liye YouTube par khoja ja raha hai...`); // Searching on YouTube...
    
    let searchResults;
    try {
        // Use yt-search library to get results
        searchResults = await yts(q);
    } catch(e) {
        console.error("YouTube search error:", e);
        return await reply('❌ YouTube search karte samay truti aayi!'); 
    }
    
    // Filter out videos and limit to top 10 results
    const videos = searchResults.videos.slice(0, 10);

    if (videos.length === 0) {
        return await reply(`🤷‍♀️ *"${q}"* ke liye koi video natija nahi mila.`);
    }

    let resultMessage = '📺 *YouTube Search Results* 📺\n\n';
    
    // Format the results
    videos.map((video, index) => {
        resultMessage += `*${index + 1}. ${video.title.trim()}*\n`;
        resultMessage += `   🔗 Link: ${video.url}\n`;
        resultMessage += `   ⏱️ Duration: ${video.timestamp}\n`;
        resultMessage += `   👁️ Views: ${video.views}\n`;
        resultMessage += `   👤 Channel: ${video.author.name}\n\n`;
    });
    
    resultMessage += `\n_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN MD_`;

    await conn.sendMessage(from , { text: resultMessage }, { quoted: mek } );

} catch (e) {
    console.error("YTS Command General Error:", e);
    reply('⚠️ YTS command process karte samay truti aayi.');
}
});
