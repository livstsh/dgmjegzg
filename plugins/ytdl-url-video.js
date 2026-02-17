const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");
const fetch = require("node-fetch");
const { cmd } = require('../command');

// --- FFmpeg Optimization Helper ---
function runFFmpeg(input, output) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-i", input,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-preset", "veryfast",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      output
    ]);
    ff.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error("FFmpeg optimization failed"));
    });
  });
}

// --- Y2Mate / CNV API Helper ---
async function y2mate(input) {
  let [query, quality] = input.split(",");
  quality = quality ? quality.trim() : "mp3";
  let link = query.trim();

  // Search if input is not a URL
  if (!/^https?:\/\//i.test(link)) {
    const searchRes = await fetch(`https://wwd.mp3juice.blog/search.php?q=${encodeURIComponent(link)}`);
    const searchData = await searchRes.json();
    if (!searchData.items || !searchData.items.length) throw new Error("Video not found!");
    link = `https://www.youtube.com/watch?v=${searchData.items[0].id}`;
  }

  // Fetch Meta & Key
  const meta = await (await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`)).json();
  const { key } = await (await fetch("https://cnv.cx/v2/sanity/key")).json();

  let format = quality === "mp3" ? "mp3" : "mp4";
  let videoQuality = quality === "mp3" ? "128" : quality;

  const body = new URLSearchParams({
    link,
    format,
    audioBitrate: "128",
    videoQuality,
    filenameStyle: "pretty",
    vCodec: "h264"
  }).toString();

  const convRes = await fetch("https://cnv.cx/v2/converter", {
    method: "POST",
    headers: {
      "key": key,
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Mozilla/5.0"
    },
    body
  });

  const conv = await convRes.json();
  return {
    type: format,
    title: meta.title,
    thumbnail: meta.thumbnail_url,
    filename: conv.filename,
    download: conv.url,
    source: link
  };
}

// --- Audio Command (yta) ---
cmd({
    pattern: "yta",
    alias: ["ytmp3", "ytaudio"],
    react: "🎧",
    desc: "Download YouTube audio.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("*Example:* .yta blue yung kai");
        await reply("⏳ *Processing audio... Please wait.*");

        const res = await y2mate(q + ",mp3");
        await conn.sendMessage(m.chat, {
            audio: { url: res.download },
            mimetype: "audio/mpeg",
            fileName: `${res.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: res.title,
                    body: "YouTube Audio Downloader",
                    thumbnailUrl: res.thumbnail,
                    sourceUrl: res.source,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// --- Video Command (ytv) ---
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "ytvideo"],
    react: "🎬",
    desc: "Download YouTube video (optimized for WA).",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("*Example:* .ytv https://youtu.be/... 720");
        let [url, quality] = q.split(" ");
        quality = quality || "720";
        
        await reply("⏳ *Optimizing video for WhatsApp...*");

        const res = await y2mate(url + "," + quality);
        const tempIn = path.join("./tmp", randomBytes(5).toString("hex") + ".mp4");
        const tempOut = tempIn.replace(".mp4", "_optimized.mp4");

        // Download to temp file
        const response = await fetch(res.download);
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(tempIn, buffer);

        // Run FFmpeg optimization
        await runFFmpeg(tempIn, tempOut);

        await conn.sendMessage(m.chat, {
            video: fs.readFileSync(tempOut),
            mimetype: "video/mp4",
            caption: `✅ *Title:* ${res.title}\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`,
            fileName: `${res.title}.mp4`
        }, { quoted: mek });

        // Cleanup
        if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
        if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});
        
