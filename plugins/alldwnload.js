const { cmd } = require('../command');
// WARNING: ACRCloud module must be installed separately: npm install acrcloud
const acrcloud = require('acrcloud'); 
const config = require('../config');

// --- CRITICAL: ACRCloud Keys (Must be configured in config.js) ---
const ACR_HOST = config.ACR_HOST || "identify-ap-southeast-1.acrcloud.com";
const ACR_ACCESS_KEY = config.ACR_ACCESS_KEY || "ee1b81b47cf98cd73a0072a761558ab1"; // Placeholder key
const ACR_ACCESS_SECRET = config.ACR_ACCESS_SECRET || "ya9OPe8onFAnNkyf9xMTK8qRyMGmsghfuHrIMmUI"; // Placeholder secret

// Initialize ACRCloud client
const acr = new acrcloud({
    host: ACR_HOST,
    access_key: ACR_ACCESS_KEY,
    access_secret: ACR_ACCESS_SECRET,
});

// Function to convert milliseconds to mm:ss format
function toTime(ms) {
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    return [m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

async function whatmusic(buffer) {
    if (!ACR_ACCESS_KEY || ACR_ACCESS_KEY === "ee1b81b47cf98cd73a0072a761558ab1") {
        throw new Error("ACRCloud API Key and Secret missing/default. Kripya config mein sahi key set karein.");
    }
    
    // ACRCloud identifies the song from the audio buffer
    const data = (await acr.identify(buffer)).metadata;
    if (!data?.music || data.music.length === 0) throw new Error("Gaane ka data nahi mila.");

    return data.music.map((a) => ({
        title: a?.title || "Unknown",
        artist: a?.artists?.[0]?.name || "Unknown",
        score: a?.score || 0,
        release: a?.release_date ? new Date(a.release_date).toLocaleDateString("id-ID") : "Unknown",
        duration: a?.duration_ms ? toTime(a.duration_ms) : "00:00",
        url: Object.keys(a?.external_metadata || {}).map((i) => {
            if (i === "youtube") return `https://youtu.be/${a.external_metadata[i].vid}`;
            if (i === "spotify") return `https://open.spotify.com/track/${a.external_metadata[i].track.id}`;
            return "";
        }).filter(Boolean),
    }));
}

let handler = async (conn, mek, m, { reply, from }) => {
    // Determine the target message (reply or current message if it contains audio)
    const target = m.quoted || m; 
    
    // Check if the target message is audio
    const isAudio = target.mimetype && /audio/.test(target.mimetype);

    if (!isAudio) {
        return reply(`*❌ Oops!* Kripya us audio file ya voice note ko reply karein jiska gaana aap pehchanna chahte hain.`);
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await reply('⏳ Audio analysis shuru ho gaya hai...');

    try {
        // Download the audio buffer (using m.quoted download logic)
        const buffer = await conn.downloadMediaMessage(target);
        
        // Perform music recognition
        const data = await whatmusic(buffer);

        let caption = `*🎤 Gaana Pehchana Gaya (ACRCloud)* 🎶\n\n`;
        for (const result of data) {
            caption += `*Judul:* ${result.title}\n`;
            caption += `*Artis:* ${result.artist}\n`;
            caption += `*Durasi:* ${result.duration}\n`;
            caption += `*Released:* ${result.release}\n`;
            caption += `*Sumber:* ${result.url.join("\n") || "Koi link nahi mila"}\n\n`;
        }
        
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("Shazam Command Error:", err);
        // Custom error message for the user
        let errorMessage = err.message.includes('ACRCloud') ? '❌ Service Key Error ya module missing hai.' : `❌ Maaf! ${err.message}`;
        await reply(errorMessage);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
};

cmd({
    pattern: "whatmusic",
    alias: ["shazam", "acrmusic"],
    desc: "Reply kiye gaye audio se gaane ka naam pehchanta hai.", // Recognizes song title from replied audio.
    category: "tools",
    react: "🎵",
    filename: __filename
}, handler);

module.exports = handler;
