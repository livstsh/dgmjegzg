const { cmd } = require('../command');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

// --- Helpers Functions ---

/**
 * Convert audio buffer to OGG/Opus (WhatsApp-compatible)
 */
async function toVN(inputBuffer) {
    return new Promise((resolve, reject) => {
        const inStream = new PassThrough();
        const outStream = new PassThrough();
        const chunks = [];
        inStream.end(inputBuffer);

        ffmpeg(inStream)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioBitrate('48k')
            .audioChannels(1)
            .audioFrequency(48000)
            .outputOptions([
                '-map_metadata', '-1',
                '-application', 'voip',
                '-compression_level', '10'
            ])
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(outStream, { end: true });

        outStream.on('data', c => chunks.push(c));
    });
}

/**
 * Generate WhatsApp-style waveform
 */
async function generateWaveform(inputBuffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const inputStream = new PassThrough();
        inputStream.end(inputBuffer);
        const chunks = [];

        ffmpeg(inputStream)
            .audioChannels(1)
            .audioFrequency(16000)
            .format("s16le")
            .on("error", reject)
            .on("end", () => {
                const rawData = Buffer.concat(chunks);
                const samples = rawData.length / 2;
                const amplitudes = [];
                for (let i = 0; i < samples; i++) {
                    let val = rawData.readInt16LE(i * 2);
                    amplitudes.push(Math.abs(val) / 32768);
                }
                let blockSize = Math.floor(amplitudes.length / bars);
                let avg = [];
                for (let i = 0; i < bars; i++) {
                    let block = amplitudes.slice(i * blockSize, (i + 1) * blockSize);
                    avg.push(block.reduce((a, b) => a + b, 0) / (block.length || 1));
                }
                let max = Math.max(...avg);
                let normalized = avg.map(v => Math.floor((v / (max || 1)) * 100));
                resolve(Buffer.from(new Uint8Array(normalized)).toString("base64"));
            })
            .pipe(new PassThrough(), { end: true })
            .on("data", chunk => chunks.push(chunk));
    });
}

async function searchYT(q) {
    const res = await axios.get(`https://test.flvto.online/search/?q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', origin: 'https://v5.ytmp4.is' }
    });
    if (!res.data.items || !res.data.items.length) throw new Error('No results');
    return res.data.items[0];
}

async function getDownloadLink(id) {
    const res = await axios.post('https://ht.flvto.online/converter', { id, fileType: 'mp3' }, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' }
    });
    return res.data.link;
}

// --- Main Command ---

cmd({
    pattern: "play2",
    alias: ["music", "audio", "song"],
    react: "🎶",
    desc: "Advanced YT Play with Waveform",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("⚠ Masukan Judul Lagu!");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Search & Get Data
        const info = await searchYT(q);
        const dlUrl = await getDownloadLink(info.id);

        // Fetch Audio Buffer
        const audioRes = await axios.get(dlUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(audioRes.data);

        // Process Audio (Fixed Voice Note Issue)
        const pttBuffer = await toVN(buffer);
        const waveform = await generateWaveform(pttBuffer);

        // Send Voice Note with Waveform & AdReply
        await conn.sendMessage(from, {
            audio: pttBuffer,
            waveform: Buffer.from(waveform, 'base64'),
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
            contextInfo: {
                externalAdReply: {
                    title: info.title,
                    body: `Duration: ${info.duration} | Views: ${info.viewCount}`,
                    mediaType: 1,
                    thumbnailUrl: info.thumbMedium,
                    sourceUrl: `https://youtu.be/${info.id}`,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Error: API limit ya network issue.");
    }
});
                
