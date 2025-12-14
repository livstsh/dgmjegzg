const axios = require("axios");
const { cmd, commands } = require("../command");

// API URL for fetching crypto market data
const API_URL = "https://zelapioffciall.koyeb.app/live/market";

cmd({
    pattern: "crypto",
    alias: ["market", "coinprice"],
    react: "📈",
    desc: "Displays real-time crypto market cap and price updates. Use without argument for top 10, or with rank number for specific coin.",
    category: "info",
    filename: __filename,
},
async (conn, m, store, { from, quoted, args, q, reply, text }) => {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // 1. Fetch data from the API
        const response = await axios.get(API_URL);
        const json = response.data;

        // 2. Validate response structure
        if (!json.status || !Array.isArray(json.data)) {
            console.error("Crypto Market API Response Invalid:", json);
            throw new Error("Invalid response structure from API.");
        }

        let output = `*📈 MARKET CRYPTO UPDATE*\n`;
        // Assuming json.total is a count or identifier, as used in original code
        output += `*🌍 Total Market:* ${json.total || 'N/A'}\n\n`;

        let data;

        if (!text) {
            // No argument: Show Top 10
            data = json.data.slice(0, 10);
            output += `_Showing Top 10 Coins (Use .crypto [rank] for specific coin)_\n\n`;
        } else {
            // Argument provided: Filter by rank
            const rank = parseInt(text);
            if (isNaN(rank) || rank < 1) {
                throw new Error("Invalid rank. Kripya sahi market rank (number) dein.");
            }

            // Filter the data based on market_cap_rank
            data = json.data.filter(v => v.market_cap_rank === rank);
            
            if (!data.length) {
                return reply(`🍂 *Market rank #${rank} market data mein nahi mila.*`);
            }
        }
        
        // 3. Format the output data
        for (let c of data) {
            // Determine trend emoji
            const trend =
                c.price_change_percentage_24h > 0 ? "🟢" :
                c.price_change_percentage_24h < 0 ? "🔴" : "⚪";
            
            // Format numbers with commas (toLocaleString)
            const marketCap = c.market_cap ? `$${c.market_cap.toLocaleString('en-US')}` : 'N/A';
            const totalVolume = c.total_volume ? `$${c.total_volume.toLocaleString('en-US')}` : 'N/A';
            const circulatingSupply = c.circulating_supply ? c.circulating_supply.toLocaleString('en-US') : 'N/A';

            output += `*#${c.market_cap_rank} ${c.name} (${c.symbol})*\n`;
            output += `💰 *Price:* $${c.current_price.toFixed(4)}\n`;
            output += `${trend} *24h Change:* ${c.price_change_percentage_24h ? c.price_change_percentage_24h.toFixed(2) + '%' : 'N/A'}\n`;
            output += `🏦 *Market Cap:* ${marketCap}\n`;
            output += `🔄 *Volume:* ${totalVolume}\n`;
            output += `📦 *Supply:* ${circulatingSupply}\n\n`;
        }
        
        // Add last update time
        output += `✨ *Update Terakhir:* ${new Date(json.data[0].last_updated).toLocaleString()}`;

        // 4. Send the final formatted message with context
        await conn.sendMessage(
            from,
            {
                text: output,
                contextInfo: {
                    externalAdReply: {
                        title: "Market Crypto Update",
                        body: "Realtime Global Crypto Market",
                        mediaType: 1,
                        thumbnailUrl: "https://files.cloudkuimages.guru/images/9f291dfe14a8.jpg",
                        renderLargerThumbnail: true,
                        sourceUrl: API_URL
                    }
                }
            },
            { quoted: m }
        );
        
    } catch (e) {
        // Log error and send user-friendly message
        console.error("❌ Error in crypto command:", e);
        reply(`🍂 *Gagal mengambil data market crypto.*`);
    } finally {
        await conn.sendMessage(from, { react: { text: "", key: m.key } });
    }
});
