const axios = require("axios");
const { cmd, commands } = require("../command");

// The base URL for the translation API
const API_BASE_URL = "https://api-aswin-sparky.koyeb.app/api/search/translate?text=";

// This API requires the text and two optional parameters: &lang1=source_lang&lang2=target_lang
// Default settings: Translate from English (en) to Hindi (hi)

cmd({
    pattern: "translate",
    alias: ["tr", "trans"],
    desc: "Translates text using the Delirius API. Defaults to English to Hindi.",
    react: "🗣️",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const fullArgs = args.join(" ");
        
        // Example format: .translate [lang1:lang2] Your text here
        // If no language codes are given, use default 'en:hi'
        
        let textToTranslate = fullArgs;
        let sourceLang = 'en'; // Default source language
        let targetLang = 'hi'; // Default target language

        // Check if the user provided custom language codes (e.g., fr:en)
        const langRegex = /^(\w{2}):(\w{2})\s+(.+)/;
        const match = fullArgs.match(langRegex);

        if (match) {
            sourceLang = match[1].toLowerCase(); // e.g., 'fr'
            targetLang = match[2].toLowerCase(); // e.g., 'en'
            textToTranslate = match[3];          // The actual text
        }
        
        if (!textToTranslate) {
            return reply(`Kripya anuvaad karne ke liye text dein!
Example (Default EN -> HI):
*.translate Hello, how are you?*

Example (Custom Language DE -> EN):
*.translate de:en Wie geht es dir?*`);
        }

        // 1. Construct the full API URL with all parameters
        const encodedText = encodeURIComponent(textToTranslate);
        const searchUrl = `${API_BASE_URL}${encodedText}&lang1=${sourceLang}&lang2=${targetLang}`;

        await reply(`🗣️ Translating from *${sourceLang.toUpperCase()}* to *${targetLang.toUpperCase()}*...`);

        // 2. Make the API request
        const { data } = await axios.get(searchUrl);

        // 3. Process the response (Assuming the API returns translated text in data.translated)
        if (!data || data.status !== 200 || !data.translated) {
            // Log for debugging
            console.error("API returned insufficient data or non-200 status:", data);
            
            return reply("Anuvaad (Translation) karne mein error aaya ya API ne koi valid response nahi diya. Kripya check karein ki aapne sahi language code (jaise en, hi, es) use kiya hai.");
        }

        // 4. Send the final formatted message
        const responseText = `*🗣️ Translation Result (${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}):*\n\n` + 
                             `*Original:* ${textToTranslate}\n` +
                             `*Translated:* ${data.translated}`;
                             
        await reply(responseText);
        
    } catch (error) {
        // Log detailed error for debugging
        console.error("Error in translate command:", error);
        if (error.response) {
            console.error("API Response Status:", error.response.status);
            reply(`❌ Sorry, translation API se data fetch karne mein error aaya. Status Code: ${error.response.status}`);
        } else {
            reply("❌ Sorry, anuvaad command mein koi samasya (problem) aayi. Kripya phir se try karein.");
        }
    }
});
