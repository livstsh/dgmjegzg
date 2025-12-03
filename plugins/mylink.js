const { cmd } = require('../command');
const fetch = require('node-fetch'); // Assuming node-fetch is available

cmd({
    pattern: "groupsearch",
    alias: ["procurargrupo", "carigrup", "wacari"],
    desc: "Keywords ka upyog karke WhatsApp groups khojta hai.", // Searches WhatsApp groups using keywords.
    category: "search",
    react: "👥",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command }) => {
    try {
        if (!q) {
            return reply(`❌ Kripya woh shabd ya topic dein jise aap khojna chahte hain.\n\n*Udaharan:*\n${prefix + command} cricket`); // Please provide keywords to search.
        }

        await reply(`⏳ *"${q}"* se sambandhit WhatsApp groups khoje ja rahe hain...`); // Searching WhatsApp groups...

        // 1. Fetch data from the external API
        const res = await fetch(`https://api.platform.web.id/whatsapp-groups?keywords=${encodeURIComponent(q)}`, { timeout: 20000 });
        
        // Check for non-200 status or failed fetch
        if (!res.ok) {
            throw new Error(`API se connection fail ho gaya. Status: ${res.status}`);
        }
        
        const json = await res.json();

        // 2. Check if any groups were found
        if (!json.groups || json.groups.length === 0) {
            await conn.sendMessage(from, { react: { text: '🤷‍♀️', key: m.key } });
            return reply('🤷‍♀️ Maaf karein, koi group nahi mila ¯\\_(ツ)_/¯'); // No groups found.
        }

        // 3. Format the search results
        const resposta = json.groups
          .slice(0, 15) // Limit to 15 results for cleaner output
          .map((g, i) => 
            `*${i + 1}. ${g.Name}*\n` +
            `🔗 *Link:* ${g.Link}\n` +
            `📝 *Description:* ${g.Description || 'Koi description nahi'}`
          )
          .join('\n\n');

        const finalMessage = `
👥 *WhatsApp Group Search Results* 👥
*Total Groups Found:* ${json.groups.length} (Top 15 dikhaye ja rahe hain)
----------------------------------------

${resposta}

_© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN_`;

        // 4. Send the result
        await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Group Search Command Error:", e);
        reply(`⚠️ Group khojte samay truti aayi: ${e.message}`); // Error occurred while searching.
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
