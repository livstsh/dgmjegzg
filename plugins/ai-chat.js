const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');

// --- Helper Functions (Meta AI Logic) ---

function generateRandomDOB() {
    const year = Math.floor(Math.random() * (2005 - 1970 + 1)) + 1970;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function getToken() {
    const url = 'https://www.meta.ai/api/graphql/';
    const form = new FormData();
    form.append('variables', JSON.stringify({
        "dob": generateRandomDOB(),
        "__relay_internal__pv__AbraQPDocUploadNuxTriggerNamerelayprovider": "meta_dot_ai_abra_web_doc_upload_nux_tour",
        "__relay_internal__pv__AbraSurfaceNuxIDrelayprovider": "12177"
    }));
    form.append('doc_id', '25102616396026783');
    form.append('lsd', 'AdJzP_b_qoc'); // Default LSD from your code
    // ... Baki form fields aapki script se liye gaye hain
    form.append('av', '0');
    form.append('__user', '0');
    form.append('__a', '1');
    form.append('fb_api_caller_class', 'RelayModern');

    const headers = { ...form.getHeaders(), 'host': 'www.meta.ai', 'user-agent': 'Mozilla/5.0' };
    
    const response = await axios.post(url, form, { headers });
    if (response.data?.data?.xab_abra_accept_terms_of_service) {
        return response.data.data.xab_abra_accept_terms_of_service.new_temp_user_auth;
    }
    throw new Error('Token generation failed');
}

// --- Bot Command Implementation ---

cmd({
    pattern: "meta",
    alias: ["mova", "ai"],
    react: "🦋",
    desc: "Chat with Meta AI (Mova-Nest Persona).",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Hey! Please provide a question or message for me. 😊");

        // Persona Setting (From your code)
        const systemMessage = `You are Mova - Nest, a gentle, feminine, anime-style virtual girl. Mova - Nest speaks in a soft, warm, friendly tone. Personality: Sweet, calm, affectionate. Use trendy slang like rizz, sigma, looksmaxxing sparingly. Stay in character. Never mention being an AI.`;

        reply("✨ *Mova-Nest is thinking...*");

        // 1. Get Token
        const tokenData = await getToken();
        const accessToken = tokenData.access_token;

        // 2. Setup IDs
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

        const externalConversationId = generateUUID();
        const threadSessionId = generateUUID();
        const offlineThreadingId = Math.floor(Math.random() * 9e18).toString();

        // 3. Send Message to Meta AI
        const url = 'https://graph.meta.ai/graphql?locale=user';
        const variables = {
            message: { sensitive_string_value: q },
            externalConversationId,
            offlineThreadingId,
            threadSessionId,
            isNewConversation: true,
            selectedModel: "BASIC_OPTION",
            promptPrefix: systemMessage, // Injecting your system message here
            entrypoint: "KADABRA__CHAT__UNIFIED_INPUT_BAR"
        };

        const form = new FormData();
        form.append('access_token', accessToken);
        form.append('variables', JSON.stringify(variables));
        form.append('doc_id', '24895882500088854');
        // ... Other required fields
        form.append('lsd', 'AdJzP_b_qoc');

        const headers = { ...form.getHeaders(), 'host': 'graph.meta.ai' };
        const response = await axios.post(url, form, { headers });

        // 4. Parse Response
        const lines = response.data.split('\n').filter(line => line.trim());
        let resultText = "I'm sorry, I couldn't process that. 🌸";

        for (let line of lines) {
            try {
                const parsed = JSON.parse(line);
                const botMsg = parsed?.data?.node?.bot_response_message;
                if (botMsg?.content?.text?.composed_text?.content?.[0]?.text) {
                    resultText = botMsg.content.text.composed_text.content[0].text;
                } else if (botMsg?.snippet) {
                    resultText = botMsg.snippet;
                }
            } catch (e) { continue; }
        }

        // 5. Final Reply with Branding
        const finalMsg = `*🦋 MOVA - NEST AI 🦋*\n\n${resultText}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;
        
        await conn.sendMessage(from, { 
            text: finalMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: "MOVA - NEST AI",
                    body: "Online & Sweet Companion",
                    thumbnailUrl: "https://movanest.xyz/logo.png", // Add your logo here
                    sourceUrl: "https://movanest.xyz"
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ *Mova-Nest error:* " + e.message);
    }
});
