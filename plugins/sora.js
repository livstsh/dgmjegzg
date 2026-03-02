const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ipcheck",
    alias: ["cekip", "ipinfo"],
    react: "🌐",
    desc: "Check detailed information about an IP address.",
    category: "tools",
    use: ".ipcheck 8.8.8.8",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // SAFE KEY: Crash rokne ke liye
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔍 Please provide an IP address!\nExample: .ipcheck 36.83.91.230");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Step 1: Loading Message
        let waitMsg = await conn.sendMessage(from, { text: "📡 *Fetching IP data from IP2Location...*" }, { quoted: m });

        const res = await axios.get(`https://www.ip2location.com/${encodeURIComponent(text)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            timeout: 15000 // Timeout handling
        });

        const html = res.data;

        // Scraper Helper Function
        const extract = (label) => {
            const regex = new RegExp(
                `<strong>\\s*${label}[\\s\\S]*?<\\/strong>[\\s\\S]*?<td[^>]*>(.*?)<\\/td>`,
                "i"
            );
            const match = html.match(regex);
            return match ? match[1].replace(/<.*?>/g, "").trim() : "N/A";
        };

        const ipData = {
            country: extract("Country"),
            region: extract("Region"),
            city: extract("City"),
            coords: extract("Coordinates"),
            isp: extract("ISP"),
            domain: extract("Domain"),
            asn: extract("ASN"),
            time: extract("Local Time"),
            zip: extract("ZIP Code")
        };

        if (ipData.country === "N/A" || !ipData.country) {
            throw new Error("IP not valid or data not found on the server.");
        }

        const caption = `
🌐 *IP INFORMATION*

🔎 *IP:* ${text}
🌍 *Country:* ${ipData.country}
🗺 *Region:* ${ipData.region}
🏙 *City:* ${ipData.city}
📌 *Coordinates:* ${ipData.coords}

📡 *ISP:* ${ipData.isp}
🏢 *Domain:* ${ipData.domain}
🧾 *ASN:* ${ipData.asn}
⏰ *Local Time:* ${ipData.time}
📮 *ZIP Code:* ${ipData.zip}

> © ᴘʀᴏᴠᴀ-ᴍᴅ ❤️`.trim();

        // Step 2: SAFE EDIT Logic
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: caption, edit: waitMsg.key });
        } else {
            await reply(caption);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error("IP Check Error:", e);
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                    
