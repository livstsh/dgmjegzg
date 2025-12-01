const { cmd } = require('../command');

const TRUTHS = [
    "Apni sabse sharmnak galti batao jo tumne pichle 6 mahine mein ki ho.",
    "Woh kaunsi aisi cheez hai jo tum chhipa rahe ho aur koi nahi jaanta?",
    "Tumhari sabse buri aadat kya hai jise tum badalna chahte ho?",
    "Agar tum kisi se shaadi karne jao, to woh woh sabse buri baat kya hogi jo tumhare bare mein pata chale?",
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
    desc: "Assigns a Truth or Dare challenge to the sender, or a replied/mentioned user.",
    category: "fun",
    react: "😈",
    filename: __filename
},
async (conn, mek, m, {
    from, reply, react, isGroup, sender, pushname
}) => {
    try {
        await react("⏳"); // Reaction on start

        if (!isGroup) {
            await react("❌");
            return reply("❌ *Yeh command sirf group mein chalti hai.*");
        }
        
        // 1. Determine Target User (Reply, Mention, or Self)
        let targetJid = sender; 
        let targetName = pushname; // Use the sender's current pushname as fallback name
        
        if (m.quoted) {
            targetJid = m.quoted.sender;
            // Name fetching is still risky, so we rely on pushname or number for simplicity
            targetName = m.quoted.pushName || targetJid.split('@')[0];
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetJid = m.mentionedJid[0];
            // Name fetching is still risky, so we rely on number for simplicity
            targetName = targetJid.split('@')[0];
        } 
        
        // 2. Select Random Challenge Type (Truth or Dare)
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

        // 4. Send the message using the reliable REPLY function, not conn.sendMessage
        // This is a last resort to bypass a potential send error.
        await reply(responseMessage);
        
        await react("✅"); // Final success reaction

    } catch (error) {
        console.error("Truth or Dare Command FATAL Error:", error);
        await react("❌");
        reply("❌ Truth or Dare game shuru karne mein aik bari ghalti (error) hui. Kripya dobara koshish karen.");
    }
});
