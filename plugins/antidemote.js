// --- 🛡️ ANTI-DEMOTE SYSTEM ---

conn.ev.on('group-participants.update', async (update) => {
    const { id, author, participants, action } = update;

    // چیک کریں کہ کیا ایکشن 'demote' ہے
    if (action === 'demote') {
        const demotedMember = participants[0]; // جسے نکالا گیا
        const demoter = author; // جس نے نکالا

        // اگر بوٹ خود ریموو ہوا ہے تو کچھ نہ کریں
        if (demotedMember === conn.user.id) return;

        try {
            // چیک کریں کہ کیا ریموو کرنے والا (demoter) خود بوٹ تو نہیں
            // تاکہ لوپ نہ بنے
            if (demoter === conn.user.id) return;

            // 1. ریموو کرنے والے کو گروپ سے نکال دیں
            await conn.groupParticipantsUpdate(id, [demoter], "remove");
            
            // 2. جس کو ریموو کیا گیا تھا اسے واپس ایڈمن بنائیں
            await conn.groupParticipantsUpdate(id, [demotedMember], "promote");

            // 3. گروپ میں اطلاع دیں
            await conn.sendMessage(id, { 
                text: `*🛡️ Anti-Demote Triggered!*\n\n⚠️ @${demoter.split('@')[0]} ne ${demotedMember.split('@')[0]} ko admin se hatane ki koshish ki.\n\n❌ Isliye ${demoter.split('@')[0]} ko group se nikal diya gaya hai aur ${demotedMember.split('@')[0]} ko wapas admin bana diya gaya hai.\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ LUCKY MD*`,
                mentions: [demoter, demotedMember]
            });

        } catch (e) {
            console.log("Anti-Demote Error: ", e);
        }
    }
});
cmd({
    pattern: "antidemote",
    desc: "Enable or Disable Anti-Demote system",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    if (!m.isOwner) return reply("❌ Sirf Owner ye setting change kar sakta hai.");
    
    if (args[0] === "on") {
        process.env.ANTI_DEMOTE = 'true';
        reply("✅ Anti-Demote system ab *ON* hai.");
    } else if (args[0] === "off") {
        process.env.ANTI_DEMOTE = 'false';
        reply("❌ Anti-Demote system ab *OFF* hai.");
    } else {
        reply("استعمال: .antidemote on / .antidemote off");
    }
});
