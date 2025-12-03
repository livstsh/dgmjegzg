const { cmd } = require("../command");
const axios = require("axios");

const OWNER_NUMBER = "923325914867"; 
// --- SECURITY FIX: API KEY IS NOW FETCHED FROM CONFIG/ENV ---
// WARNING: NEVER HARDCODE API KEYS IN PUBLIC CODE.
const HEROKU_API_KEY = process.env.HEROKU_API_KEY || "HRKU-AAfTuXFFqVtW85UWAG76CHC1AanTBZQu6KOREXnEYFlw_____wQ13J-mVxrM"; 
const HEROKU_API_BASE = "https://api.heroku.com";

// Global cache to store the list of apps temporarily for confirmation
const appListCache = new Map();

cmd({
    pattern: "herokukillall",
    alias: ["delall", "herokuwipe"],
    desc: "Heroku par maujood saare apps ko hamesha ke liye delete karta hai. (2-step confirmation).", // Permanently deletes ALL apps on Heroku.
    category: "owner",
    react: "🔥",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {

    // 1. Owner Check
    if (!sender.includes(OWNER_NUMBER))
        return reply("❌ Access Denied. Yeh command sirf owner ke liye hai.");

    if (HEROKU_API_KEY === "YOUR_HEROKU_API_KEY_HERE" || !HEROKU_API_KEY) {
         return reply("❌ Error: Kripya is command ko chalaane se pehle config mein HEROKU_API_KEY set karein.");
    }
    
    await reply("⏳ Heroku se saare Apps ki list nikaali jaa rahi hai...");

    try {
        // --- STEP 1: Get the list of all apps ---
        const listResponse = await axios.get(`${HEROKU_API_BASE}/apps`, {
            headers: {
                Authorization: `Bearer ${HEROKU_API_KEY}`,
                Accept: "application/vnd.heroku+json; version=3"
            },
            timeout: 15000
        });

        const apps = listResponse.data.map(app => app.name).filter(name => name);
        
        if (apps.length === 0) {
            return reply("✅ Aapke Heroku account par koi App nahi mili.");
        }
        
        const appsListText = apps.map((name, i) => `${i + 1}. ${name}`).join('\n');
        
        // --- STEP 2: Prompt for Confirmation ---
        const confirmMessage = `
🔥🔥 *CRITICAL WARNING* 🔥🔥
Aapke Heroku account par kul *${apps.length}* Apps mili hain.

Kya aap sach mein in saari Apps ko *HAMESHA KE LIYE* delete karna chahte hain?

Apps List:
-------------------------
${appsListText}
-------------------------

*CONFIRM karne ke liye reply karein:* *YES*
*CANCEL karne ke liye reply karein:* *NO*
`;
        
        const sentConfirmMsg = await reply(confirmMessage);
        
        // Store the list temporarily in cache keyed by sender and message ID
        const cacheKey = `${from}-${sentConfirmMsg.key.id}`;
        appListCache.set(cacheKey, apps);
        
        // --- STEP 3: Listen for Confirmation Reply ---
        const confirmationHandler = async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const repliedToConfirm = msg.message.extendedTextMessage?.contextInfo?.stanzaId === sentConfirmMsg.key.id;
            if (!repliedToConfirm) return;

            const receivedText = msg.message.conversation?.trim().toUpperCase() || msg.message.extendedTextMessage?.text?.trim().toUpperCase();
            
            // Remove listener immediately
            conn.ev.off("messages.upsert", confirmationHandler);
            const appsToDelete = appListCache.get(cacheKey);
            appListCache.delete(cacheKey); // Clear cache

            if (!appsToDelete || receivedText !== 'YES') {
                return await reply("❌ Operation Cancelled. Koi App delete nahi ki gayi.");
            }
            
            // --- STEP 4: Execute Deletion ---
            await reply(`⚠️ CONFIRM HUA! Ab ${appsToDelete.length} Apps ko delete kiya jaa raha hai...`);
            
            let successfulDeletes = [];
            let failedDeletes = [];
            
            for (const appName of appsToDelete) {
                try {
                    await axios.delete(`${HEROKU_API_BASE}/apps/${appName}`, {
                        headers: {
                            Authorization: `Bearer ${HEROKU_API_KEY}`,
                            Accept: "application/vnd.heroku+json; version=3"
                        },
                        timeout: 10000
                    });
                    successfulDeletes.push(appName);
                } catch (deleteError) {
                    failedDeletes.push(appName);
                    console.error(`Failed to delete ${appName}:`, deleteError.message);
                }
            }

            const finalSummary = `
✨ *HEROKU WIPE COMPLETE* ✨

✅ *Safaltapoorvak Delete Hui:* ${successfulDeletes.length} Apps
${successfulDeletes.map(name => ` - ${name}`).join('\n')}

❌ *Vifal Hui:* ${failedDeletes.length} Apps
${failedDeletes.map(name => ` - ${name}`).join('\n')}

*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*
`;
            
            // Sending message using 'from' (the chat ID)
            await conn.sendMessage(from, { text: finalSummary });

        };
        
        // Add listener and set a strict timeout (e.g., 60 seconds)
        conn.ev.on("messages.upsert", confirmationHandler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", confirmationHandler);
            if (appListCache.has(cacheKey)) {
                 reply("⚠️ Confirmation ka samay samapt ho gaya. Operation cancelled.");
                 appListCache.delete(cacheKey);
            }
        }, 60000);

    } catch (error) {
        console.error("Heroku Kill All Error:", error.message);
        const errorMessage = error.response?.data?.message || error.message;
        await reply(`❌ Error in Heroku operation: ${errorMessage}`);
    }
});
