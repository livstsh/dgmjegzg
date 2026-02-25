const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// --- Helper Functions ---
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function genxfpid() {
    const p1 = crypto.randomBytes(16).toString("hex");
    const p2 = crypto.randomBytes(32).toString("hex");
    return Buffer.from(`${p1}.${p2}`).toString("base64");
}

const baseHeaders = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/139.0.0.0 Mobile Safari/537.36",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    origin: "https://nanana.app",
    referer: "https://nanana.app/en"
};

// --- Nanana AI Core Logic ---
async function getAuth() {
    const username = crypto.randomBytes(6).toString("hex");
    const email = `${username}@akunlama.com`;

    await axios.post(
        "https://nanana.app/api/auth/email-otp/send-verification-otp",
        { email, type: "sign-in" },
        { headers: { ...baseHeaders, "Content-Type": "application/json" } }
    );

    let mailKey, mailRegion;
    let attempt = 0;

    while (!mailKey) {
        const url = `https://akunlama.com/api/v1/mail/list?recipient=${username}`;
        const response = await axios.get(url);
        const mails = response.data;
        
        if (Array.isArray(mails) && mails.length > 0) {
            mailKey = mails[0].storage.key;
            mailRegion = mails[0].storage.region;
            break;
        }
        await delay(3000);
        attempt++;
        if (attempt > 20) throw "OTP timeout";
    }

    const htmlRes = await axios.get(`https://akunlama.com/api/v1/mail/getHtml?region=${mailRegion}&key=${mailKey}`);
    const $ = cheerio.load(htmlRes.data);
    const plainText = $("body").text().replace(/\s+/g, " ").trim();
    const otpMatch = plainText.match(/\b\d{6}\b/);
    if (!otpMatch) throw "OTP tidak ditemukan";

    const signin = await axios.post(
        "https://nanana.app/api/auth/sign-in/email-otp",
        { email, otp: otpMatch[0] },
        { headers: { ...baseHeaders, "Content-Type": "application/json" } }
    );

    const cookies = signin.headers["set-cookie"];
    const cookieString = cookies ? cookies.map(c => c.split(";")[0]).join("; ") : "";

    return { ...baseHeaders, Cookie: cookieString, "x-fp-id": genxfpid() };
}

// --- Command Handler ---
cmd({
    pattern: "editimg",
    alias: ["nanana", "reimage3"],
    react: "🪄",
    desc: "Edit image using AI prompt (Nanana AI)",
    category: "ai",
    use: ".editimg <reply image + prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || "";

        if (!mime.startsWith("image/")) return reply("❌ Please reply to an image!");
        if (!q) return reply("❌ Please provide a prompt (e.g., .editimg make it anime style)");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Download and save temporary file
        const buffer = await quoted.download();
        const tmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        const filePath = path.join(tmpDir, `${Date.now()}.jpg`);
        fs.writeFileSync(filePath, buffer);

        // Process with Nanana AI
        const authHeaders = await getAuth();
        
        // 1. Upload
        const form = new FormData();
        form.append("image", fs.createReadStream(filePath));
        const upRes = await axios.post("https://nanana.app/api/upload-img", form, {
            headers: { ...authHeaders, ...form.getHeaders() }
        });
        const uploadUrl = upRes.data.url;

        // 2. Create Job
        const jobRes = await axios.post("https://nanana.app/api/image-to-image", 
            { prompt: q, image_urls: [uploadUrl] },
            { headers: { ...authHeaders, "Content-Type": "application/json" } }
        );
        const jobId = jobRes.data.request_id;

        // 3. Wait for Result
        let result;
        let attempt = 0;
        do {
            await delay(5000);
            const check = await axios.post("https://nanana.app/api/get-result",
                { requestId: jobId, type: "image-to-image" },
                { headers: { ...authHeaders, "Content-Type": "application/json" } }
            );
            result = check.data;
            attempt++;
            if (attempt > 30) throw "Job timeout";
        } while (!result.completed);

        if (!result.data?.images?.length) throw "Failed to get image result";

        // Send Result
        await conn.sendMessage(from, {
            image: { url: result.data.images[0].url },
            caption: `✨ *AI Edit Done*\n\n📝 *Prompt:* ${q}\n\n> © PROVA-MD ❤️`
        }, { quoted: mek });

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message || e}`);
    }
});
        
