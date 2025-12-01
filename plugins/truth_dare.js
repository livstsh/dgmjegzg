const { cmd } = require('../command');

const TRUTHS = [
    "Apni sabse sharmnak galti batao jo tumne pichle 6 mahine mein ki ho.",
    "Woh kaunsi aisi cheez hai jo tum chhipa rahe ho aur koi nahi jaanta?",
    "Tumhari sabse buri aadat kya hai jise tum badalna chahte ho?",
    "Agar tum kisi se shaadi karne jao, to woh sabse buri baat kya hogi jo tumhare bare mein pata chale?",
    "Tumhari sabse zyada crush kis par thi, aur woh kaunsa group member hai?",
    "Tumne last time kab jhoot bola, aur kyun?",
    "Apne phone ki gallery mein maujood woh aakhri cheez dikhao jise tum share nahi karna chahte.",
    "Tumhari sabse ajeeb khwahish kya hai?",
    "Agar tumhe ek din ke liye gayab hone ka mauka mile, to tum kya karoge?"
];

const DARES = [
    "Apni agli 3 messages mein sirf emojis ka istemal karo.",
    "Apni aakhri 5 messages ko kisi dusre group mein forward karo (screenshot bhejo).",
    "Agli 10 minute tak sirf ulti (backward) baat karo.",
    "Apni zuban par ice cube rakho aur ek selfie group mein bhejo.",
    "Group mein 3 messages mein sirf 'BILLA' lafz ka istemal karo, chahe kuch bhi ho.",
    "Apni profile picture 24 ghante ke liye kisi cartoon character ki lagao.",
    "Ek ajeeb awaaz nikalo aur uska voice note group mein bhejo.",
    "Kisi bhi group admin ko 3 line ki shairi (poetry) send karo."
];

cmd({
    pattern: "td",
    alias: ["truthdare", "tosach", "himmat"],
    desc: "Assigns a Truth or Dare challenge to a random user or the replied user.",
    category: "fun",
    react: "😈",
    filename: __filename
},
async (conn, mek, m, {
    from, reply, react, isGroup
}) => {
    try {
        await react("⏳");

        if (!isGroup) {
            await react("❌");
            return reply("❌ *Yeh command sirf group mein chalti hai.*");
        }
        
        // 1. Determine Target User (Reply, Mention, or Random)
        let targetJid = null;
        
        if (m.quoted) {
            // Priority 1: Reply to a message
            targetJid = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            // Priority 2: Mention a user
            targetJid = m.mentionedJid[0];
        } else {
            // Priority 3: Random Selection (The failing point)
            
            // Get Group Participants
            const groupMetadata = await conn.groupMetadata(from);
            
            if (!groupMetadata || !groupMetadata.participants) {
                 await react("❌");
                 return reply("❌ *Data Error:* Group ke sharikdaar (participants) ki list nahi mil saki.");
            }
            
            const participants = groupMetadata.participants;
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'; 
            
            // Filter: Exclude the Bot
            const playableParticipants = participants.filter(p => p.id !== botJid).map(p => p.id);

            if (playableParticipants.length === 0) {
                 await react("❌");
                 return reply("❌ Game shuru karne ke liye kam se kam 1 dusre active member (bot ko chhod kar) ka hona zaroori hai.");
            }
            
            const randomIndex = Math.floor(Math.random() * playableParticipants.length);
            targetJid = playableParticipants[randomIndex];
        }
        
        // --- If targetJid is still not set (which shouldn't happen here) ---
        if (!targetJid) {
            await react("❌");
            return reply("❌ Target user ki ID nahi mil saki. Kripya kisi ko tag ya reply karen.");
        }


        // 2. Select Random Challenge Type (Truth or Dare)
        const targetName = await conn.getName(targetJid) || targetJid.split('@')[0];
        const isTruth = Math.random() < 0.5;
        const challengeList = isTruth ? TRUTHS : DARES;
        const challengeType = isTruth ? "SACH (Truth)" : "HIMMAT (Dare)";
        
        const randomChallengeIndex = Math.floor(Math.random() * challengeList.length);
        const selectedChallenge = challengeList[randomChallengeIndex];

        // 3. Construct the Output Message
        let responseMessage = `*😈 TRUTH OR DARE CHALLENGE!* 😈\n\n`;
        responseMessage += `*Selected Player:* @${targetJid.split('@')[0]} (${targetName})\n`;
        responseMessage += `*Challenge Type:* ${challengeType} ${isTruth ? '✅' : '🔥'}\n\n`;
        responseMessage += `*Challenge:* \n${selectedChallenge}\n\n`;
        responseMessage += `_Jaldi karo! Agar nahi kiya to party deni padegi!_`;
        responseMessage += `\n\n> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *_KAMRAN MD MAX_ ᵀᴹ*`;

        // Send the message with mentions
        await conn.sendMessage(from, { 
            text: responseMessage,
            mentions: [targetJid] // Tag the selected participant
        }, { quoted: m });
        
        await react("✅");

    } catch (error) {
        console.error("Truth or Dare Command Error:", error);
        await react("❌");
        reply("❌ Truth or Dare game shuru karne mein error aaya.");
    }
});
