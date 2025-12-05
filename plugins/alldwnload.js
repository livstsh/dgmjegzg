const { cmd } = require("../command");
// Firestore Imports (MANDATORY for state persistence)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';

// --- Firebase Configuration (MUST BE INCLUDED) ---
// These variables are provided by the hosting environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

// Initialize Firebase (outside of cmd block for single initialization)
let db, auth;
let isFirebaseReady = false;

async function setupFirebase() {
    if (isFirebaseReady) return;
    
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Authenticate user
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        
        isFirebaseReady = true;
        console.log("Firebase setup complete for addsewa.js");
    } catch (error) {
        console.error("Firebase setup failed:", error);
        isFirebaseReady = false; 
    }
}

// Function to get the correct document path for group rental data
function getSewaDocRef(groupId) {
    // Firestore Path: /artifacts/{appId}/public/data/sewa/{groupId}
    return doc(db, `artifacts/${appId}/public/data/sewa/${groupId}`);
}


cmd({
    pattern: "addsewa",
    alias: ["sewadd", "rentgroup"],
    desc: "Bot ko kisi group mein ek nishchit samay ke liye sewa par deta hai (Owner Only).", // Rents the bot to a group for a specified duration.
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { text, reply, isOwner, from, command }) => {
    
    // Check if Firebase is ready and if the sender is the Owner
    if (!isOwner) return reply("❌ Access Denied. Yeh command sirf *Owner Bot* ke liye hai.");
    if (!m.isGroup) return reply("❌ Kripya yeh command *Group* ke andar istemaal karein.");
    
    await setupFirebase();
    if (!isFirebaseReady) {
        return reply("❌ Database abhi taiyar nahi hai. Kripya thodi der baad try karein.");
    }
    
    const groupId = m.chat.endsWith('@g.us') ? m.chat.split('@')[0] : m.chat;
    const groupName = m.metadata?.subject || "Unknown Group";
    
    if (!text) {
        return reply(
          `📝 *Group Sewa Jodein*\n\n` +
          `Kripya durasi dein:\n` +
          `• ${usedPrefix + command} 7hari\n` +
          `• ${usedPrefix + command} 1bulan\n` +
          `• ${usedPrefix + command} permanen`
        );
    }

    let opt = text.toLowerCase().trim();
    let durasiMs = 0;
    let label = "";
    
    // --- Parse Duration ---
    if (["7", "7d", "7hari", "7 hari"].includes(opt)) {
        durasiMs = 7 * 24 * 60 * 60 * 1000;
        label = "7 Din";
    } else if (["1", "1bulan", "1 bulan", "30hari", "30 hari"].includes(opt)) {
        durasiMs = 30 * 24 * 60 * 60 * 1000;
        label = "1 Mahina";
    } else if (["2", "2bulan", "2 bulan", "60hari", "60 hari"].includes(opt)) {
        durasiMs = 60 * 24 * 60 * 60 * 1000;
        label = "2 Mahine";
    } else if (["permanen", "permanent", "permanen✔️"].includes(opt)) {
        durasiMs = 0;
        label = "Permanently";
    } else {
        return reply(
          `❌ Durasi sahi nahi hai.\n` +
          `Kripya chunein: *7hari*, *1bulan*, *2bulan*, ya *permanen*.`
        );
    }

    try {
        const now = Date.now();
        const expiredAt = durasiMs === 0 ? null : now + durasiMs;
        
        // --- Prepare Data for Firestore ---
        const sewaData = {
            groupName: groupName,
            groupId: groupId,
            by: m.sender,
            startAt: now,
            expiredAt: expiredAt,
            paket: label,
        };

        // --- Save Data to Firestore ---
        // Path: /artifacts/{appId}/public/data/sewa/{groupId}
        await setDoc(getSewaDocRef(groupId), sewaData);

        let teks = `✅ *Sewa Bot Safaltapoorvak Jud Gaya* (Firestore)\n\n` +
                   `• Grup   : *${groupName}*\n` +
                   `• Paket  : *${label}*\n` +
                   `• Owner  : *@${m.sender.split('@')[0]}*\n` +
                   `• Shuru  : *${new Date(now).toLocaleString("en-IN")}*\n`;

        if (expiredAt) {
            teks += `• Khatam: *${new Date(expiredAt).toLocaleString("en-IN")}*`;
        } else {
            teks += `• Khatam: *Permanently*`;
        }

        return conn.sendMessage(from, { text: teks, contextInfo: { mentionedJid: [m.sender] } }, { quoted: mek });

    } catch (e) {
        console.error("Firestore Sewa Add Error:", e);
        return reply(`❌ Database mein data save karte samay truti aayi: ${e.message}`);
    }
});
