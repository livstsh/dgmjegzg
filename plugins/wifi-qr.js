const { cmd } = require('../command');
const QRCode = require('qrcode');

cmd({
    pattern: "wifiqr",
    desc: "Create a QR code to connect to WiFi",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { args, q, reply }) => {
    try {
        if (!q) return reply("Please provide WiFi details in this format:\n.wifiqr Name|Password|Security(WPA/WEP)");

        const [name, pass, sec] = q.split('|');

        if (!name) return reply("WiFi name is required!");
        if (!pass) return reply("WiFi password is required!");
        
        // Default security if not provided
        const security = sec || 'WPA';

        // WiFi QR format
        const wifiString = `WIFI:S:${name};T:${security};P:${pass};;`;
        
        const qrBuffer = await QRCode.toBuffer(wifiString);

        await conn.sendMessage(m.chat, { 
            image: qrBuffer, 
            caption: `*📶 ʟᴜᴄᴋʏ-ᴍᴅ WIFI QR GENERATOR*\n\n*SSID:* ${name}\n*Password:* ${pass}\n*Security:* ${security}\n\nScan this code to connect directly! 🚀` 
        }, { quoted: m });

    } catch (e) {
        reply("Error creating QR code.");
        console.log(e);
    }
});