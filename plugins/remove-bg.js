const axios = require("axios");
const FormData = require('form-data');
const { cmd } = require("../command");

// Upload to temporary CDN function
async function uploadToTempCDN(fileBuffer, fileName, mimeType) {
    try {
        const CDN_BASE_URL = 'https://temp-cdn-bandaheali.vercel.app';
        
        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: fileName,
            contentType: mimeType
        });

        const uploadResponse = await axios.post(`${CDN_BASE_URL}/upload`, form, {
            headers: form.getHeaders(),
            timeout: 30000
        });

        return uploadResponse.data;
    } catch (error) {
        throw new Error('Upload failed');
    }
}

cmd({
  pattern: "rmbg",
  alias: ["removebg"],
  react: '📸',
  desc: "Remove background from images",
  category: "editing",
  use: ".rmbg [reply to image]",
  filename: __filename
}, async (conn, message, m, { reply }) => {
  try {
    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      return reply("Please reply to an image file (JPEG/PNG)");
    }

    // React with loading
    await conn.sendMessage(m.chat, { react: { text: "🔄", key: message.key } });

    const mediaBuffer = await quotedMsg.download();

    let extension = '.jpg';
    if (mimeType.includes('png')) extension = '.png';

    const fileName = `rmbg_${Date.now()}${extension}`;

    // Upload to CDN
    const uploadResult = await uploadToTempCDN(mediaBuffer, fileName, mimeType);
    const imageUrl = uploadResult.cdnUrl;

    // Call new removebg API
    const apiUrl = `https://edith-apis.vercel.app/imagecreator/removebg?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.status || !response.data.result) {
      throw "Failed to remove background";
    }

    const resultUrl = response.data.result;

    // React with success
    await conn.sendMessage(m.chat, { react: { text: "✅", key: message.key } });

    await conn.sendMessage(m.chat, {
      image: { url: resultUrl },
      caption: `ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ`
    }, { quoted: m });

  } catch (error) {
    // React with error
    await conn.sendMessage(m.chat, { react: { text: "❌", key: message.key } });
    reply(`Error: Failed to remove background`);
  }
});