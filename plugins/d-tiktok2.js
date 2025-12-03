const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio'); // Assuming cheerio is available

// --- Meownime Scraper Core Functions ---

// 1. Scrape Search Results
const scrapeSearch = async (query) => {
    try {
        const searchUrl = `https://meownime.ltd/search/${encodeURIComponent(query)}/`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const animeList = [];
        
        $('article.post').each((i, element) => {
            const $el = $(element);
            const title = $el.find('h1.entry-title a, h2.entry-title a').text().trim();
            const link = $el.find('h1.entry-title a, h2.entry-title a').attr('href');
            const image = $el.find('.featured-thumb img').attr('src');
            const date = $el.find('.postedon').text().trim();

            if (title && link) {
                animeList.push({ title, link, image: image || null, date: date || null });
            }
        });

        return { success: true, data: animeList, query };
    } catch (error) {
        return { success: false, error: error.message, query };
    }
};

// 2. Scrape Anime Detail (Synopsis, Episodes List, etc.)
const scrapeAnimeDetail = async (url) => {
    try {
        if (!url || !url.includes('meownime.ltd')) {
            throw new Error('Invalid Meownime URL');
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const title = $('h1.entry-title').text().trim();
        if (!title) throw new Error('Anime not found');

        const result = {
            title,
            poster: $('img.single-featured.wp-post-image').attr('src') || null,
            details: {},
            episodes: []
        };
        
        // Extract Synopsis
        const synopsisDiv = $('.entry-content').find('div.mb-33').first();
        if (synopsisDiv.length) {
            result.synopsis = synopsisDiv.find('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        }
        
        // Extract Detail List
        $('ul.mb-33').first().find('li').each((i, el) => {
            const text = $(el).text().trim();
            if (text.includes(':')) {
                const [key, ...valueParts] = text.split(':');
                const cleanKey = key.trim();
                const value = valueParts.join(':').trim();
                if (cleanKey && value) result.details[cleanKey] = value;
            }
        });

        // Extract Episodes and Download Links
        let currentEpisode = null;
        
        $('.entry-content > table').each(function() {
            const episodeCell = $(this).find('td[id]');
            const episodeId = episodeCell.attr('id');
            
            if (episodeId && /^\d{1,3}$/.test(episodeId)) {
                // Found a new episode header
                const episodeTitle = episodeCell.parent().text().trim().replace(/\s+/g, ' ');
                currentEpisode = { id: episodeId, title: episodeTitle, downloads: [] };
                result.episodes.push(currentEpisode);
            } else if (currentEpisode && $(this).hasClass('table-hover')) {
                // Found download links table under the current episode
                const rows = $(this).find('tbody tr');
                if (rows.length >= 2) {
                    const quality = $(rows[0]).text().trim();
                    const links = [];
                    
                    $(rows[1]).find('a').each((i, link) => {
                        const host = $(link).text().trim();
                        const url = $(link).attr('href');
                        if (host && url) links.push({ host, url });
                    });
                    
                    if (quality && links.length > 0) {
                        currentEpisode.downloads.push({ quality, links });
                    }
                }
            }
        });

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
};


// --- Global Cache for Interactive Steps ---
// Stores results and context for the multi-step process
const animeCache = new Map();


// --- COMMAND HANDLER ---
cmd({
    pattern: "meownime",
    alias: ["anime", "mwnime"],
    desc: "Meownime se interactive tareeke se Anime search aur download karta hai.", // Interactively searches and downloads anime from Meownime.
    category: "download",
    react: "🐱",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q) {
            return reply(`❌ Kripya us Anime ka naam dein jise aap khojna chahte hain.\n\n*Udaharan:* ${prefix + command} Attack on Titan`);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply(`🔍 *"${q}"* ke liye Anime khoja jaa raha hai...`);

        // --- STAGE 1: SEARCH ---
        const searchResult = await scrapeSearch(q);
        
        if (!searchResult.success || searchResult.data.length === 0) {
            return reply(`❌ *"${q}"* ke liye koi Anime nahi mila. Kripya doosra naam try karein.`);
        }

        const topResults = searchResult.data.slice(0, 5); // Limit to 5 for menu
        
        let searchMessage = `
*📺 Meownime Search Results* 📺
Total: ${searchResult.data.length} | Top 5 dikhaye ja rahe hain.
----------------------------------------\n`;
        
        topResults.forEach((item, index) => {
            searchMessage += `*${index + 1}. ${item.title}*\n   📅 ${item.date || 'N/A'}\n`;
        });
        
        searchMessage += `\n*Kripya detail dekhne ke liye number (1-${topResults.length}) se reply karein.*`;
        
        // Store search results for STAGE 2
        const cacheKey = `${from}-${mek.key.id}`;
        animeCache.set(cacheKey, { step: 1, results: topResults, searchTime: new Date() });

        const sentSearchMsg = await conn.sendMessage(from, { text: searchMessage }, { quoted: mek });
        
        // --- LISTEN FOR STAGE 2: Detail Selection ---
        const selectionHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToMsgId = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
            if (repliedToMsgId !== sentSearchMsg.key.id) return; 

            const cachedData = animeCache.get(cacheKey);
            if (!cachedData || cachedData.step !== 1) return;

            const selectedIndex = parseInt(msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim()) - 1;

            if (selectedIndex >= 0 && selectedIndex < cachedData.results.length) {
                // STAGE 2: Valid Anime Selected
                conn.ev.off("messages.upsert", selectionHandler); // Remove initial listener

                const selectedAnime = cachedData.results[selectedIndex];
                await conn.sendMessage(from, { react: { text: '🔄', key: msg.key } });
                await reply(`⏳ *${selectedAnime.title}* ke details laaye jaa rahe hain...`);

                // --- STAGE 2: SCRAPE DETAIL PAGE ---
                const detailResult = await scrapeAnimeDetail(selectedAnime.link);

                if (!detailResult.success) {
                    animeCache.delete(cacheKey);
                    return reply(`❌ Details laate samay truti aayi: ${detailResult.error}`);
                }

                const anime = detailResult.data;
                
                // Format Detail Message
                let detailMessage = `*🎬 ${anime.title}*\n\n`;
                detailMessage += `*📋 Details:*\n`;
                Object.entries(anime.details).slice(0, 4).forEach(([key, value]) => {
                    detailMessage += `• ${key}: ${value}\n`;
                });
                detailMessage += '\n';

                detailMessage += `*📝 Synopsis:*\n${anime.synopsis ? anime.synopsis.substring(0, 300) + '...' : 'N/A'}\n\n`;
                detailMessage += `*📺 Episodes Available:* ${anime.episodes.length}`;
                
                // --- STAGE 3: EPISODE SELECTION PROMPT ---
                if (anime.episodes.length > 0) {
                    const episodeOptions = anime.episodes.slice(0, 10).map((ep, i) => `${i + 1}. Episode ${ep.id}`).join('\n');
                    detailMessage += `\n\n*Kripya download ke liye episode number (1-${Math.min(anime.episodes.length, 10)}) se reply karein.*`;
                    detailMessage += `\n\n${episodeOptions}`;
                    
                    // Store full anime data for STAGE 3
                    animeCache.set(cacheKey, { step: 2, animeData: anime, detailTime: new Date() });
                } else {
                    animeCache.delete(cacheKey);
                }

                // Send Poster and Details
                const sentDetailMsg = await conn.sendMessage(
                    from,
                    {
                        image: { url: anime.poster || selectedAnime.image || 'https://i.imgur.com/empty.png' },
                        caption: detailMessage
                    },
                    { quoted: msg }
                );
                
                // If episodes are available, start listening for STAGE 3
                if (anime.episodes.length > 0) {
                    listenForEpisodeSelection(sentDetailMsg.key.id, anime, cacheKey);
                }

            } else if (cachedData) {
                // Invalid selection number
                await reply(`❌ Kripya sahi number (1 se ${cachedData.results.length}) se reply karein.`);
            }
        };

        // --- STAGE 3: EPISODE/DOWNLOAD SELECTION HANDLER ---
        const listenForEpisodeSelection = (detailMsgId, animeData, cacheKey) => {
            const episodeHandler = async (msgUpdate) => {
                const msg = msgUpdate.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const repliedToDetail = msg.message.extendedTextMessage?.contextInfo?.stanzaId === detailMsgId;
                if (!repliedToDetail) return;

                const selectedEpisodeIndex = parseInt(msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim()) - 1;
                
                const targetEpisode = animeData.episodes[selectedEpisodeIndex];

                if (targetEpisode) {
                    conn.ev.off("messages.upsert", episodeHandler); // Remove episode listener
                    animeCache.delete(cacheKey); // Clear final cache

                    // Format Download Links
                    let downloadMessage = `*📺 ${animeData.title} - Episode ${targetEpisode.id}*\n\n`;
                    downloadMessage += `*📥 Download Links:*\n\n`;
                    
                    targetEpisode.downloads.forEach((dl) => {
                        downloadMessage += `**─── Quality: ${dl.quality} ───**\n`;
                        dl.links.forEach((link, i) => {
                            // Display as simple text links since buttons are not supported
                            downloadMessage += `• [${link.host}]: ${link.url}\n`;
                        });
                        downloadMessage += '\n';
                    });
                    
                    downloadMessage += `_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;

                    await conn.sendMessage(from, { text: downloadMessage }, { quoted: msg });
                    await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

                } else {
                    // Invalid episode number
                    await reply(`❌ Kripya sahi episode number (1 se ${animeData.episodes.length}) se reply karein.`);
                }
            };

            conn.ev.on("messages.upsert", episodeHandler);
            setTimeout(() => {
                conn.ev.off("messages.upsert", episodeHandler);
                if (animeCache.has(cacheKey)) {
                    reply("⚠️ Download selection samay seema samapt ho gayi.");
                    animeCache.delete(cacheKey);
                }
            }, 120000); // 2 minutes timeout
        };
        
        // Add listener for STAGE 2
        conn.ev.on("messages.upsert", selectionHandler);
        // Set main timeout to clear search results if no action is taken
        setTimeout(() => {
            conn.ev.off("messages.upsert", selectionHandler);
            if (animeCache.has(cacheKey)) {
                animeCache.delete(cacheKey);
            }
        }, 180000); // 3 minutes main timeout


    } catch (e) {
        console.error("Meownime Command General Error:", e);
        reply(`⚠️ Anime search karte samay truti aayi: ${e.message}`);
    }
});
