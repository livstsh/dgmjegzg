// filename: movie.js
const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: 'movie',
  desc: 'Search any movie from TMDb',
  use: '.movie <movie name>',
  category: 'search',
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  try {
    const query = args.join(' ');
    if (!query) return reply('Please enter a movie name. Example: .movie Pathaan');

    const apiKey = 'YOUR_TMDB_API_KEY'; // Replace with your TMDb API Key
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en`;

    const { data } = await axios.get(url);
    if (!data.results || data.results.length === 0)
      return reply('No movie found 😔');

    const movie = data.results[0];
    const msg = `
🎬 Title: ${movie.title || 'Unknown'}
📅 Year: ${movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}
⭐ Rating: ${movie.vote_average || 'N/A'}/10
📝 Overview: ${movie.overview || 'No details available'}

ᴘᴏᴡᴇʀᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ
🔗 More info: https://www.themoviedb.org/movie/${movie.id}
    `;

    if (movie.poster_path) {
      const image = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      await conn.sendMessage(m.chat, { image: { url: image }, caption: msg }, { quoted: mek });
    } else {
      await reply(msg);
    }

  } catch (e) {
    console.log(e);
    reply('⚠️ Unable to fetch movie information.');
  }
});