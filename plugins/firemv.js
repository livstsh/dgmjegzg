const axios = require("axios");
const yts = require("yt-search");
const { generateWAMessageFromContent, prepareWAMessageMedia } = require("@whiskeysockets/baileys");
// Import the command utility for framework compatibility
const { cmd } = require("../command"); 

const qualities = [
  { q: "144", txt: "📹 144p" },
  { q: "240", txt: "📹 240p" },
  { q: "360", txt: "📹 360p" },
  { q: "480", txt: "📹 480p" },
  { q: "720", txt: "📹 720p HD" },
  { q: "1080", txt: "📹 1080p FHD" },
  { q: "mp3", txt: "🎵 Audio mp3" }
];
const qualitySet = new Set(qualities.map(v => v.q));

cmd({
    pattern: "playe", // Main command pattern (renamed to play)
    alias: ["songe", "ytplaye", "yte"], // Alias commands
    desc: "Search YouTube videos and download them or convert them to audio.", // Description
    react: '✅', // Reaction upon success
    category: 'downloader', // Command category
    filename: __filename
}, async (conn, m, store, { usedPrefix, command, text, reply, args }) => { 
  try {
    // Avoid errors if text is undefined
    const raw = (text || "").trim();

    // Split words
    const parts = raw.split(/\s+/).filter(Boolean);

    // Try to detect if the user clicked a button (payload contains quality + URL)
    let format = null;
    let url = null;

    if (parts.length >= 2) {
      // Case 1: "144 https://..." or "mp3 https://..." (Quality is the first word)
      if (qualitySet.has(parts[0])) {
        format = parts[0];
        url = parts.slice(1).join(" ");
      }
      // Case 2: "play 144 https://..." (Quality is the second word)
      else if (qualitySet.has(parts[1])) {
        format = parts[1];
        url = parts.slice(2).join(" ");
      }
    }

    // If we detected the user requested a download (button click or explicit quality/URL)
    if (format && url) {
      await m.react("⏳");
      // Validate the URL is complete
      if (!/^https?:\/\//.test(url)) {
        return reply("❌ Invalid link. Please send a correct YouTube link.");
      }

      try {
        // API call to download the video/audio
        const { data } = await axios.get(`https://dark-api-x.vercel.app/api/v1/download/youtube`, {
          params: { url, format },
          timeout: 20000 // 20 seconds timeout
        });

        if (!data || !data.status || !data.data?.download) {
          return reply("❌ Failed to get the download link from the API.");
        }

        const { title, type, download, duration } = data.data;

        if (type === "video") {
          // Send video file
          await conn.sendMessage(
            m.chat,
            {
              video: { url: download },
              caption: `✅ *Download Complete!*\n🎬 *Title:* ${title}\n📹 *Quality:* ${format === "mp3" ? "Audio" : format + "p"}\n🕒 *Duration:* ${duration ?? "N/A"}`
            },
            { quoted: m }
          );
        } else {
          // Send audio file (mp3)
          await conn.sendMessage(
            m.chat,
            {
              audio: { url: download },
              mimetype: "audio/mpeg",
              fileName: `${title}.mp3`,
              caption: `✅ *Download Complete!*\n🎵 *Title:* ${title}\n🎧 *Type:* Audio`
            },
            { quoted: m }
          );
        }

        return await m.react("✅");
      } catch (err) {
        console.error("Download error:", err?.message || err);
        return reply("❌ An error occurred during the download from the API.");
      }
    }

    // -------------------
    // If not a download request -> Perform search and show quality buttons
    // -------------------
    if (!raw) {
      return reply(`❗ *Enter the song or video name*\nExample:\n${usedPrefix}${command} Never Gonna Give You Up`);
    }

    await m.react("🔎");

    const search = await yts(raw);
    const video = (search && (search.videos || search.all) && (search.videos[0] || search.all[0]));
    if (!video) return reply("❌ No results found.");

    const link = video.url;
    const caption = `🎬 *${video.title}*\n👁️ ${video.views} views\n⏳ ${video.timestamp}\n📆 ${video.ago}\n🔗 ${link}`;

    // Prepare thumbnail for the interactive message header
    const { imageMessage } = await prepareWAMessageMedia(
      { image: { url: video.thumbnail } },
      { upload: conn.waUploadToServer }
    );

    // Create buttons where the ID sends back: "<prefix><command> <quality> <url>"
    const buttons = qualities.map(v => ({
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: v.txt,
        // The payload that the button sends back to the bot
        id: `${usedPrefix}${command} ${v.q} ${link}` 
      })
    }));

    // Construct the Interactive Message
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: caption },
              footer: { text: "❖ Select the desired quality" },
              header: {
                hasMediaAttachment: true,
                imageMessage
              },
              nativeFlowMessage: {
                buttons
              }
            }
          }
        }
      },
      { userJid: conn.user.jid, quoted: m }
    );

    // Send the interactive message
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react("✅");

  } catch (err) {
    console.error("Handler error:", err);
    try { await m.react("❌"); } catch(e) {}
    return reply("❌ An unexpected error occurred during processing.");
  }
});
