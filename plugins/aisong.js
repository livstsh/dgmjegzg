const axios = require("axios");
const { cmd } = require("../command"); 

cmd({
    pattern: "tiktokmusic",
    alias: ["ttmusic", "tms"],
    desc: "Downloads the original audio/music from a TikTok video URL.",
    react: '🎵',
    category: 'download',
    limit: true,
    filename: __filename
}, async (conn, m, store, { text, usedPrefix, command, reply }) => {
    
    // --- 1. Input Validation ---
    if (!text) {
        await store.react('❌');
        return reply(`Masukkan URL TikTok!\nContoh: ${usedPrefix + command} https://vt.tiktok.com/ZSr6HXMxk/`);
    }
    
    // Simple URL validation (check for tiktok domain presence)
    if (!/tiktok\.com/.test(text)) {
        await store.react('❌');
        return reply('⚠️ Link harus dari TikTok!');
    }

    try {
        await store.react('⏳');
        reply('⏳ Sedang menyelam ke lautan TikTok, tunggu sebentar...');

        // --- 2. API Call using axios ---
        const apiUrl = `https://api.vreden.my.id/api/tikmusic?url=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });
        const json = response.data;

        // --- 3. Check API Status ---
        if (json.status !== 200 || !json.result?.url) {
            await store.react('❌');
            return reply(`Gagal mengambil data! Pastikan URL valid dan musik tersedia.\nDetail: ${json.msg || 'Status API bukan 200'}`);
        }

        const { title, author, album, url } = json.result;
        
        // --- 4. Construct Caption ---
        let info = `*Tiktok Music*\n\n`;
        info += `*Judul:* ${title || 'N/A'}\n`;
        info += `*Author:* ${author || 'N/A'}\n`;
        info += `*Album:* ${album || 'N/A'}`;

        // --- 5. Send Audio ---
        await conn.sendMessage(m.chat, {
            audio: { url },
            mimetype: 'audio/mpeg',
            fileName: `${title || 'tiktok_music'}.mp3`,
            ptt: false // Send as standard audio file
        }, { quoted: m });

        // --- 6. Send Info Caption ---
        await reply(info);
        await store.react('✅');

    } catch (e) {
        await store.react('❌');
        console.error("TikTok Music Command Error:", e);
        
        let errorMessage = 'Gagal mendownload musik TikTok.';
        if (axios.isAxiosError(e) && e.code === 'ECONNABORTED') {
            errorMessage = 'Permintaan waktu habis (Timeout). Coba lagi.';
        }
        
        reply(`❌ Error: ${errorMessage}\nLogs error : ${e.message || e}`);
    }
});
