const { cmd } = require('../command');
const axios = require('axios');

// --- API Endpoint (Using the user-provided IP address API) ---
const SPOTIFY_SEARCH_API = "http://129.212.228.144:4000/search/spotify?q=";

cmd({
    pattern: "spotifysearch",
    alias: ["ssearch", "sfind"],
    desc: "Spotify par gaane khojta aur list deta hai.", // Searches for songs on Spotify and lists them.
    category: "search",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { q, reply, from, prefix, command }) => {
    try {
        if (!q) {
            return reply(`❌ Kripya khojne ke liye gaane ka naam ya artist dein.\n\n*Udaharan:* ${prefix + command} sparks`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        await reply(`🔎 *Spotify* par "${q}" khoja jaa raha hai...`);

        // 1. Fetch Spotify data
        const url = `${SPOTIFY_SEARCH_API}${encodeURIComponent(q)}`;
        const response = await axios.get(url, { timeout: 15000 });
        const data = response.data;

        // 2. Check API response (Assuming API returns results in 'tracks.items')
        if (!data || !data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
            return reply("❌ Gaana khojne mein vifal rahe ya koi natija nahi mila.");
        }

        const tracks = data.tracks.items;
        const topResults = tracks.slice(0, 10); // Limit to top 10

        // 3. Format the results
        let resultMessage = '🎵 *Spotify Search Results* 🎵\n\n';
        
        topResults.forEach((track, index) => {
            const artists = track.artists.map(a => a.name).join(', ');
            const duration = new Date(track.duration_ms).toISOString().slice(14, 19);

            resultMessage += `*${index + 1}. ${track.name.trim()}*\n`;
            resultMessage += `   👤 Artist: ${artists}\n`;
            resultMessage += `   ⏱️ Duration: ${duration}\n`;
            resultMessage += `   🔗 Link: ${track.external_urls.spotify}\n\n`;
        });
        
        resultMessage += `\n_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;

        // 4. Send the result (with thumbnail from the first track)
        const thumbnail = topResults[0].album.images[0]?.url || 'https://i.imgur.com/empty.png';

        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: resultMessage
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Spotify Search Error:", e.message);
        // Handle IP address connection errors or generic failure
        reply(`⚠️ Spotify search karte samay truti aayi. Server ya IP address check karein: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
