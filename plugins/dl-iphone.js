const { cmd } = require('../command');
const fetch = require('node-fetch'); // Assuming node-fetch is available
const cheerio = require('cheerio'); // Assuming cheerio is available

// --- IMDb Scraper Function ---
async function SearchIMDb(query) {
  try {
    const searchUrl = `https://m.imdb.com/find/?q=${encodeURIComponent(query)}&ref_=tt_nv_srb_sm`;
    
    // Using mobile IMDb URL for easier scraping
    const res = await fetch(searchUrl, { timeout: 15000 });
    const html = await res.text();

    const $ = cheerio.load(html);
    const results = [];

    // Targeting the main search result containers
    $(".ipc-metadata-list-summary-item").each((i, el) => {
      // Title
      const title =
        $(el).find(".ipc-metadata-list-summary-item__t").text().trim() ||
        $(el).find("h3").text().trim();

      // Year/Type (usually the first list item in the metadata)
      const year = $(el)
        .find(".ipc-metadata-list-summary-item__li")
        .first()
        .text()
        .trim();

      // Link
      const link =
        "https://m.imdb.com" + $(el).find("a").first().attr("href");

      // Poster/Image URL
      const poster = $(el).find("img").attr("src") || null;

      if (title && link) {
          results.push({
            title,
            year,
            link,
            ...(poster && { poster }),
          });
      }
    });

    return { query, count: results.length, results };
  } catch (err) {
    console.error("IMDb Scraping Error:", err);
    // Throw error so main handler can catch and inform user
    throw new Error("IMDb website tak pahunchne mein vifal rahe ya scraping fail ho gayi."); 
  }
}

cmd({
    pattern: "imdb",
    alias: ["movieinfo", "filmsearch"],
    desc: "IMDb par film aur TV show ki jaankari khojta hai.", // Searches IMDb for movie and TV show information.
    category: "search",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command }) => {
    try {
        if (!q) {
            return reply(`❌ Kripya us film ya show ka naam dein jise aap khojna chahte hain.\n\n*Udaharan:* ${prefix + command} Agak Laen`);
        }

        await reply(`⏳ *"${q}"* ke liye IMDb par khoja jaa raha hai...`);

        // 1. Perform the search
        const searchData = await SearchIMDb(q);

        if (searchData.count === 0) {
            return reply(`🤷‍♀️ Maaf karein, *"${q}"* se sambandhit koi natija nahi mila.`);
        }

        // 2. Format the search results
        const topResults = searchData.results.slice(0, 5); // Limit to top 5 results

        let resultMessage = `
🎬 *IMDb Search Results* 🎬
*Total Natije:* ${searchData.count}
----------------------------------------
`;

        topResults.forEach((item, index) => {
            resultMessage += `\n*${index + 1}. ${item.title}* (${item.year || 'N/A'})`;
            resultMessage += `\n   🔗 *Link:* ${item.link}`;
            resultMessage += `\n   🖼️ *Poster:* ${item.poster ? 'Available' : 'N/A'}`;
        });
        
        resultMessage += `\n\n_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;

        // 3. Send the image (poster of the first result, if available) and the text
        const firstResult = topResults[0];

        if (firstResult.poster) {
            await conn.sendMessage(
                from,
                {
                    image: { url: firstResult.poster },
                    caption: resultMessage
                },
                { quoted: mek }
            );
        } else {
             await conn.sendMessage(from, { text: resultMessage }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("IMDb Command General Error:", e.message);
        reply(`⚠️ Search karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
