const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "cekimei",
    alias: ["imeicheck", "imei"],
    react: "📱",
    desc: "Check mobile IMEI details.",
    category: "tools",
    use: ".cekimei 35461XXXXXXXXXX",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // SAFE KEY: Crash rokne ke liye
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔍 Please provide a 14-16 digit IMEI number!\nExample: .cekimei 354610000000000");

        // Validation for 14-16 digits
        if (!/^\d{14,16}$/.test(text)) {
            return reply("❌ *Invalid IMEI.* Enter 14–16 digits without spaces.");
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Step 1: Loading Message
        let waitMsg = await conn.sendMessage(from, { text: "🔄 *Fetching IMEI details from API...*" }, { quoted: m });

        const res = await axios.get(`https://api-varhad.my.id/tools/cekimei?q=${encodeURIComponent(text)}`);
        const json = res.data;

        if (!json.status) throw new Error("Failed to fetch IMEI data from server.");

        const data = json.result?.result;
        if (!data || !data.header) throw new Error("IMEI details not found.");

        const { header, items = [] } = data;

        let caption = `📱 *IMEI CHECK RESULT*\n\n`;
        caption += `*Brand:* ${header.brand}\n`;
        caption += `*Model:* ${header.model}\n`;
        caption += `*IMEI:* ${header.imei}\n\n`;

        // Parsing nested items from API
        items.forEach(item => {
            if (item.role === 'header') {
                caption += `\n🔎 *${item.title}*\n`;
            } else if (item.role === 'item' || item.role === 'button') {
                caption += `• *${item.title}:* ${item.content}\n`;
            } else if (item.role === 'group' && Array.isArray(item.items)) {
                item.items.forEach(sub => {
                    if (sub.role === 'button') caption += `• *${sub.title}:* ${sub.content}\n`;
                });
            }
        });

        caption += `\n*Status:* ${json.result.status}\n`;
        caption += `\n> © ᴘʀᴏᴠᴀ-ᴍᴅ ❤️`;

        // Step 2: Final Delivery (With Image or Text)
        if (header.photo) {
            await conn.sendMessage(from, { image: { url: header.photo }, caption }, { quoted: m });
        } else {
            if (waitMsg && waitMsg.key) {
                await conn.sendMessage(from, { text: caption, edit: waitMsg.key });
            } else {
                await reply(caption);
            }
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error("IMEI Check Error:", e);
        reply(`❌ *Error:* ${e.message || "Something went wrong."}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
        
