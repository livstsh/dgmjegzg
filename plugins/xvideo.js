const config = require('../config');
const {cmd , commands} = require('../command');
const { fetchJson } = require('../lib/functions')
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "xvid",
    alias: ["xvideo"],
    use: '.xvid <query>',
    react: "🔞",
    desc: "xvideo download",
    category: "download",
    filename: __filename
}, async (messageHandler, context, quotedMessage, { from, q, reply }) => {
    try {
        if (!q) return reply('⭕ *Please Provide Search Terms.*');

        let res = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/search?query=${q}`);
        
        if (!res || !res.result || res.result.length === 0) return reply("N_FOUND");

        const data = res.result.slice(0, 10);
        
        if (data.length < 1) return await messageHandler.sendMessage(from, { text: "⭕ *I Couldn't Find Anything 🙄*" }, { quoted: quotedMessage });

        let message = `*🔞 KAMRAN MD XVIDEO DOWNLOADER 🔞*\n\n`;
        let options = '';

        data.forEach((v, index) => {
            options += `${index + 1}. *${v.title}*\n\n`;
        });
        
        message += options;
        message += `> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *_KAMRAN MAX_ ᵀᴹ*\n\n`;

        const sentMessage = await messageHandler.sendMessage(from, {
            image: { url: `https://i.ibb.co/ntvzPr8/s-Wuxk4b-KHr.jpg` },
            caption: message
        }, { quoted: quotedMessage });

        session[from] = {
            searchResults: data,
            messageId: sentMessage.key.id,
        };

        const handleUserReply = async (update) => {
            const userMessage = update.messages[0];

            if (!userMessage.message.extendedTextMessage ||
                userMessage.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
                return;
            }

            const userReply = userMessage.message.extendedTextMessage.text.trim();
            const videoIndexes = userReply.split(',').map(x => parseInt(x.trim()) - 1);

            for (let index of videoIndexes) {
                if (isNaN(index) || index < 0 || index >= data.length) {
                    return reply("⭕ *Please Enter Valid Numbers From The List.*");
                }
            }

            for (let index of videoIndexes) {
                const selectedVideo = data[index];

                try {
                    let downloadRes = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/download?url=${selectedVideo.url}`);
                    let videoUrl = downloadRes.url;

                    if (!videoUrl) {
                        return reply(`⭕ *Failed To Fetch Video* for "${selectedVideo.title}".`);
                    }

                    await messageHandler.sendMessage(from, {
                        video: { url: videoUrl },
                        caption: `${selectedVideo.title}\n\n> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *_KAMRAN MD MAX_ ᵀᴹ*`
                    });

                } catch (err) {
                    console.error(err);
                    return reply(`⭕ *An Error Occurred While Downloading "${selectedVideo.title}".*`);
                }
            }

            delete session[from];
        };

        messageHandler.ev.on("messages.upsert", handleUserReply);

    } catch (error) {
        console.error(error);
        await messageHandler.sendMessage(from, { text: '⭕ *Error Occurred During The Process!*' }, { quoted: quotedMessage });
    }
});
                                                                         
