/*
Please Give Credit 🙂❤️
⚖️𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 - : ©ᴋᴀᴍʀᴀɴ-ᴍᴅ ꜱᴜᴘᴘᴏʀᴛ 💚
*/

const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');
const domain = `https://mr-manul-ofc-apis.vercel.app/`;
const api_key = `Manul-Ofc-Sl-Sub-Key-9`;

//===== Api-Key එක මට Message එකක් දාල ඉල්ලගන්න, +92 319 5068 309 සල්ලි ගන්න නෙවේ, කීයක් Use කරනවද දැනගන්න...❤️=====

//============================================

cmd({
    pattern: "mv3",
    alias: ["slsub", "mv"],
    react: '🎬',
    category: "download",
    desc: "Search movies on sinhalasub and get download links",
    filename: __filename
}, async (conn, m, mek, { from, isMe, isOwner, q, reply }) => {
    try {
        // Check if search query is provided
        if (!q || q.trim() === '') return await reply('*Please provide a search query! (e.g., Deadpool)*');
        

        // Fetch search results from API
        const manu = await fetchJson(`${domain}/api/sl-sub-search?query=${q}&apikey=${api_key}`);
        const movieData = manu.data.data; // Use the `data.data` array

        // Check if the API returned valid results (array of movies)
        if (!Array.isArray(movieData) || movieData.length === 0) {
            return await reply(`No results found for: ${q}`);
        }

        // Limit to first 10 results
        const searchResults = movieData.slice(0, 10);

        // Format and send the search results message
        let resultsMessage = `🤍 *𝐊𝐀𝐕𝐈-𝐌𝐃 𝐌𝐎𝐕𝐈𝐄 𝐑𝐄𝐒𝐔𝐋𝐓𝐒* 🤍
                             
                          "${q}":\n\n`;
        searchResults.forEach((result, index) => {
            const title = result.title || 'No title available';
            const link = result.link || 'No link available';
            const thumbnail = result.thumbnail || 'https://via.placeholder.com/150'; // Fallback if thumbnail is missing
            resultsMessage += `*${index + 1}.* ${title}\n🔗 Link: ${link}\n`;

            // You can also display the thumbnail in the results if needed
            resultsMessage += `📸 Thumbnail: ${thumbnail}\n\n`;
        });

        const sentMsg = await conn.sendMessage(m.chat, {
            image: { url: searchResults[0].thumbnail }, // Show the thumbnail of the first result
            caption: `${resultsMessage}`
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        // Event listener for user's selection of a movie from search results
        const handleSearchReply = async (replyMek, selectedNumber) => {
            const selectedMovie = searchResults[selectedNumber - 1];
            const response = await fetchJson(`${domain}/api/slsub-movie-info?url=${encodeURIComponent(selectedMovie.link)}&apikey=${api_key}`);
            
            try {
                const movieDetails = response.data;
                const downloadLinks = movieDetails.downloadLinks || [];

                if (downloadLinks.length === 0) {
                    return await reply('No download links found.');
                }

                let downloadMessage = `🎥 *${movieDetails.title}*\n\n*Available Download Links:*\n`;
                downloadLinks.forEach((link, index) => {
                    downloadMessage += `*${index + 1}.* ${link.quality} - ${link.size}\n🔗 Link: ${link.link}\n\n`;
                });

                const pixelDrainMsg = await conn.sendMessage(m.chat, {
                    image: { url: selectedMovie.thumbnail }, // Show the selected movie's thumbnail
                    caption: `${downloadMessage}`
                }, { quoted: replyMek });

                const pixelDrainMessageID = pixelDrainMsg.key.id;

                // Event listener for the user to choose download quality
                const handleDownloadReply = async (pdReply, qualityNumber) => {
                    const selectedLink = downloadLinks[qualityNumber - 1];
                    const file = selectedLink.link;
                    const fileResponse = await fetchJson(`${domain}/api/slsub-direct-link?url=${encodeURIComponent(file)}&apikey=${api_key}`);
                    const downloadLink = fileResponse.data.downloadLink;
                    const fileId = downloadLink.split('/').pop();

                    await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

                    const directDownloadUrl = `https://pixeldrain.com/api/file/${fileId}`;

                    await conn.sendMessage(from, { react: { text: '⬆', key: mek.key } });

                    await conn.sendMessage(from, {
                                document: {
                                    url: directDownloadUrl
                                },
                                mimetype: 'video/mp4',
                                fileName: `🎬𝗞𝗔𝗩𝗜-𝗠𝗗🎬${movieDetails.title} - ${selectedLink.quality}.mp4`,
                                caption: `\n\n*~🔱𝗡𝗔𝗠𝗘:-~${movieDetails.title}*\n\n*~🔱𝗤𝗨𝗔𝗟𝗬𝗧𝗬:-~${selectedLink.quality}*\n> *Download Withing 14 Days.❗*\n> *Enjoy & Stay With Us✨*\n\n𝐌𝐚𝐝𝐞 𝐛𝐲 *𝐊𝐀𝐕𝐈𝐃𝐔 𝐑𝐀𝐒𝐀𝐍𝐆𝐀*  🌟`
                            }, { quoted: pdReply });

                    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
                };

                // Listen for user's reply to select the download quality
                conn.ev.on('messages.upsert', async (pdUpdate) => {
                    const pdReply = pdUpdate.messages[0];
                    if (!pdReply.message) return;
                    const pdMessageType = pdReply.message.conversation || pdReply.message.extendedTextMessage?.text;
                    const isReplyToPixelDrainMsg = pdReply.message.extendedTextMessage && pdReply.message.extendedTextMessage.contextInfo.stanzaId === pixelDrainMessageID;

                    if (isReplyToPixelDrainMsg) {
                        const qualityNumber = parseInt(pdMessageType.trim());
                        if (!isNaN(qualityNumber) && qualityNumber > 0 && qualityNumber <= downloadLinks.length) {
                            handleDownloadReply(pdReply, qualityNumber);
                        } else {
                            await reply('Invalid selection. Please reply with a valid number.');
                        }
                    }
                });

            } catch (error) {
                console.error('Error fetching movie details:', error);
                await reply('Sorry, something went wrong while fetching the movie details.');
            }
        };

        // Listen for user to select a movie from search results
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const replyMek = messageUpdate.messages[0];
            if (!replyMek.message) return;
            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage && replyMek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                const selectedNumber = parseInt(messageType.trim());
                if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= searchResults.length) {
                    handleSearchReply(replyMek, selectedNumber);
                } else {
                    await reply('Invalid selection. Please reply with a valid number.‼️');
                }
            }
        });

    } catch (error) {
        console.error('Error in sinhala command:', error);
        await reply('Sorry, something went wrong. Please try again later.🙁');
    }
});

//=============©ᴋᴀᴍʀᴀɴ-ᴍᴅ ꜱᴜᴘᴘᴏʀᴛ 💚==========
  
