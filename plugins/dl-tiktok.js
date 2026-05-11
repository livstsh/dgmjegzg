const { cmd } = require('../command');
const axios = require("axios");
const cheerio = require("cheerio");

// ───────── helpers ─────────
const cookieJoin = (arr = []) =>
  Array.isArray(arr) ? arr.map((v) => v.split(";")[0]).join("; ") : "";

const csrfPick = (html) =>
  html.match(/name="csrf_token"\s+value="([^"]+)"/i)?.[1] || null;

async function getSession() {
  const res = await axios.get('https://savett.cc/en1/download', {
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11)",
      Accept: "text/html,*/*"
    },
  });

  const csrf = csrfPick(res.data);
  const cookie = cookieJoin(res.headers["set-cookie"]);

  if (!csrf || !cookie) throw new Error("CSRF/Cookie failed");
  return { csrf, cookie };
}

async function postDownload(url, session) {
  const body = new URLSearchParams({ csrf_token: session.csrf, url });

  const res = await axios.post('https://savett.cc/en1/download', body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://savett.cc",
      Referer: "https://savett.cc/en1/download",
      Cookie: session.cookie,
      "User-Agent": "Mozilla/5.0 (Linux; Android 11)",
      Accept: "text/html,*/*",
    },
  });

  return res.data;
}

async function tiktokDl(url) {
  const session = await getSession();
  const html = await postDownload(url, session);
  const $ = cheerio.load(html);

  const nowm = [];
  $("#formatselect option").each((_, el) => {
    const label = $(el).text().toLowerCase();
    const raw = $(el).attr("value");
    if (!raw) return;

    try {
      const json = JSON.parse(raw.replace(/&quot;/g, '"'));
      if (label.includes("mp4") && !label.includes("watermark")) {
        nowm.push(...json.URL);
      }
    } catch {}
  });

  if (!nowm.length) throw new Error("Download link not found");
  return nowm[0];
}

// ───────── COMMAND ─────────
cmd({
  pattern: "tiktok",
  react: "🎬",
  desc: "Download TikTok video without watermark",
  category: "downloader",
  filename: __filename
}, async (conn, mek, m, { from, body, reply }) => {
  try {
    const url = body.split(" ")[1];
    if (!url) return reply("TikTok link do");

    reply("Downloading TikTok video...");

    const videoUrl = await tiktokDl(url);

    await conn.sendMessage(from, {
      video: { url: videoUrl },
      caption: "TikTok Downloader"
    }, { quoted: mek });

  } catch (e) {
    reply("Error: " + e.message);
  }
});
