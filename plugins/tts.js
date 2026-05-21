const googleTTS = require('google-tts-api');

module.exports = {
    name: 'tts',
    alias: ['say', 'texttospeech', 'bol'],
    category: 'utility',
    desc: 'Converts text into an audio voice note.',
    async execute(X, m, { args, text, prefix, command }) {
        try {
            // Agar user ne text nahi diya
            if (!text) {
                return m.reply(`*Example:* ${prefix + command} Hello how are you?\n\n*Urdu/Hindi ke liye:* ${prefix + command} ur Kaise hain aap?`);
            }

            // Default Language English hai
            let lang = 'en'; 
            let textToSpeak = text;

            // Agar pehla word 2 letters ka language code hai (e.g., ur, ar, es, hi)
            if (args[0] && args[0].length === 2) {
                lang = args[0].toLowerCase();
                textToSpeak = args.slice(1).join(' '); // Language code ko text se alag kiya
            }

            // Google TTS single request mein 200 characters allow karta hai
            if (textToSpeak.length > 200) {
                return m.reply(`❌ Text bahut lamba hai! Max 200 characters allow hain.`);
            }

            // API se Audio URL generate karna
            const ttsUrl = googleTTS.getAudioUrl(textToSpeak, {
                lang: lang,
                slow: false, // Agar slow voice chahiye to true karein
                host: 'https://translate.google.com',
            });

            // Voice note (PTT) ke roop mein send karna
            await X.sendMessage(m.chat, {
                audio: { url: ttsUrl },
                mimetype: 'audio/mp4',
                ptt: true // true se direct voice note ban kar jayega
            }, { quoted: m });

        } catch (error) {
            console.error("TTS Error:", error);
            m.reply(`❌ Voice generate nahi ho saki. Please check karein ke language code sahi hai ya nahi.`);
        }
    }
};


