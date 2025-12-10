const axios = require('axios');
const { cmd } = require('../command');

const SEARCH_API = "https://apis.sandarux.sbs/api/download/sinhalasub/search?q=";
const DOWNLOAD_API = "https://apis.sandarux.sbs/api/movies-info/movie?name=";

cmd({
    pattern: "movie",
    alias: ["film", "cinesub"],
    desc: "Sinhala Subtitles ke saath filmein khojta aur download karta hai.", // Searches and downloads movies with Sinhala Subtitles.
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // 1. Send initial processing reaction
        await conn.sendMessage(from, { react: { text: `🕐`, key: mek.key } });

        if (!q) return await reply("❌ Kripya khojne ke liye film ka naam dein!"); // Please provide movie name to search

        await reply(`⏳ *"${q}"* film khoji jaa rahi hai...`); // Searching for movie...

        // 2. Search movie using the API
        const searchQuery = encodeURIComponent(q);
        const searchResponse = await axios.get(`${SEARCH_API}${searchQuery}`, { timeout: 15000 });

        if (!searchResponse.data.status || !searchResponse.data.result || searchResponse.data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: `❌`, key: mek.key } });
            return await reply("❗ Film nahi mili. Kripya doosra naam try karein."); // Movie not found.
        }

        // 3. Ambil hasil pehla aur page link
        const movieSearchResult = searchResponse.data.result[0];
        const moviePageLink = movieSearchResult.link;

        await reply(`✅ *${movieSearchResult.title}* mil gayi. Ab download link laaya jaa raha hai...`); // Found movie. Retrieving download link...

        // 4. Download information API call
        const downloadResponse = await axios.get(`${DOWNLOAD_API}${encodeURIComponent(moviePageLink)}`, { timeout: 20000 });

        if (!downloadResponse.data.success || !downloadResponse.data.result || !downloadResponse.data.result.downloadLinks) {
            await conn.sendMessage(from, { react: { text: `❌`, key: mek.key } });
            return await reply("❗ Film ka download link laane mein vifal rahe."); // Failed to retrieve download link.
        }

        // 5. Check and specifically grab the 720p link (index 1 in the array)
        if (downloadResponse.data.result.downloadLinks.length < 2) {
            await conn.sendMessage(from, { react: { text: `❌`, key: mek.key } });
            return await reply(`❗ Download link (HD 720p) is film ke liye uplabdh nahi hai.`); // Requested quality not available.
        }
        
        const downloadDetails = downloadResponse.data.result.downloadLinks[1]; // Assuming index 1 is the desired quality
        const movieInfo = downloadResponse.data.result;

        // 6. Kirim file film as a document
        const cleanedTitle = movieInfo.title.replace('| සිංහල උපසිරසි සමඟ', '').trim();

        await conn.sendMessage(
            from, {
                document: { url: downloadDetails.link },
                mimetype: "video/mp4",
                fileName: `${cleanedTitle} (${downloadDetails.quality}).mp4`,
                caption: `🎬 *${cleanedTitle}* (Quality: ${downloadDetails.quality})\n\nYeh aapki film hai. Mazey lein!\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`,
            }, { quoted: mek }
        );

        // 7. Kirim reaksi sukses terakhir
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });

    } catch (error) {
        console.error("Error in movie command:", error);
        await conn.sendMessage(from, { react: { text: `❌`, key: mek.key } });
        await reply("❌ Ek truti aa gayi. Kripya doosra naam try karein."); // General error.
    }
});
