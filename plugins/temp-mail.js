const { cmd } = require("../command");
const axios = require("axios");

// --- API Endpoints ---
const GENERATE_MAIL_API = "https://apis.sandarux.sbs/api/tools/random-mail";
const CHECK_INBOX_API = "https://apis.sandarux.sbs/api/tools/tempmail-inbox?email="; // Assuming this endpoint exists

// Global cache to store the generated email addresses for inbox checking
const emailCache = new Map();

// Helper function to format time
const formatTime = (ms) => {
    let s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    s -= m * 60;
    return `${m}m ${s}s`;
};


// --- COMMAND 1: GENERATE MAIL ---
cmd({
    pattern: "tempmail",
    alias: ["tmail", "tempmailgen"],
    desc: "Ek naya temporary email address generate karta hai.", // Generates a new temporary email address.
    category: "utility",
    react: "📧",
    filename: __filename
}, async (conn, mek, m, { from, reply, prefix }) => {
    try {
        await reply("⏳ Naya temporary email address generate kiya jaa raha hai...");

        // 1. Fetch new email address
        const response = await axios.get(GENERATE_MAIL_API, { timeout: 15000 });
        const data = response.data;

        // Assuming API returns { status: true, email: "..." }
        if (data.status !== true || !data.email) {
            throw new Error("API se email address generate nahi ho paya.");
        }

        const newEmail = data.email;
        const expiryTime = new Date().getTime() + (10 * 60 * 1000); // Set expiry for 10 minutes

        // 2. Store email in cache for later inbox checking
        const cacheKey = from; // Key by user's JID
        emailCache.set(cacheKey, { email: newEmail, expires: expiryTime });
        
        // Set timeout to clear cache
        setTimeout(() => {
            if (emailCache.get(cacheKey)?.email === newEmail) {
                emailCache.delete(cacheKey);
                conn.sendMessage(from, { text: `⚠️ Aapka temporary email *${newEmail}* ab expired ho gaya hai.` });
            }
        }, 10 * 60 * 1000); 

        // 3. Send success message with instructions
        const instructions = `
✅ *Temporary Email Taiyaar!*

📧 *Email:* \`${newEmail}\`
⏱️ *Expiry:* 10 Minutes
-------------------------
*Inbox Check Karne Ke Liye:*
Use command: \`${prefix}checkmail\`
        
_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;

        await reply(instructions);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("TempMail Generate Error:", e.message);
        reply(`❌ Email generate karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});


// --- COMMAND 2: CHECK INBOX ---
cmd({
    pattern: "checkmail",
    alias: ["cmail", "mailinbox"],
    desc: "Generate kiye gaye temporary email ka inbox check karta hai.", // Checks the inbox of the generated temporary email.
    category: "utility",
    react: "📩",
    filename: __filename
}, async (conn, mek, m, { from, reply, prefix }) => {
    try {
        const cacheKey = from;
        const cachedMail = emailCache.get(cacheKey);

        if (!cachedMail || cachedMail.expires < new Date().getTime()) {
            emailCache.delete(cacheKey);
            return reply(`❌ Aapke paas koi active temporary email nahi hai. Kripya naya email \`${prefix}tempmail\` se generate karein.`);
        }

        const { email, expires } = cachedMail;
        const timeRemaining = formatTime(expires - new Date().getTime());
        
        await reply(`⏳ *${email}* ka inbox check kiya jaa raha hai...`);

        // 1. Fetch inbox messages
        const response = await axios.get(`${CHECK_INBOX_API}${encodeURIComponent(email)}`, { timeout: 20000 });
        const data = response.data;

        // Assuming API returns { status: true, messages: [...] }
        if (data.status !== true || !data.messages) {
            throw new Error("Inbox data laane mein vifal rahe.");
        }

        const messages = data.messages;

        if (messages.length === 0) {
            const statusMessage = `
📩 *Inbox Status* 📩
-------------------------
*Email:* \`${email}\`
*Status:* ✅ Inbox Khali hai (No new messages)
*Time Remaining:* ${timeRemaining}
-------------------------
_Try checking again after a minute._`;
            return reply(statusMessage);
        }

        // 2. Format and send messages
        let messageList = `
📬 *Aapke Inbox mein ${messages.length} Naye Messages* 📬
*Email:* \`${email}\`
*Time Remaining:* ${timeRemaining}
----------------------------------------\n`;

        messages.forEach((msg, index) => {
            messageList += `*${index + 1}. Subject:* ${msg.subject || 'No Subject'}\n`;
            messageList += `   *From:* ${msg.from}\n`;
            messageList += `   *Received:* ${msg.time}\n`;
            messageList += `   *Link:* ${msg.link || 'Content Link Not Available'}\n\n`; // Assuming API provides a link to view full content
        });

        await reply(messageList);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });


    } catch (e) {
        console.error("CheckMail Error:", e.message);
        reply(`❌ Inbox check karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
