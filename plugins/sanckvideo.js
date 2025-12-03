const { cmd } = require('../command');
const axios = require('axios');
const Buffer = require('buffer').Buffer;

// --- API Endpoint ---
const DOCSBOT_API = 'https://docsbot.ai/api/tools/image-prompter';

// --- MAIN AI Function (Simplified for compatibility) ---
async function docsbot(imageBuffer, { type = 'ocr', vibe = 'informative' } = {}) {
    const typeMap = {
        'ocr': 'text',
        'toprompt': 'prompt',
        'todesc': 'description',
        'tocaption': 'caption',
    };
    
    // Validate inputs
    const typeValue = typeMap[type];
    if (!typeValue) throw new Error(`Invalid type: ${type}`);
    if (!Buffer.isBuffer(imageBuffer)) throw new Error('Image buffer is required');
    
    // Base64 encode the image
    const base64Image = imageBuffer.toString('base64');
    
    const payload = {
        image: base64Image, 
        type: typeValue,
        // Only include vibe if type is 'tocaption'
        ...(type === 'tocaption' && { vibe })
    };

    try {
        const response = await axios.post(
            DOCSBOT_API,
            payload, {
                headers: {
                    'content-type': 'application/json',
                    // Using a static User-Agent as 'user-agents' module is unavailable
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
                },
                timeout: 30000
            }
        );
        
        // Docsbot API returns the result string directly in data.text
        return response.data?.text || response.data?.result || "AI se koi natija nahi mila.";

    } catch (err) {
        const errorMessage = err.response?.data ? Buffer.from(err.response.data).toString('utf8') : err.message;
        console.error("Docsbot API Error:", errorMessage);
        throw new Error(`AI se process fail ho gaya: ${errorMessage.substring(0, 50)}...`);
    }
}


// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, usedPrefix, command }) => {
    
    const quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || '';
    
    // Extract sub-command and optional vibe
    const args = q.split('|').map(s => s.trim());
    const subCommand = args[0]?.toLowerCase();
    const vibe = args[1]?.toLowerCase(); // Optional vibe for 'caption' mode

    const helpMessage = `*🖼️ Image AI Recognition Tool*

*⚠️ Upayog:* Kripya photo ko reply karein ya photo ke saath command use karein:

1.  *.imgai ocr* - Photo se *Text* (OCR) nikaalein.
2.  *.imgai prompt* - Is photo ke liye *AI Prompt* banaayein.
3.  *.imgai caption | [mood]* - Is photo ke liye *Caption* banaayein.
4.  *.imgai desc* - Is photo ka *Description* (Vivaran) dein.

*Udaharan:*
• ${usedPrefix}imgai ocr (Reply photo se)
• ${usedPrefix}imgai caption | funny
`;

    if (!subCommand || !['ocr', 'prompt', 'caption', 'desc'].includes(subCommand)) {
        return reply(helpMessage);
    }
    
    if (!/image/.test(mime)) {
        return reply(`❌ Kripya photo ko reply karein. ${helpMessage}`);
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await reply(`⏳ *${subCommand.toUpperCase()}* analysis shuru ho raha hai...`);

    try {
        // 1. Download the image buffer
        const imageBuffer = await conn.downloadMediaMessage(quoted);
        
        // 2. Map sub-command to API type
        const apiType = subCommand === 'prompt' ? 'toprompt' : subCommand === 'desc' ? 'todesc' : subCommand === 'ocr' ? 'ocr' : 'tocaption';
        
        // 3. Process with AI
        const resultText = await docsbot(imageBuffer, { type: apiType, vibe });
        
        // 4. Format and Send Result
        const finalMessage = `
*✨ AI Result (${apiType.toUpperCase()})*
--------------------------------
${resultText}
--------------------------------
_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_
`;

        await reply(finalMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Image AI Command Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`⚠️ AI process fail ho gaya: ${e.message}`);
    }
};

cmd({
    pattern: "imgai",
    alias: ["ocr", "imgdesc"],
    desc: "Photo se text, prompt, ya description nikalta hai.",
    category: "ai",
    react: "👁️",
    filename: __filename
}, handler);

module.exports = handler;
