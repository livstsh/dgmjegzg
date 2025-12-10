const { cmd } = require("../command"); 
const axios = require('axios');

cmd({
    pattern: "react",
    alias: [],
    desc: "Mengirim reaksi (emoji) ke post Channel WhatsApp tertentu.",
    react: '✨',
    category: 'channel',
    limit: false,
    filename: __filename
}, async (conn, m, store, { reply, text }) => {
    
    // Check if input is provided
    if (!text) {
        return reply('Masukkan link post dan reaksi\nContoh: .react https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O/1558 ♥️ 🙏🏻');
    }

    try {
        // Split the input into post link and reactions
        const [post_link, ...reactsArray] = text.split(' ')
        const reacts = reactsArray.join(', ')
        
        if (!post_link || !reacts) {
            throw new Error('Format salah! Gunakan: link_post reaction1 reaction2\nContoh: .react https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O/1558 ♥️ 🙏🏻')
        }

        await store.react('⏳');
        
        // --- API Configuration ---
        const url = 'https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post';
        
        const requestData = {
            post_link: post_link,
            reacts: reacts
        };

        // WARNING: Replace this Bearer Token if the command stops working!
        const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzgyZDFhMTE0YWI3MTE5ZmNhNTdjZiIsImlhdCI6MTc2NTI4OTI0MiwiZXhwIjoxNzY1ODk0MDQyfQ.PyblreikWf2_fcPwRfrM_w-_VZmSlvk1vQtrrOuNFBo';

        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        };
        // --- End API Config ---

        const res = await axios.post(url, requestData, { headers });
        const data = res.data;

        let hasil = `✅ *Reaction Berhasil!*`;

        if (data.message) {
            hasil += `\n📝 *Pesan:* ${data.message}`;
        } else {
            hasil += `\n📝 *Pesan:* Reaksi berhasil dikirim`;
        }

        if (data.botResponse) {
            hasil += `\n🤖 *Respon Bot:* ${data.botResponse}`;
        }
        
        hasil += `\n🔗 *Post Link:* ${post_link}\n🎯 *Reactions:* ${reacts}`;

        await reply(hasil.trim());
        await store.react('✅');

    } catch (error) {
        let errorMessage = `❌ *Terjadi Kesalahan*\n\n`;
        
        if (error.response) {
            errorMessage += `📊 *Status:* ${error.response.status}\n`;
            if (error.response.data) {
                errorMessage += `📝 *Pesan:* ${error.response.data.message || JSON.stringify(error.response.data)}\n`;
            }
        } else if (error.request) {
            errorMessage += `🌐 *Koneksi:* Tidak ada respon dari server (API mungkin mati atau diblokir)\n`;
        } else {
            errorMessage += `⚙️ *Setup:* ${error.message}\n`;
        }
        
        errorMessage += `🔧 *Tips:* Pastikan link post dan emoji benar, dan periksa apakah API key sudah kadaluarsa.`;

        await reply(errorMessage.trim());
        await store.react('❌');
    }
});
      
