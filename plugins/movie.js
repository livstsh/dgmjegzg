const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pirate",
    alias: ["movie", "piratedl"],
    react: "🏴‍☠️",
    desc: "Download movies via Pirate API",
    category: "download",
    use: ".pirate <movie_page_url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        // Validation
        if (!q) return reply("❌ Please provide a valid movie link!\nExample: .pirate https://pirate-site.com/movie-id");
        if (!q.includes("http")) return reply("❌ Invalid URL format!");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // API Call
        const apiUrl = `https://arslan-apis.vercel.app/movie/pirate/movie?url=${encodeURIComponent(q.trim())}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if data is valid (Adjust based on actual API JSON structure)
        if (!data || !data.status) {
            return reply("❌ Failed to fetch movie details. Link expire ho sakta hai ya API down hai.");
        }

        const movie = data.result;
        
        // Movie Details Caption
        let movieInfo = `🎬 *PIRATE MOVIE DOWNLOADER*\n\n`;
        movieInfo += `📌 *Title:* ${movie.title || "Unknown"}\n`;
        movieInfo += `📅 *Year:* ${movie.year || "N/A"}\n`;
        movieInfo += `⭐ *Rating:* ${movie.rating || "N/A"}\n`;
        movieInfo += `🕒 *Runtime:* ${movie.runtime || "N/A"}\n`;
        movieInfo += `🎭 *Genres:* ${movie.genres || "N/A"}\n\n`;
        movieInfo += `📥 *Download Links:* \n`;

        // Loop through available qualities/links
        if (movie.downloads && movie.downloads.length > 0) {
            movie.downloads.forEach((dl, index) => {
                movieInfo += `🔹 ${index + 1}. ${dl.quality} (${dl.size}) - [Link](${dl.url})\n`;
            });
        } else if (movie.download_url) {
            movieInfo += `🔗 [Click Here to Download](${movie.download_url})\n`;
        } else {
            movieInfo += `❌ No direct download links found.`;
        }

        movieInfo += `\n> © PROVA-MD ❤️`;

        // Send Movie Poster with Details
        await conn.sendMessage(from, {
            image: { url: movie.poster || movie.thumbnail || 'https://files.catbox.moe/d2n3fc.jpg' },
            caption: movieInfo,
            contextInfo: {
                externalAdReply: {
                    title: movie.title || "Movie Downloader",
                    body: "PROVA-MD Pirate Service",
                    thumbnailUrl: movie.poster || movie.thumbnail,
                    sourceUrl: q,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Pirate API Error:", e);
        reply("❌ An error occurred: " + (e.message || "API Timeout"));
    }
});
      
