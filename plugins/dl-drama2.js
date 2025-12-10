const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const { cmd } = require('../command'); // Assuming you use a command handler wrapper

// NOTE: Please ensure these global variables are defined in your bot's global configuration file.
// global.idchannel = "120363418144382782@newsletter"; // Example Channel JID
// global.botname = "KAMRAN-SMD BOT"; 

cmd({
    pattern: "playch",
    alias: ["ytch"],
    desc: "YouTube se gaana download karke channel par Voice Note (PTT) mein bhejta hai.", // Downloads song from YouTube and sends as PTT to the channel.
    category: "channel",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, isOwner, useLimit, mess }) => {
    
    // --- 1. Authorization and Input Validation ---
    // Assuming 'isOwner' check is handled by your framework, but keeping the reply structure.
    if (!isOwner) return reply(mess.owner || "❌ Maaf, yeh command sirf owner ke liye hai.");
    
    if (!q) {
        return reply(`*Example :* ${prefix + command} judul lagu`);
    }

    if (!global.idchannel || !global.botname) {
        return reply("❌ Global ID Channel ya Bot Name setting nahi hai. Kripya settings check karein.");
    }
    
    // Use the newsletter info from global settings
    const newsletterInfo = {
        newsletterJid: global.idchannel,
        serverMessageId: 100, // This value is usually ignored by Baileys unless setting a specific message ID
        newsletterName: global.botname
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        // --- 2. Fetch Song Metadata and Download URL ---
        const api = `https://api.elrayyxml.web.id/api/downloader/ytplay?q=${encodeURIComponent(q)}`
        const { data } = await axios.get(api);
        
        if (!data || !data.result) {
            await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            return reply("🎶 Gaana nahi mila ya API mein koi truti hai.");
        }
        
        const info = data.result;
        const title = info.title || "Unknown Title";
        const thumbnail = info.thumbnail;
        const downloadUrl = info.download_url;
        const youtubeUrl = info.url;

        await reply(`✅ Song Found: *${title}*. Converting and Sending to Channel...`);

        // --- 3. Download MP3 Data ---
        const audioReq = await axios.get(downloadUrl, {
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        // --- 4. Setup Temporary Files ---
        const uniqueId = Date.now() + "_" + Math.random().toString(36).substring(7);
        const tempInput = path.join(os.tmpdir(), `${uniqueId}.mp3`);
        const tempOutput = path.join(os.tmpdir(), `${uniqueId}.opus`);

        fs.writeFileSync(tempInput, Buffer.from(audioReq.data));

        // --- 5. Convert MP3 to Opus (PTT Format) using FFmpeg ---
        await new Promise((resolve, reject) => {
            // FFmpeg command to convert MP3 to Opus (Ogg/Opus format for PTT)
            const command = `ffmpeg -i "${tempInput}" -c:a libopus -b:a 128k -vbr on -compression_level 10 "${tempOutput}"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error("FFmpeg Error:", error.message);
                    console.error("FFmpeg Stderr:", stderr);
                    reject(new Error(`FFmpeg conversion failed: ${error.message}`));
                } else {
                    resolve();
                }
            });
        });

        const opusBuffer = fs.readFileSync(tempOutput);

        // --- 6. Prepare Thumbnail Buffer ---
        let thumbnailBuffer = null;
        if (thumbnail) {
            try {
                const thumbReq = await axios.get(thumbnail, { responseType: "arraybuffer" });
                thumbnailBuffer = Buffer.from(thumbReq.data);
            } catch (thumbError) {
                console.warn("Thumbnail download failed:", thumbError.message);
            }
        }

        // --- 7. Send the PTT Message to the Channel ---
        await conn.sendMessage(global.idchannel, {
            audio: opusBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true, // Mark as PTT (Voice Note)
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: newsletterInfo,
                externalAdReply: {
                    title: title,
                    body: global.botname,
                    thumbnail: thumbnailBuffer,
                    mediaType: 2, // MEDIA_TYPE_VIDEO
                    renderLargerThumbnail: true,
                    sourceUrl: youtubeUrl
                }
            }
        });
        
        // --- 8. Cleanup and Final Response ---
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(`✅ *Safaltapoorvak* gaana *${title}* channel par bhej diya gaya hai. (PTT Format)`);
        
        // Use the limit function provided by the framework
        if (useLimit) useLimit();

    } catch (e) {
        console.error("PLAYCH COMMAND ERROR:", e);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`❌ Request process karte samay truti aayi. Ya toh gaana available nahi hai, ya FFmpeg mein koi samasya hai: ${e.message}`);
    } finally {
        // --- 9. Cleanup Temporary Files ---
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
});
