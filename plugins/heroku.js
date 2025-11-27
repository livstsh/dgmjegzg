const { cmd } = require("../command");
const axios = require("axios");

const OWNER_NUMBER = "923195068309"; 
const HEROKU_API_KEY = "HRKU-AAtQe7YAByVUtwIFAjy6p1_SygwhdaQEq_0jHe1Sh4dg_____wuVbRwyV553";

cmd({
    pattern: "herokudel",
    use: ".herokudel <app-name>",
    filename: __filename
}, async (conn, mek, m, { sender, text, reply }) => {

    if (!sender.includes(OWNER_NUMBER))
        return reply("❌ Access Denied");

    if (!text)
        return reply("⚠️ Please type the Heroku app name to delete.");

    const APP_NAME = text.trim();

    await reply(`⏳ Checking Heroku app: *${APP_NAME}*`);

    try {

        // Delete specific Heroku app
        await axios.delete(`https://api.heroku.com/apps/${APP_NAME}`, {
            headers: {
                Authorization: `Bearer ${HEROKU_API_KEY}`,
                Accept: "application/vnd.heroku+json; version=3"
            }
        });

        // Stylish Delete Success Message
        await conn.sendMessage(m.key.remoteJid, { 
            text: `🔥 𝘼𝙋𝙋 𝘿𝙀𝙇𝙀𝙏𝙀𝘿 🔥\n➤ ${APP_NAME}`
        });

    } catch (error) {
        console.error(error);
        await conn.sendMessage(m.key.remoteJid, { 
            text: `❌ Error: App '${APP_NAME}' not found or cannot be deleted.`
        });
    }
});
