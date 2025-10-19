const { cmd, commands } = require('../command');
const yts = require('yt-search');
const { fetchJson } = require('../lib/functions');
const ddownr = require('denethdev-ytmp3');

// Function to extract the video ID from youtu.be or YouTube links
function extractYouTubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|playlist\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to convert any YouTube URL to a full YouTube watch URL
function convertYouTubeLink(q) {
    const videoId = extractYouTubeId(q);
    if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return q;
}

cmd({
    pattern: "song3",
    alias: "yt",
    desc: "සින්දු බාගත කිරීමට",
    react: "🎵",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, q, reply }) => {
    try {
        if (!q) return reply("*කරුණාකර YouTube URL එකක් හෝ සින්දුවේ නමක් දෙන්න!*");

        q = convertYouTubeLink(q);

        // Search for Normal, DJ, and Slowed versions
        const normalSearch = await yts(q);
        const djSearch = await yts(`${q} DJ remix`);
        const slowedSearch = await yts(`${q} slowed`);

        const normalVideo = normalSearch.videos[0];
        const djVideo = djSearch.videos[0];
        const slowedVideo = slowedSearch.videos[0];

        if (!normalVideo || !djVideo || !slowedVideo) {
            return reply("*සමහර සින්දු වර්ග හමු වුණේ නැහැ. කරුණාකර නැවත උත්සාහ කරන්න!*");
        }

        // Prepare the selection list
        let listText = `╭━━━〔 *KAVI-MD* 〕━━━┈⊷
┃▸╭───────────
┃▸┃⚆ *YOUTUBE DOWNLOADER ⚘*
┃▸└───────────···๏
╰────────────────┈⊷\n\n🔢 *අවශ්‍ය අංකය යොමු කර එවන්න💜*(\n\n`;

        listText += `🔢│➪ *1 = NORMAL VERSION*\n\n`;
        listText += `┏━❮🩵𝐃𝐄𝐓𝐀𝐋𝐄𝐒🩵❯━\n`;
        listText += `┃🤖 *ᴛɪᴛʟᴇ ➟* ${normalVideo.title}\n`;
        listText += `┃📑 *ᴅᴜʀᴀᴛɪᴏɴ ➟* ${normalVideo.timestamp}\n`;
        listText += `┃🔖 *ᴠɪᴇᴡꜱ ➟* ${normalVideo.views}\n`;
        listText += `┃📟 *ᴜᴘʟᴏᴀᴅ ᴏɴ ➟* ${normalVideo.ago}\n`;
        listText += `┗━━━━━━━━━━━━━━𖣔𖣔\n\n`;

        listText += `🔢│➪ *2 = DJ REMIX*\n\n`;
        listText += `┏━❮🩵𝐃𝐄𝐓𝐀𝐋𝐄𝐒🩵❯━\n`;
        listText += `┃🤖 *ᴛɪᴛʟᴇ ➟* ${djVideo.title}\n`;
        listText += `┃📑 *ᴅᴜʀᴀᴛɪᴏɴ ➟* ${djVideo.timestamp}\n`;
        listText += `┃🔖 *ᴠɪᴇᴡꜱ ➟* ${djVideo.views}\n`;
        listText += `┃📟 *ᴜᴘʟᴏᴀᴅ ᴏɴ ➟* ${djVideo.ago}\n`;
        listText += `┗━━━━━━━━━━━━━━𖣔𖣔\n\n`;

        listText += `🔢│➪ *3 = SLOWED VERSION*\n\n`;
        listText += `┏━❮🩵𝐃𝐄𝐓𝐀𝐋𝐄𝐒🩵❯━\n`;
        listText += `┃🤖 *ᴛɪᴛʟᴇ ➟* ${slowedVideo.title}\n`;
        listText += `┃📑 *ᴅᴜʀᴀᴛɪᴏɴ ➟* ${slowedVideo.timestamp}\n`;
        listText += `┃🔖 *ᴠɪᴇᴡꜱ ➟* ${slowedVideo.views}\n`;
        listText += `┃📟 *ᴜᴘʟᴏᴀᴅ ᴏɴ ➟* ${slowedVideo.ago}\n`;
        listText += `┗━━━━━━━━━━━━━━𖣔𖣔\n\n`;

        listText += `🔢 \n *අවශ්‍ය අංකය යොමු කර එවන්න💜*`;
        listText += `> *ᴘᴏᴡᴇʀᴅ ʙʏ  ᴋᴀᴠɪᴅᴜ ʀᴀꜱᴀɴɢᴀ : )*`;

        // Send the selection list
        const sentMsg = await conn.sendMessage(from, {
            image: { url: normalVideo.thumbnail },
            caption: listText,
            contextInfo: {
                mentionedJid: ['94760698006@s.whatsapp.net'],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363417070951702@newsletter',
                    newsletterName: "🎬𝐌𝐎𝐕𝐈𝐄 𝐂𝐈𝐑𝐂𝐋𝐄🎬",
                    serverMessageId: 999
                }
            }
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        // Listen for the user's response for song selection
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const replyMek = messageUpdate.messages[0];
            if (!replyMek.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage && replyMek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                let selectedVideo;
                if (messageType === '1') {
                    selectedVideo = normalVideo;
                } else if (messageType === '2') {
                    selectedVideo = djVideo;
                } else if (messageType === '3') {
                    selectedVideo = slowedVideo;
                } else {
                    await conn.sendMessage(from, { text: "*වැරදි තේරීමක්! 1-3 අතර තෝරන්න.*" }, { quoted: replyMek });
                    return;
                }

                const url = selectedVideo.url;

                // Show download options
                let desc = `╭━━━〔 *KAVI-MD* 〕━━━┈⊷
┃▸╭───────────
┃▸┃⚆ *YOUTUBE DOWNLOADER ⚘*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━〔🔢 *අවශ්‍ය අංකය යොමු කර එවන්න💜*〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃•1 || ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴜᴅɪᴏ 🎧
┃◈┃•2 || ᴅᴏᴡɴʟᴏᴀᴅ ᴅᴏᴄᴜᴍᴇɴᴛ 📁
┃◈┃•3 || ᴅᴏᴡɴʟᴏᴀᴅ ᴠᴏɪᴄᴇ 🎤
┃◈└───────────┈⊷
╰──────────────┈⊷
> *ᴘᴏᴡᴇʀᴅ ʙʏ  ᴋᴀᴠɪᴅᴜ ʀᴀꜱᴀɴɢᴀ : )*
`;
                let info = `> *ᴘᴏᴡᴇʀᴅ ʙʏ  ᴋᴀᴠɪᴅᴜ ʀᴀꜱᴀɴɢᴀ : )*`;

                const optionMsg = await conn.sendMessage(from, {
                    image: { url: selectedVideo.thumbnail },
                    caption: desc,
                    contextInfo: {
                        mentionedJid: ['94760698006@s.whatsapp.net'],
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363417070951702@newsletter',
                            newsletterName: "🎬𝐌𝐎𝐕𝐈𝐄 𝐂𝐈𝐑𝐂𝐋𝐄🎬",
                            serverMessageId: 999
                        }
                    }
                }, { quoted: replyMek });

                const optionMsgID = optionMsg.key.id;

                // Listen for the download option
                conn.ev.on('messages.upsert', async (optionUpdate) => {
                    const optMek = optionUpdate.messages[0];
                    if (!optMek.message) return;

                    const optType = optMek.message.conversation || optMek.message.extendedTextMessage?.text;
                    const isReplyToOptMsg = optMek.message.extendedTextMessage && optMek.message.extendedTextMessage.contextInfo.stanzaId === optionMsgID;

                    if (isReplyToOptMsg) {
                        await conn.sendMessage(from, { react: { text: '⬇️', key: optMek.key } });

                        // Download using ddownr
                        const result = await ddownr.download(url, 'mp3');
                        if (!result.downloadUrl) {
                            return reply("*බාගත කිරීම අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න!*");
                        }
                        const downloadUrl = result.downloadUrl;

                        await conn.sendMessage(from, { react: { text: '⬆️', key: optMek.key } });

                        if (optType === '1') {
                            // Audio
                            await conn.sendMessage(from, {
                                audio: { url: downloadUrl },
                                mimetype: "audio/mpeg",
                                contextInfo: {
                                    externalAdReply: {
                                        title: selectedVideo.title,
                                        body: selectedVideo.videoId,
                                        mediaType: 1,
                                        sourceUrl: url,
                                        thumbnailUrl: selectedVideo.thumbnail,
                                        renderLargerThumbnail: true,
                                        showAdAttribution: true
                                    }
                                }
                            }, { quoted: optMek });
                        } else if (optType === '2') {
                            // Document
                            await conn.sendMessage(from, {
                                document: { url: downloadUrl },
                                mimetype: "audio/mp3",
                                fileName: `${selectedVideo.title}.mp3`,
                                caption: info
                            }, { quoted: optMek });
                        } else if (optType === '3') {
                            // Voice
                            await conn.sendMessage(from, {
                                audio: { url: downloadUrl },
                                mimetype: "audio/mpeg",
                                ptt: true,
                                contextInfo: {
                                    externalAdReply: {
                                        title: selectedVideo.title,
                                        body: selectedVideo.videoId,
                                        mediaType: 1,
                                        sourceUrl: url,
                                        thumbnailUrl: selectedVideo.thumbnail,
                                        renderLargerThumbnail: true,
                                        showAdAttribution: true
                                    }
                                }
                            }, { quoted: optMek });
                        } else {
                            await conn.sendMessage(from, { text: "*වැරදි තේරීමක්! 1-3 අතර තෝරන්න.*" }, { quoted: optMek });
                        }
                    }
                });
            }
        });
    } catch (e) {
        console.log(e);
        reply(`*දෝෂයක් ඇති වුණා:* ${e.message}`);
    }
});
  
