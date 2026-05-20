const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
};

async function getJawadDownload(url) {
    try {
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api, AXIOS_DEFAULTS);

        const result = res.data?.result;
        if (!result) return null;

        const downloadUrl =
            result.mp4 ||
            result.video ||
            result.url ||
            null;

        if (!downloadUrl) return null;

        return {
            download: downloadUrl,
            title: result.title || "YouTube Video",
            thumb: result.thumbnail || null,
            channel: result.channel || "Unknown",
            views: result.views || 0,
            duration: result.duration || "Unknown"
        };

    } catch {
        return null;
    }
}

cmd({
    pattern: "mp4url",
    alias: ["ytmp4"],
    desc: "YouTube MP4 Downloader",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (sock, message) => {

    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text || "";

        const link = text.split(" ").slice(1).join(" ").trim();
        if (!link || !link.startsWith("http")) return;

        const footer = "⚡ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴇʟ-ᴍᴅ";

        const apiData = await getJawadDownload(link);

        if (!apiData) {
            await sock.sendMessage(message.chat, {
                text: "⚠️ Video download failed. Try another link."
            }, { quoted: message });
            return;
        }

        let finalThumb = apiData.thumb;

        if (!finalThumb) {
            try {
                const search = await yts(link);
                const vid = search.videos?.[0];
                if (vid) {
                    finalThumb = vid.thumbnail;
                    apiData.title = vid.title || apiData.title;
                    apiData.channel = vid.author?.name || apiData.channel;
                    apiData.views = vid.views || apiData.views;
                    apiData.duration = vid.timestamp || apiData.duration;
                }
            } catch {}
        }

        const formattedViews =
            typeof apiData.views === "number"
                ? apiData.views.toLocaleString()
                : apiData.views || "Unknown";

        const stylishMsg = `*${apiData.title}*

🎥 *Channel:* ${apiData.channel}
👁️ *Views:* ${formattedViews}
⏳ *Duration:* ${apiData.duration}

◈╼╼╼╼╼╼╼╼╼╼╼◈
*sᴇʟᴇᴄᴛ ᴅᴏᴡɴʟᴏᴀᴅ ғᴏʀᴍᴀᴛ*

*1 ▷ ᴠɪᴅᴇᴏ* 🎬
*2 ▷ ᴅᴏᴄᴜᴍᴇɴᴛ* 📁
◈╼╼╼╼╼╼╼╼╼╼╼◈

> *${footer}*`;

        const sentMsg = await sock.sendMessage(message.chat, {
            image: { url: finalThumb || 'https://via.placeholder.com/300' },
            caption: stylishMsg
        }, { quoted: message });

        const bufferPromise = axios
            .get(apiData.download, { responseType: 'arraybuffer' })
            .catch(() => null);

        const listener = async (update) => {
            try {
                const msg = update?.messages?.[0];
                if (!msg?.message?.extendedTextMessage) return;

                const replyText = msg.message.extendedTextMessage.text?.trim();
                const stanzaId =
                    msg.message.extendedTextMessage.contextInfo?.stanzaId;

                if (!replyText || stanzaId !== sentMsg.key.id) return;

                let sent = false;

                if (replyText === "1") {
                    
                    await sock.sendMessage(message.chat, {
                        video: { url: apiData.download },
                        mimetype: "video/mp4",
                        fileName: `${apiData.title}.mp4`,
                        caption: `*${apiData.title}*\n\n> *${footer}*`
                    }, { quoted: msg });

                    sent = true;

                } else if (replyText === "2") {
       
                    const resBuffer = await bufferPromise;
                    if (!resBuffer?.data) throw new Error("Buffer failed");

                    const buffer = Buffer.from(resBuffer.data);

                    await sock.sendMessage(message.chat, {
                        document: buffer,
                        mimetype: "video/mp4",
                        fileName: `${apiData.title}.mp4`,
                        caption: `*${apiData.title}*\n\n> *${footer}*`
                    }, { quoted: msg });

                    sent = true;
                }

                if (!sent) throw new Error("Invalid option");

                await sock.sendMessage(message.chat, {
                    react: { text: "✅", key: msg.key }
                });

                sock.ev.off("messages.upsert", listener);

            } catch (err) {
                
                await sock.sendMessage(message.chat, {
                    react: { text: "❌", key: update.messages[0].key }
                });

                await sock.sendMessage(message.chat, {
                    text: "❌ Error: Video send failed. API down or file too large."
                });

                sock.ev.off("messages.upsert", listener);
            }
        };

        sock.ev.on("messages.upsert", listener);

        setTimeout(() => {
            sock.ev.off("messages.upsert", listener);
        }, 120000);

    } catch (e) {
        console.log("Command Error:", e);
    }
});