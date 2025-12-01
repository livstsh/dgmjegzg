const { cmd } = require("../command");
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

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
        console.log("Firebase setup complete for note.js");
    } catch (error) {
        console.error("Firebase setup failed:", error);
        // Do not crash, let the command fail gracefully
        isFirebaseReady = false; 
    }
}

// Function to get the correct collection reference for the user
function getUserNotesCollection() {
    const userId = auth.currentUser?.uid || 'anonymous-user';
    // Firestore Path: /artifacts/{appId}/users/{userId}/notes
    return collection(db, `artifacts/${appId}/users/${userId}/notes`);
}

cmd({
    pattern: "note",
    alias: ["remember", "notes"],
    desc: "Sare notes ko save, list, ya delete karta hai.", // Saves, lists, or deletes personal notes.
    category: "utility",
    react: "📝",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        await setupFirebase();
        if (!isFirebaseReady) {
            return reply("❌ Database load nahi ho paya. Kripya bot status check karein.");
        }

        const args = q.split(' ');
        const action = args[0]?.toLowerCase();
        const content = args.slice(1).join(' ');

        // --- 1. LIST NOTES ---
        if (action === 'list' || !action) {
            await reply("⏳ Aapke notes laaye ja rahe hain...");
            const notesQuery = query(getUserNotesCollection());
            const snapshot = await getDocs(notesQuery);

            if (snapshot.empty) {
                return reply("✅ Aapke paas koi note nahi hai.\n\nNaya note save karne ke liye: `.note [text]`");
            }

            let noteList = "📝 *Aapke Saved Notes:* 📝\n\n";
            let index = 1;
            
            // Map document ID to index for easy deletion
            const noteMap = {};
            
            snapshot.forEach(doc => {
                noteList += `${index}. *${doc.data().text}*\n`;
                noteMap[index] = doc.id;
                index++;
            });
            
            // Store map temporarily for reply processing (WARNING: This is local storage, only for immediate use)
            // In a real bot, this would require storing the map in a temporary state/cache.
            // For simplicity, we just display the list and expect the user to reference the number.

            noteList += "\n\nNote delete karne ke liye: `.note delete [number]`";
            return reply(noteList);
        }

        // --- 2. DELETE NOTE ---
        if (action === 'delete') {
            const deleteIndex = parseInt(args[1]);
            if (isNaN(deleteIndex) || deleteIndex < 1) {
                return reply("❌ Kripya sahi note number dein jise aap delete karna chahte hain.\n\nUdaharan: `.note delete 2`");
            }

            const notesQuery = query(getUserNotesCollection());
            const snapshot = await getDocs(notesQuery);
            
            let noteToDeleteId = null;
            let currentIndex = 1;

            snapshot.forEach(doc => {
                if (currentIndex === deleteIndex) {
                    noteToDeleteId = doc.id;
                }
                currentIndex++;
            });

            if (!noteToDeleteId) {
                return reply(`❌ Note number ${deleteIndex} nahi mil paya.`);
            }

            await deleteDoc(doc(db, getUserNotesCollection().path, noteToDeleteId));
            return reply(`✅ Note number ${deleteIndex} ("${snapshot.docs[deleteIndex - 1].data().text}") successfully delete ho gaya.`);
        }

        // --- 3. SAVE NEW NOTE ---
        if (content.length > 0) {
            await addDoc(getUserNotesCollection(), {
                text: content,
                timestamp: new Date().toISOString()
            });
            return reply(`✅ Naya note save ho gaya: *${content}*`);
        }
        
        // If nothing matches, show help
        reply("⚠️ Invalid Note command.\n\nOptions:\n1. Save: `.note [text to save]`\n2. List: `.note list`\n3. Delete: `.note delete [number]`");


    } catch (e) {
        console.error("Note command error:", e);
        reply(`⚠️ Note save karte samay truti aayi: ${e.message}`);
    }
});
