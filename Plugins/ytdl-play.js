const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const headers = {
  accept: "application/json",
  "content-type": "application/json",
  "user-agent": "Mozilla/5.0 (Android)",
  referer: "https://ytmp3.gg/"
};

const poll = async (statusUrl) => {
  const { data } = await axios.get(statusUrl, { headers });
  if (data.status === "completed") return data;
  if (data.status === "failed") throw new Error(data.message);
  await new Promise(r => setTimeout(r, 2000));
  return poll(statusUrl);
};

async function convert(url, type, quality) {
  const { data: meta } = await axios.get("https://www.youtube.com/oembed", {
    params: { url, format: "json" }
  });

  const payload = {
    url,
    os: "android",
    output: {
      type,
      format: type === "audio" ? "mp3" : "mp4",
      ...(type === "video" && { quality })
    },
    ...(type === "audio" && { audio: { bitrate: quality } })
  };

  let init;
  try {
    init = await axios.post("https://hub.ytconvert.org/api/download", payload, { headers });
  } catch {
    init = await axios.post("https://api.ytconvert.org/api/download", payload, { headers });
  }

  const result = await poll(init.data.statusUrl);

  return {
    title: meta.title,
    thumb: meta.thumbnail_url,
    url: result.downloadUrl,
    filename: `${meta.title.replace(/[^\w\s-]/gi, '')}.${type === "audio" ? "mp3" : "mp4"}`
  };
}

// ───────────────── PLAY (search + mp3) ─────────────────
cmd({
  pattern: "play",
  react: "🎵",
  desc: "Search song and download mp3",
  category: "downloader",
  filename: __filename
}, async (conn, mek, m, { from, body, reply }) => {
  try {
    const text = body.split(" ").slice(1).join(" ");
    if (!text) return reply("Song name do");

    const search = await yts(text);
    if (!search.videos.length) return reply("No result found");

    const url = search.videos[0].url;
    reply("Downloading...");

    const data = await convert(url, "audio", "128k");

    await conn.sendMessage(from, {
      audio: { url: data.url },
      mimetype: "audio/mpeg",
      fileName: data.filename
    }, { quoted: mek });

  } catch (e) {
    reply(e.message);
  }
});


// ───────────────── YTMP3 (direct link) ─────────────────
cmd({
  pattern: "ytmp3",
  react: "🎧",
  desc: "Download mp3 from link",
  category: "downloader",
  filename: __filename
}, async (conn, mek, m, { from, body, reply }) => {
  try {
    const url = body.split(" ")[1];
    if (!url) return reply("Link do");

    reply("Downloading mp3...");

    const data = await convert(url, "audio", "128k");

    await conn.sendMessage(from, {
      audio: { url: data.url },
      mimetype: "audio/mpeg",
      fileName: data.filename
    }, { quoted: mek });

  } catch (e) {
    reply(e.message);
  }
});


// ───────────────── YTMP4 (video) ─────────────────
cmd({
  pattern: "ytmp4",
  react: "🎬",
  desc: "Download mp4 from link",
  category: "downloader",
  filename: __filename
}, async (conn, mek, m, { from, body, reply }) => {
  try {
    const url = body.split(" ")[1];
    if (!url) return reply("Link do");

    reply("Downloading video...");

    const data = await convert(url, "video", "720p");

    await conn.sendMessage(from, {
      video: { url: data.url },
      caption: data.title
    }, { quoted: mek });

  } catch (e) {
    reply(e.message);
  }
});
