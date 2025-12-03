const { cmd } = require("../command");
const axios = require('axios');
const cheerio = require('cheerio'); // Assuming cheerio is available in the environment

// --- Snack Video Downloader Core Function (Scraping) ---
async function snackDownload(url) {
  try {
    // API uses form data submission to imitate a browser action
    const payload = new URLSearchParams({
      id: url,
      locale: "en",
      // These are necessary headers/fields for the site to process the request
      "ic-request": "true",
      "ic-element-id": "main_page_form",
      "ic-id": "1",
      "ic-target-id": "active_container",
      "ic-trigger-id": "main_page_form",
      "ic-current-url": "/",
      "ic-select-from-response": "#id1",
      method: "POST",
    });

    const { data } = await axios.post(
      "https://getsnackvideo.com/results",
      payload.toString(),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
        },
        timeout: 20000 // Extended timeout for scraping
      }
    );

    if (!data) throw new Error("Scraping ke dauran data prapt nahi hua.");

    // Load the returned HTML content
    const $ = cheerio.load(data);

    // Find the download link without watermark
    const download = $(".download_link.without_watermark").attr("href");
    
    // Attempt to extract title/description from the scraped page (Optional)
    const title = $("p.infotext").first().text().trim() || 'Snack Video';

    if (!download) throw new Error("Download link nikalne mein vifal rahe.");

    return {
      title,
      download,
    };
  } catch (err) {
    console.error("Snack Download Error:", err.message);
    throw new Error("❌ Video link laane mein vifal rahe. Link ya server check karein.");
  }
}

cmd({
    pattern: "snackdl",
    alias: ["snack", "snackvideo"],
    desc: "Snack Video se video download karta hai (Bina Watermark).", // Downloads Snack Video without Watermark.
    category: "download",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q || (!q.includes("snackvideo.com") && !q.includes("kwaiapp.com"))) {
            return reply(`❌ Kripya sahi Snack Video link dein.\n\n*Udaharan:* ${prefix + command} [Link Hian]`);
        }

        await reply("⏳ Snack Video link mil gaya. Video taiyar kiya jaa raha hai...");

        // 1. Perform the download process
        const videoData = await snackDownload(q);

        // 2. Send the video file
        await conn.sendMessage(from, {
            video: { url: videoData.download },
            mimetype: "video/mp4",
            caption: `✅ *${videoData.title}* Downloaded Successfully!\n(Bina Watermark)\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ SnackDL command error:", e.message);
        reply(`⚠️ Video download karte samay ek truti hui: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
