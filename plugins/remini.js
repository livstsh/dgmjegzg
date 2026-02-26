const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');

// --- Main Command ---
cmd({
    pattern: "upscale",
    alias: ["hd", "4k", "remini"],
    react: "🚀",
    desc: "Upscale low quality image to 4K HD",
    category: "tools",
    use: ".upscale <reply to image>",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    // FIX: Safe Key logic to prevent 'reading key' error
    const msgKey = m?.key || mek?.key || null;

    try {
        const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message?.imageMessage || m);
        const mime = (m.quoted ? m.quoted.mimetype : m.mimetype) || (quoted.mimetype) || "";

        if (!mime.includes("image")) return reply("❌ Please reply to an image to upscale!");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await reply("🚀 *Processing your image to 4K... please wait.*");

        // 1. Download Media
        const stream = await downloadContentFromMessage(m.quoted ? m.quoted : m.message.imageMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        
        const tempPath = `./upscale_${Date.now()}.png`;
        fs.writeFileSync(tempPath, buffer);

        // 2. Upload to TmpFiles (API requires URL)
        const form = new FormData();
        form.append('file', fs.createReadStream(tempPath));
        const upRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders()
        });
        const imgUrl = upRes.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

        // 3. Login to BigJPG
        const id = crypto.randomBytes(4).toString('hex');
        const login = await axios.post('https://bigjpg.com/login', 
            `username=user_${id}@gmail.com&password=Pass${id}123`,
            { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const cookie = login.headers['set-cookie'].map(v => v.split(';')[0]).join('; ');

        // 4. Create Upscale Task
        const task = await axios.post('https://bigjpg.com/api/task/', 
            `conf=${JSON.stringify({ style: 'photo', noise: '3', x2: '2', input: imgUrl })}`,
            { headers: { 'Cookie': cookie, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const tid = task.data.tid || task.data[0];

        // 5. Polling for Result
        let finalUrl;
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 4000));
            const chk = await axios.get(`https://bigjpg.com/api/task/${tid}`, { headers: { 'Cookie': cookie } });
            if (chk.data?.[tid]?.status === 'success') {
                finalUrl = chk.data[tid].url;
                break;
            }
        }

        if (!finalUrl) throw new Error("Upscale timeout or server busy.");

        // 6. Send Result
        await conn.sendMessage(from, { 
            image: { url: finalUrl },
            caption: `🚀 *IMAGE UPSCALED TO 4K*\n\n> © PROVA MD ❤️`
        }, { quoted: m });

        // Cleanup
        fs.unlinkSync(tempPath);
        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Upscale Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                        
