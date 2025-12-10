const { cmd } = require("../command"); // Import the command utility
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const {
    tmpdir
} = require('os');
const {
    join
} = require('path');

/**
 * Identifies a song from an audio file using the Aha-Music (doreso.com) API.
 * @param {string} path Path to the audio file.
 * @returns {Promise<object>} The API response.
 */
async function aha_music(path) {
    const form = new FormData();
    // Using a stream is more memory-efficient for file uploads
    form.append('file', fs.createReadStream(path));
    // The sample size is crucial for the API to work
    form.append('sample_size', 118784); 

    const {
        data
    } = await axios.post(
        'https://api.doreso.com/humming',
        form, {
            headers: {
                ...form.getHeaders(),
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'accept': 'application/json, text/plain, */*',
                'origin': 'https://www.aha-music.com',
                'referer': 'https://www.aha-music.com/'
            },
            // Allow large files (though the service usually limits size)
            maxBodyLength: Infinity,
            maxContentLength: Infinity 
        }
    );

    return data;
}

cmd({
    pattern: "findsong",
    alias: ["whatsong", "shazam"],
    desc: "Find the title of a song by replying to an audio message.",
    react: 'ðŸŽ¶',
    category: 'tools',
    filename: __filename
}, async (conn, m, store, { reply }) => {
    
    // Check for a quoted message (the audio file)
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    if (!/audio/.test(mime)) {
        return reply('Please reply to an audio message (voice note or audio file) to find the song.');
    }

    await store.react('ðŸŽ¶');
    let tmpPath;
    
    try {
        // 1. Download the media content
        const media = await q.download();
        
        // 2. Save the media to a temporary file
        tmpPath = join(tmpdir(), `${Date.now()}.mp3`);
        await fs.promises.writeFile(tmpPath, media);

        // 3. Call the song identification API
        const result = await aha_music(tmpPath);

        // 4. Process the result
        if (result && result.data && result.data.title) {
            const {
                title,
                artists
            } = result.data;
            
            const caption = `
ðŸŽµ *Song Identified!*

*Title:* ${title}
*Artist:* ${artists}
            `.trim();
            
            await reply(caption);
            await store.react('âœ…');
        } else {
            await reply('â“ Could not identify the song. The audio might be too short or unclear.');
            await store.react('â“');
        }
    } catch (e) {
        console.error("FINDSONG ERROR:", e);
        await reply('âŒ An error occurred while processing your request. The API may be unavailable or the audio file format is unsupported.');
        await store.react('âŒ');
    } finally {
        // 5. Clean up the temporary file, ensuring the bot doesn't fill up storage
        if (tmpPath && fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
        }
    }
});
