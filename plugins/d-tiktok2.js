const { cmd } = require('../command');
const fetch = require('node-fetch'); // Assuming node-fetch is available
const cheerio = require('cheerio'); // Assuming cheerio is available

// --- Scraper Functions ---

// Scraper 1: shortstatusvideos.com
async function animeVideo() {
    const url = 'https://shortstatusvideos.com/anime-video-status-download/';
    try {
        const response = await fetch(url, { timeout: 15000 });
        const html = await response.text();
        const $ = cheerio.load(html);
        const videos = [];
        
        // Targetting links with the specific class and finding the preceding title
        $('a.mks_button.mks_button_small.squared').each((i, el) => {
            const href = $(el).attr('href');
            // Try to find the title from the strong tag preceding the button's parent paragraph
            const titleElement = $(el).closest('p').prevAll('p').find('strong').first();
            const title = titleElement.text().trim() || `Video ${i + 1}`;
            
            if (href && title.length > 5) {
                videos.push({ title, source: href });
            }
        });
        
        if (videos.length === 0) throw new Error("Source 1 se koi video nahi mila.");

        // Return a random video
        const randomIndex = Math.floor(Math.random() * videos.length);
        return videos[randomIndex];
    } catch (err) {
        throw new Error(`Source 1 (shortstatusvideos) fail ho gaya: ${err.message}`);
    }
}

// Scraper 2: mobstatus.com
async function animeVideo2() {
    const url = 'https://mobstatus.com/anime-whatsapp-status-video/';
    try {
        const response = await fetch(url, { timeout: 15000 });
        const html = await response.text();
        const $ = cheerio.load(html);
        const videos = [];
        
        // Targetting links with the specific class
        $('a.mb-button.mb-style-glass.mb-size-tiny.mb-corners-pill.mb-text-style-heavy').each((i, el) => {
            const href = $(el).attr('href');
            // Title extraction is very broad here, using a fixed title for simplicity/reliability
            const title = $('h1.entry-title').text().trim() || 'Anime Status Video';
            
            if (href) {
                videos.push({ title, source: href });
            }
        });
        
        if (videos.length === 0) throw new Error("Source 2 se koi video nahi mila.");

        // Return a random video
        const randomIndex = Math.floor(Math.random() * videos.length);
        return videos[randomIndex];
    } catch (err) {
        throw new Error(`Source 2 (mobstatus) fail ho gaya: ${err.message}`);
    }
}


cmd({
    pattern: "amv",
    alias: ["animevideo"],
    use: '.amv <1|2>',
    react: "🍏",
    desc: "2 alag websites se random anime video status download karta hai.", // Downloads random anime video status from 2 different sites.
    category: "anime",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        // 1. Initial Checks
        await conn.sendMessage(from, { react: { text: '🍏', key: m.key } });

        if (!q) return reply(`❌ Kripya number daalein (1 ya 2).\n\n*1 - Anime Status (Source 1)*\n*2 - Anime Status (Source 2)*\n\n*Udaharan:* ${prefix + command} 1`);
        
        const selection = q.trim();

        await reply('⏳ Video laya jaa raha hai...');

        let resl;
        
        // 2. Execute based on user input
        if (selection === '1') {
            resl = await animeVideo();
        } else if (selection === '2') {
            resl = await animeVideo2();
        } else {
            return reply('❌ Number galat hai! Kripya sirf 1 ya 2 chunein.');
        }

        // 3. Final Check and Send
        if (!resl || !resl.source) {
             throw new Error("Video link nikalne mein vifal rahe.");
        }

        await conn.sendMessage(
            from, 
            { 
                video: { url: resl.source }, 
                caption: `✅ *Anime Status Video*\nTitle: ${resl.title}` 
            }, 
            { quoted: mek }
        );
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("AMV Command Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`⚠️ Maaf, video laate samay truti aayi: ${e.message}`);
    }
});

