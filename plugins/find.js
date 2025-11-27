const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { cmd } = require('../command');
const config = require('../config');

const AUDD_API_KEY = '08e11fca53d60e4c81254e9dbc4f42b9'; // Replace this with your actual key

cmd({
    pattern: "find",
    alias: ["musicid", "findsong"],
    use: '.find (reply to audio)',
    desc: "Identify music from audio using kamran API",
    category: "media",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        const mime = (quoted?.mimetype || "");
        if (!quoted || !mime.includes("audio")) {
            return reply("🎵 Please reply to an audio or voice note.");
        }

        const audioBuffer = await quoted.download(); // Download the audio
        const tempPath = './temp_song.mp3';
        fs.writeFileSync(tempPath, audioBuffer);

        const form = new FormData();
        form.append('api_token', AUDD_API_KEY);
        form.append('file', fs.createReadStream(tempPath));
        form.append('return', 'apple_music,spotify');

        const res = await axios.post('https://api.audd.io/', form, {
            headers: form.getHeaders()
        });

        fs.unlinkSync(tempPath); // Cleanup temp file

        const result = res.data.result;
        if (!result) {
            return reply("❌ No match found for this audio.");
        }

        const { title, artist, album, release_date, label, spotify } = result;
        const msg = `
🎵 *sᴏɴɢ ʀᴇᴄᴏɢɴɪᴢᴇᴅ*
*ᴛɪᴛʟᴇ:* ${title}
*ᴀʀᴛɪsᴛ:* ${artist}
*ᴀʟʙᴜᴍ:* ${album || 'N/A'}
*ʀᴇʟᴇᴀsᴇ:* ${release_date || 'N/A'}
*ʟᴀʙᴇʟ:* ${label || 'N/A'}
${spotify?.external_urls?.spotify ? `🔗 *sᴘᴏᴛɪғʏ:* ${spotify.external_urls.spotify}` : ''}
        `.trim();

        reply(msg);

    } catch (e) {
        console.error("kamran Command Error:", e);
        reply(`❌ An error occurred: ${e.message}`);
    }
});
    
