const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "sim",
    alias: ["simdb", "simdata"],
    desc: "Find SIM info",
    category: "tools",
    react: "💎",
    filename: __filename
}, async (conn, m, store, { from, q, reply, isCreator }) => {
    try {
        const sender = m.sender || m.key.participant || m.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        const OWNER_NUMBER = "923035512967";

        if (!isCreator && senderNumber !== OWNER_NUMBER) {
            return reply("⚠️ *Only Bot Owner Use*..");
        }

        if (!q) return reply("*Provide a number!* (Ex: .sim 0319xxxxxxx)");

        let raw = q.replace(/\D/g, '');
        if (raw.startsWith('92')) raw = '0' + raw.slice(2);
        if (raw.length < 10 || raw.length > 11) {
            return reply("*Invalid format!*");
        }

        const number = raw;
        const api = `https://fam-official.serv00.net/api/database.php?number=${number}`;

        await conn.sendMessage(from, {
            react: { text: "🔍", key: m.key }
        });

        const res = await axios.get(api, { timeout: 20000 });
        const resp = res.data;

        if (!resp) return reply("*No Record Found.*");

        // --- Smart Record Detection ---
        let record = null;

        if (Array.isArray(resp)) {
            record = resp[0];
        } else if (Array.isArray(resp.data)) {
            record = resp.data[0];
        } else if (resp.data) {
            record = resp.data;
        } else {
            record = resp;
        }

        if (!record || typeof record !== "object") {
            return reply("*No Record Found.*");
        }

        // --- Universal Field Resolver ---
        const getField = (obj, keys) => {
            for (let k of keys) {
                if (obj[k] && String(obj[k]).trim() !== "") return obj[k];
            }
            return "N/A";
        };

        const name = String(getField(record, [
            "name","Name","NAME","full_name","fullname","owner","Owner","user","User"
        ])).toUpperCase();

        const cnic = getField(record, [
            "cnic","CNIC","cnic_no","cnicNo","id","ID","identity"
        ]);

        const address = String(getField(record, [
            "address","Address","ADDRESS","addr","location","Location","city","City","area","Area"
        ])).toUpperCase();

        const foundNumber = getField(record, [
            "number","Number","mobile","Mobile","phone","Phone","msisdn"
        ]) || number;

        const text = `
┏━━━━━━━━━━━━━━━━━━━┓
   ⭐ *𝐒𝐈𝐌 𝐃𝐄𝐓𝐀𝐈𝐋𝐒* ⭐
┗━━━━━━━━━━━━━━━━━━━┛

👤 *𝐍𝐀𝐌𝐄:* ${name}
🪪 *𝐂𝐍𝐈𝐂:* ${cnic}
📍 *𝐀𝐃𝐃𝐑:* ${address}
📞 *𝐍𝐔𝐌:* ${foundNumber}

✨ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ*`;

        await reply(text);

        await conn.sendMessage(from, {
            react: { text: "✅", key: m.key }
        });

    } catch (e) {
        console.error("SIM CMD ERROR:", e);
        reply("*Internal Error!*");
    }
});