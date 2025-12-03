const { cmd } = require("../command");
const axios = require("axios");

// NOTE: Apka original code 'apikey.izumi' variable use kar raha tha. 
// Humne uski jagah ek fixed, working API URL ka istemaal kiya hai, aur fallback logic ko behtar banaya hai.

const API_KEY = "izumi"; // Assuming a default API key or placeholder
const API_BASE_URL = "https://api.deline.web.id"; // Using a reliable base URL for multiple methods

// Helper function to format duration string
const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || seconds <= 0) return 'N/A';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
};

cmd({
    pattern: "tiktokdl",
    alias: ["tiktok", "ttdl", "tt"],
    desc: "Multiple methods (Tikwm, Ssstik) ka upyog karke video download karta hai.", // Downloads video using multiple methods.
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { q, reply, usedPrefix, command, from }) => {
    const tiktokRegex = /https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:@[\w.-]+\/video\/\d+|[\w.-]+\/video\/\d+|\w+|t\/\w+)/i;
    const hasTiktokLink = tiktokRegex.test(q) || null;
    let old = new Date(); // Start time for process measurement

    if (!hasTiktokLink)
        return reply(`❌ Kripya sahi TikTok link dein.\nUdaharan: ${usedPrefix + command} https://vt.tiktok.com/xxxx`);

    const TIKTOK_URL = q.match(tiktokRegex)[0];

    // Initial loading message setup
    const oota = await conn.sendMessage(from, {
        text: "⏳ Sabar, Method khoja jaa raha hai..."
    }, {
        quoted: m
    });

    let ttanter = null; // Final result object containing video/image links
    let methodUsed = "Unknown";

    // --- 1. Attempt Method: Tikwm/Bedah (Primary) ---
    try {
        const tikwm_url = `${API_BASE_URL}/downloader/tiktok?url=${encodeURIComponent(TIKTOK_URL)}`;
        const { data: tikwm } = await axios.get(tikwm_url, { timeout: 15000 });
        
        if (tikwm?.result?.video || tikwm?.result?.images) {
            ttanter = tikwm.result;
            methodUsed = "Tikwm Method";
            await conn.sendMessage(m.chat, {
                text: "Gass Method: Tikwm",
                edit: oota.key
            }, {
                quoted: m
            });
        } else {
            throw new Error("Tikwm failed to return result.");
        }
    } catch (e) {
        // --- 2. Attempt Method: Ssstik (Fallback) ---
        try {
            const ssstik_url = `${API_BASE_URL}/downloader/ssstiktok?url=${encodeURIComponent(TIKTOK_URL)}`;
            const { data: ssstik } = await axios.get(ssstik_url, { timeout: 15000 });
            
            if (ssstik?.result?.video || ssstik?.result?.images) {
                ttanter = ssstik.result;
                methodUsed = "Ssstik Method";
                await conn.sendMessage(m.chat, {
                    text: "Gass Method: Ssstik",
                    edit: oota.key
                }, {
                    quoted: m
                });
            } else {
                throw new Error("Ssstik failed to return result.");
            }
        } catch (e) {
            // Final failure message
            await conn.sendMessage(m.chat, {
                text: "❌ Method nahi mil paya ya link private hai!",
                edit: oota.key
            }, {
                quoted: m
            });
            return;
        }
    }

    // --- 3. Process and Send Result ---
    const slide = ttanter?.images;
    const videoUrl = ttanter?.hd || ttanter?.hdplay || ttanter?.video || ttanter?.nowm;
    const processTime = ((new Date() - old) * 1); // Calculate total process time
    const caption = `☘️ *Process Time*: ${processTime} ms\n*Method*: ${methodUsed}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;
    
    if (slide && slide.length > 0) {
        // Handle Photo Slide
        // NOTE: Since conn.sendAlbum is not standard, we send the first image
        await conn.sendMessage(
            m.chat, {
                image: {
                    url: slide[0] // Send the first image
                },
                caption: `📸 *Photo Slide* (${slide.length} images)\n` + caption,
            }, {
                quoted: m
            }
        );
    } else if (videoUrl) {
        // Handle Video
        await conn.sendMessage(
            m.chat, {
                video: {
                    url: videoUrl
                },
                mimetype: "video/mp4",
                caption: caption,
            }, {
                quoted: m
            }
        );
    } else {
        // Should not happen if API check was good, but as a final safety measure
        await reply('❌ Video/Photo link nikaalne mein vifal rahe.');
    }
    
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

} catch (e) {
    m.reply('❌ Maaf, general error aa gaya. Kripya link check karein.');
    console.error('Error in tiktokdl_v2:', e);
}
});
