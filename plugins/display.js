const axios = require("axios");
const { cmd } = require("../command");

const commands = ["xnxx", "xnxxdl"];

commands.forEach(command => {
  cmd({
    pattern;`xnxx`,
    desc: "XNXX Video Downloader (Low, High, HLS + Thumbnail)",
    category: "downloader",
    react: "🔞",
    filename: __filename
  },
  async (message, match) => {
    if (!match) return message.reply("Please provide the video URL.");

    try {
      const apiUrl = https://delirius-apiofc.vercel.app/download/xnxxdl?url=${encodeURIComponent(match)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.success) {
        const video = data.result.videos;
        const thumb = data.result.thumb;

        let text = `🔞 XNXX Video Downloader\n\n`;
        text += `📸 Thumbnail: ${thumb}\n`;
        text += `🎥 Low Quality: ${video.low}\n`;
        text += `🎥 High Quality: ${video.high}\n`;
        text += `🎥 HLS: ${video.HLS}\n\n`;
        text += `Powered by KAMRAN-MD`;

        message.reply(text);
      } else {
        message.reply("Failed to download the video.");
      }
    } catch (err) {
      console.log(err);
      message.reply("Error connecting to the API.");
    }
  });
});
