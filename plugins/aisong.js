const axios = require("axios");
const { cmd } = require("../command"); // Assuming 'cmd' utility path

cmd({
    pattern: "alquran",
    alias: [],
    desc: "Fetches and displays a specific verse (ayat) from the Quran, including Arabic text, Latin transliteration, translation, and brief tafsir.",
    react: '📖',
    category: 'islami',
    limit: true,
    filename: __filename
}, async (conn, m, store, { args, reply, usedPrefix, command }) => {
    try {
        // --- 1. Input Validation ---
        if (!args[0] || !args[1]) {
            await store.react('❌');
            return reply(`Format salah. Gunakan:\n${usedPrefix + command} <surah> <ayat>\n\nContoh: ${usedPrefix + command} 1 5 (Surah Al-Fatihah, Ayat 5)`);
        }

        let [surah, ayat] = args;
        
        // Basic numerical validation
        if (isNaN(parseInt(surah)) || isNaN(parseInt(ayat))) {
            await store.react('❌');
            return reply(`Nomor surah dan ayat harus berupa angka.\nContoh: ${usedPrefix + command} 1 5`);
        }
        
        await store.react('⏳');
        reply(`Mencari Qur'an Surah ${surah} Ayat ${ayat}...`);

        // --- 2. API Call using axios ---
        const apiUrl = `https://www.velyn.biz.id/api/search/alquran?surah=${surah}&ayat=${ayat}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        
        const json = response.data;

        if (!json.status || !json.data) {
            throw new Error('Data tidak ditemukan atau format salah.');
        }

        // --- 3. Construct Response ---
        const q = json.data;
        
        // Use Surah and Ayat from the API response to ensure accuracy
        let teks = `*📖 Al-Qur'an | Surah ${q.surah} Ayat ${q.ayat}*

*Arab:* ${q.arab}

*Latin (Transliterasi):* _${q.latin}_

*Terjemahan (Indonesia):* ${q.terjemahan}

*Tafsir Singkat:* ${q.tafsir.split('\n')[0] || 'Tidak ada tafsir singkat tersedia.'}

${q.audio ? `\n_Audio:_ ${q.audio}` : ''}`;

        await reply(teks);
        await store.react('✅');
        
    } catch (e) {
        await store.react('❌');
        console.error("AlQuran Command Error:", e);
        
        let errorMessage = 'Gagal mencari data Al-Qur\'an. Pastikan nomor Surah dan Ayat benar.';
        if (e.message.includes('timeout')) {
            errorMessage = 'Permintaan waktu habis (Timeout). Coba lagi.';
        } else if (e.response && e.response.status === 404) {
             errorMessage = `Surah ${args[0]} Ayat ${args[1]} tidak ditemukan.`;
        } else if (e.message.includes('Data tidak ditemukan')) {
             errorMessage = 'Data tidak ditemukan untuk ayat tersebut.';
        }
        
        reply(`❌ Error: ${errorMessage}\nDetail Log: ${e.message}`);
    }
});
