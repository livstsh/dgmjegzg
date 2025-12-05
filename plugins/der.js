const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search'); 
const config = require('../config');
const Buffer = require('buffer').Buffer;

// --- API Endpoints ---
const SEARCH_API = "https://api.privatezia.biz.id/api/search/youtubesearch?query=";
const PRIMARY_VIDEO_API = "https://jawad-tech.vercel.app/download/ytdl?url=";
const PRIMARY_AUDIO_API = "https://jawad-tech.vercel.app/download/audio?url=";

// --- SPOTIFY APIs (Dual Fallback) ---
const PRIMARY_SPOTIFY_API = "https://api.deline.web.id/downloader/spotifyplay?q="; 
const FALLBACK_SPOTIFY_API = "https://api.ryzendesu.vip/api/downloader/spotify?query=";


const cache = new Map(); // Caching search results


// --- Helper Functions ---

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

function getVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Function to perform the search (YouTube only, simplified)
async function searchYouTube(query) {
    // Logic remains the same: Primary API (privatezia) or fallback (yts)
    // [Search logic code block omitted for brevity, it's unchanged]
    let formattedVideo = null;
    
    // Attempt 1: External Search API (User Provided)
    try {
        const apiUrl = `${SEARCH_API}${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const data = response.data;

        if (data.status === true && data.result && data.result.length > 0) {
            const video = data.result[0];
            formattedVideo = {
                url: normalizeYouTubeUrl(video.url) || video.url,
                title: video.title || 'Video',
                duration: video.duration,
                thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${getVideoId(video.url)}/hqdefault.jpg`,
                type: 'YouTube'
            };
        } else {
             throw new Error("Primary Search API failed.");
        }
    } catch (error) {
        // Fallback to yts
        try {
            const searchResults = await yts(query);
            const video = searchResults.videos[0];
            
            if (video) {
                formattedVideo = {
                    url: video.url,
                    title: video.title,
                    duration: video.timestamp,
                    thumbnail: video.thumbnail,
                    type: 'YouTube'
                };
            }
        } catch(e) {
            console.error(`Local yts search failed: ${e.message}`);
        }
    }

    return formattedVideo;
}

// Function to fetch download links for YouTube
async function fetchYouTubeDownloadLink(url, isAudio) {
    // Logic remains the same: Primary API (jawad-tech) or failure
    // [Download link code block omitted for brevity, it's unchanged]
    let finalUrl = null;

    // Attempt 1: Primary APIs (User's /ytdl and /audio)
    try {
        const apiUrl = isAudio ? `${PRIMARY_AUDIO_API}${encodeURIComponent(url)}` : `${PRIMARY_VIDEO_API}${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        const data = response.data;
        
        if (data.status === true) {
            if (isAudio && data.result) {
                finalUrl = data.result; // Direct link from /download/audio
            } else if (!isAudio && data.result?.mp4) {
                finalUrl = data.result.mp4; // Nested link from /download/ytdl
            }
        }
    } catch (e) {
        console.warn(`Primary Download API failed for ${isAudio}.`);
    }

    if (!finalUrl) throw new Error("Sabhi YouTube APIs se seedha download link nahi mila.");
    
    return { url: finalUrl, title: 'YouTube Download' };
}

// Function to fetch Spotify data (FIXED WITH FALLBACK)
async function fetchSpotifyDownloadLink(query) {
    // Attempt 1: Primary API
    try {
        const url = `${PRIMARY_SPOTIFY_API}${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 15000 });
        const data = response.data;

        if (data.status === true && data.result && data.result.dlink) {
            const meta = data.result.metadata;
            return {
                url: data.result.dlink,
                title: meta.title,
                artist: meta.artist,
                cover: meta.cover,
                source: 'Primary'
            };
        }
        throw new Error("Primary API failed.");
    } catch (e) {
        console.warn("Spotify Primary API failed. Trying Fallback.");
    }
    
    // Attempt 2: Fallback API
    try {
        const fallbackUrl = `${FALLBACK_SPOTIFY_API}${encodeURIComponent(query)}`;
        const response = await axios.get(fallbackUrl, { timeout: 15000 });
        const data = response.data;
        
        // Assuming this fallback API returns a simplified structure with direct audio link
        if (data.status === true && data.result && data.result.url) { 
            return {
                url: data.result.url,
                title: data.result.title,
                artist: data.result.artist || 'Unknown',
                cover: data.result.thumb || 'https://i.imgur.com/empty.png',
                source: 'Fallback'
            };
        }
        throw new Error("Fallback API failed.");
    } catch (e) {
        console.error("Spotify Final Fallback Failed:", e.message);
        throw new Error("❌ Dono Spotify APIs se gaana nahi mila.");
    }
}


// --- MAIN COMMAND HANDLER ---
cmd({
    pattern: "mega",
    alias: ["megadl", "dlall"],
    desc: "Interactive download menu for YouTube, Audio, Video, and Spotify links.",
    category: "download",
    react: "💾",
    filename: __filename,
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q) return reply(`❌ Kripya media ka naam ya URL dein.`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        await reply('⏳ Media data khoja ja raha hai...');

        // 1. SEARCH PHASE (Used to get URL and Metadata)
        const videoInfo = await searchYouTube(q);
        const spotifyInfo = await fetchSpotifyDownloadLink(q).catch((e) => {
            console.warn(`Spotify Search Failed Entirely: ${e.message}`);
            return null; // Return null if both Spotify attempts fail
        });

        if (!videoInfo && !spotifyInfo) {
            return reply("❌ Video ya gaana khojne mein vifal rahe ya koi natija nahi mila.");
        }
        
        // Determine the main source of the search result
        const mainSource = videoInfo || spotifyInfo;
        const isSpotify = !!spotifyInfo;
        const title = mainSource.title || q;
        const thumbnail = mainSource.thumbnail || mainSource.cover;


        // --- STEP 2: SHOW INTERACTIVE MENU (NEW 8 OPTIONS) ---
        let menu = `
 👑 *KAMRAN MD DOWNLOADER* 👑

📌 *Title:* ${title}
${isSpotify ? `👤 *Artist:* ${spotifyInfo.artist}` : `⏱️ *Duration:* ${videoInfo.duration || 'N/A'}`}

🔢 *Kripya format select karne ke liye number se reply karein:*
----------------------------------------
1 - MP4 (Video) 🎥 ${isSpotify ? "(Not Available)" : ""}
2 - MP4 DOCUMENT 📄 ${isSpotify ? "(Not Available)" : ""}
3 - MP3 (Audio) 🎶 (Best Quality)
4 - MP3 DOCUMENT 📁
5 - SPOTIFY AUDIO 🎧 ${!isSpotify ? "(Not Found in search)" : `(Source: ${spotifyInfo.source})`}
6 - SPOTIFY DOC 📃 ${!isSpotify ? "(Not Found in search)" : `(Source: ${spotifyInfo.source})`}
7 - YTSEARCH 🔍 (Show more results)
8 - LINKPLAY 🔗 (Show original link)
----------------------------------------
*Kripya 1 se 8 tak number se reply karein.*
`;
        
        const cacheKey = `${from}-${mek.key.id}`;
        cache.set(cacheKey, { videoInfo, spotifyInfo }); // Store both search results
        
        const sentMenuMsg = await conn.sendMessage(
            from,
            { image: { url: thumbnail }, caption: menu },
            { quoted: mek }
        );

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // --- STEP 3: LISTEN FOR SELECTION ---
        const selectionHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToMenu = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentMenuMsg.key.id;
            if (!repliedToMenu) return;

            const selection = msg.message.conversation?.trim() || msg.message.extendedTextMessage?.text?.trim();
            const cachedData = cache.get(cacheKey);

            if (!cachedData) return; // Ignore if cache expired

            if (selection >= '1' && selection <= '8') {
                conn.ev.off("messages.upsert", selectionHandler); // Remove listener
                cache.delete(cacheKey); // Clear cache

                await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });

                // --- 3A: Handle Simple Options (7 & 8) ---
                if (selection === '7') {
                    return reply(`🌐 *More Search Results:* ${cachedData.videoInfo?.url.replace('/watch?v=', '/results?search_query=') || 'YouTube URL nahi mila.'}`);
                }
                if (selection === '8') {
                    return reply(`🔗 *Original Link:* ${cachedData.videoInfo?.url || cachedData.spotifyInfo?.url || 'Koi link nahi mila.'}`);
                }

                // --- 3B: Handle Download Options (1-6) ---
                const isYouTubeDownload = selection >= '1' && selection <= '4';
                const isSpotifyDownload = selection >= '5' && selection <= '6';
                
                let downloadResult;
                
                if (isYouTubeDownload) {
                    if (!cachedData.videoInfo) return reply("❌ YouTube video link nahi mil paya. Search fail ho gaya tha.");
                    if (selection === '1' || selection === '2') { // MP4 Video/Doc
                         // MP4 is not possible if it was only Spotify
                         if (isSpotify) return reply("❌ Spotify se video download karna uplabdh nahi hai. Kripya 3 ya 4 chunein.");
                    }
                    
                    const isAudio = selection === '3' || selection === '4';
                    try {
                        downloadResult = await fetchYouTubeDownloadLink(cachedData.videoInfo.url, isAudio);
                    } catch (e) {
                        return reply(`❌ Download fail hua: ${e.message}`);
                    }
                } else if (isSpotifyDownload) {
                    if (!cachedData.spotifyInfo) return reply("❌ Spotify gaana nahi mila. Kripya naya search karein.");
                    downloadResult = cachedData.spotifyInfo; // Already contains the direct audio URL
                } else {
                    return reply("❌ Invalid option.");
                }


                if (!downloadResult || !downloadResult.url) {
                    return reply("❌ Download link nahi mil paya. Kripya doobara prayas karein.");
                }

                // --- 3C: Send Final Media ---
                const sendAsDocument = selection === '2' || selection === '4' || selection === '6';
                const isAudioMedia = selection === '3' || selection === '4' || selection === '5' || selection === '6';
                
                const mediaKey = sendAsDocument ? 'document' : (isAudioMedia ? 'audio' : 'video');
                const mimeType = isAudioMedia ? 'audio/mpeg' : 'video/mp4';
                const fileExt = isAudioMedia ? 'mp3' : 'mp4';
                
                const formatLabel = isSpotifyDownload ? 'Spotify MP3' : (isAudio ? 'YouTube MP3' : 'YouTube MP4');
                const finalTitle = downloadResult.title || cachedData.title;

                await conn.sendMessage(from, {
                    [mediaKey]: { url: downloadResult.url },
                    mimetype: mimeType,
                    ptt: mediaKey === 'audio' ? false : undefined, 
                    fileName: `${finalTitle} (${formatLabel}).${fileExt}`,
                    caption: `✅ *${finalTitle}* Downloaded Successfully!\n*Format:* ${formatLabel} (${mediaKey.toUpperCase()})`
                }, { quoted: msg });
                
                await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

            } else if (cachedData) {
                await reply("❌ Kripya sahi number (1 se 8) se reply karein.");
            }
        };

        conn.ev.on("messages.upsert", selectionHandler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", selectionHandler);
            if (cache.has(cacheKey)) {
                reply("⚠️ Samay seema samapt ho gayi. Kripya dobara khojein.");
                cache.delete(cacheKey);
            }
        }, 180000); // 3 minutes main timeout


    } catch (e) {
        console.error("Mega Downloader Command Error:", e);
        reply(`⚠️ Anjaan truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
