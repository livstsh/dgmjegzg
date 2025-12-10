const { cmd } = require("../command"); 
const axios = require("axios");

cmd({
    pattern: "ssweb",
    alias: ["screenshot", "ss"],
    desc: "Captures a screenshot of a given webpage URL.",
    react: '📸',
    category: 'tools',
    limit: 1,
    filename: __filename
}, async (conn, m, store, { reply, args }) => {
    
    const url = args[0];

    // --- Input Validation ---
    if (!url) {
        return reply('Please provide a URL to take a screenshot of.\n\nExample: .ssweb https://example.com');
    }

    // Prepend HTTPS if protocol is missing, or default to the provided URL
    const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    try {
        // Validate URL format
        new URL(targetUrl);
    } catch (_) {
        return reply('❌ Invalid URL format. Please provide a valid URL.');
    }

    // --- Screenshot Logic ---
    try {
        await reply(`📸 Capturing screenshot for: ${targetUrl}...`);

        /**
         * Function to call the external screenshot API.
         * @param {string} url - The URL to capture.
         * @param {object} options - Screenshot configuration.
         * @returns {Promise<string>} The URL of the generated image.
         */
        const ssweb = async (url, {
            width = 1280,
            height = 720,
            full_page = false, // Set to true for full page capture
            device_scale = 1
        } = {}) => {
            const {
                data
            } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', {
                url: url,
                browserWidth: parseInt(width),
                browserHeight: parseInt(height),
                fullPage: full_page,
                deviceScaleFactor: parseInt(device_scale),
                format: 'png'
            }, {
                headers: {
                    'content-type': 'application/json',
                    // Setting headers to mimic a browser/app request
                    referer: 'https://imagy.app/full-page-screenshot-taker/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                }
            });
            // The API returns an object containing the fileUrl
            return data.fileUrl; 
        };

        const imageUrl = await ssweb(targetUrl, { full_page: true }); // Capture full page by default

        if (imageUrl) {
            await conn.sendMessage(m.chat, {
                image: {
                    url: imageUrl
                },
                caption: `✅ Screenshot captured successfully.\n\n*Target URL:* ${targetUrl}`
            }, {
                quoted: m
            });
            await store.react('✅');
        } else {
            await store.react('❌');
            reply('❌ Failed to retrieve screenshot. API did not return a valid URL.');
        }

    } catch (e) {
        console.error("SSWEB ERROR:", e.message || e);
        await store.react('❌');
        reply('❌ An error occurred while taking the screenshot. The website might be inaccessible, protected, or the API is down.');
    }
});
