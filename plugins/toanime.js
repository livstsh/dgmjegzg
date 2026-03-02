const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
    pattern: "fakedev",
    alias: ["fakedev1", "fakedev2", "fakedev3"],
    react: "🎨",
    desc: "Generate a fake developer profile image.",
    category: "maker",
    use: ".fakedev1 Name true (reply image)",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, command, usedPrefix }) => {
    
    const msgKey = m?.key || mek?.key || null;

    try {
        // Menu showing if only .fakedev is typed
        if (command === 'fakedev') {
            return reply(`*🎨 FAKE DEV GENERATOR*\n\nUsage:\n${usedPrefix}fakedev1 <name> <true/false>\n${usedPrefix}fakedev2 <name>\n${usedPrefix}fakedev3 <name> <true/false>\n\n*Note:* Reply to an image or provide a URL.`);
        }

        if (!text) return reply(`❌ Example: *${usedPrefix}${command} Prova true* (Reply to an image)`);

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        let waitMsg = await conn.sendMessage(from, { text: "🖌️ *Creating your profile...*" }, { quoted: m });

        let args = text.trim().split(/\s+/);
        let name = args[0];
        let verified = 'false';
        let imageUrl = null;

        // Logic for different fakedev versions
        if (command === 'fakedev1' || command === 'fakedev3') {
            verified = (args[1] || 'false').toLowerCase();
            imageUrl = args[2] || null;
        } else {
            imageUrl = args[1] || null;
        }

        // Image Handling (Media Download & Upload)
        if (!imageUrl) {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';

            if (!/image/.test(mime)) return reply("📸 Please reply to an image or provide a URL!");

            let media = await q.download();
            
            // Upload to Uguu.se for temporary URL
            let form = new FormData();
            form.append('files[]', media, { filename: 'image.jpg' });

            const upRes = await axios.post('https://uguu.se/upload.php', form, {
                headers: { ...form.getHeaders() }
            });

            if (!upRes.data?.files?.[0]?.url) throw new Error("Image upload failed.");
            imageUrl = upRes.data.files[0].url;
        }

        // API URL Selection
        let apiUrl;
        const base = "https://kayzzidgf.my.id/api/maker";
        const key = "FreeLimit";

        if (command === 'fakedev1') {
            apiUrl = `${base}/fakedev?text=${encodeURIComponent(name)}&image=${encodeURIComponent(imageUrl)}&verified=${verified}&apikey=${key}`;
        } else if (command === 'fakedev3') {
            apiUrl = `${base}/fakedev3?text=${encodeURIComponent(name)}&image=${encodeURIComponent(imageUrl)}&verified=${verified}&apikey=${key}`;
        } else {
            apiUrl = `${base}/fakedev2?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(name)}&apikey=${key}`;
        }

        // Fetching Resulting Image
        const finalImg = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        await conn.sendMessage(from, { 
            image: Buffer.from(finalImg.data), 
            caption: `✅ *Fake Dev Profile Generated!*` 
        }, { quoted: m });

        if (waitMsg && waitMsg.key) await conn.sendMessage(from, { delete: waitMsg.key });
        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
    
