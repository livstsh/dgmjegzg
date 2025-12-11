const fs = require('fs');
const path = require('path');
const { cmd } = require('../command'); // Assuming 'cmd' utility path

// --- 1. Core Cleanup Logic ---

/**
 * Function to clear the 'tmp' directory synchronously.
 * @returns {{success: boolean, message: string, count?: number, error?: string}} 
 */
function clearTmpDirectory() {
    try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        
        // Check if tmp directory exists
        if (!fs.existsSync(tmpDir)) {
            // Attempt to create it if it doesn't exist, as this is the cleanup utility
            fs.mkdirSync(tmpDir, { recursive: true });
            return { success: true, message: 'Temporary directory was created and is empty!' };
        }

        // Read all files in tmp directory
        const files = fs.readdirSync(tmpDir);
        
        if (files.length === 0) {
            return { success: true, message: 'Temporary directory is already empty!' };
        }

        // Delete each file
        let deletedCount = 0;
        for (const file of files) {
            try {
                const filePath = path.join(tmpDir, file);
                // Ensure we only delete files, not directories (unless they are empty)
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            } catch (err) {
                console.error(`[ClearTMP] Error deleting file ${file}:`, err.message);
            }
        }

        return { 
            success: true, 
            message: `Successfully cleared ${deletedCount} temporary files!`,
            count: deletedCount
        };

    } catch (error) {
        console.error('[ClearTMP] Fatal Error:', error);
        return { 
            success: false, 
            message: 'Failed to clear temporary files!',
            error: error.message
        };
    }
}

// --- 2. Manual Command Handler ---

cmd({
    pattern: "cleartmp",
    alias: ["cleartemp", "clrtmp"],
    desc: "Clears all temporary files from the 'tmp' directory.",
    react: '🧹',
    category: 'owner', // Assuming this is an owner-only command
    owner: true,       // Enforce owner check
    limit: false,
    filename: __filename
}, async (conn, m, store, { reply }) => {
    try {
        // Owner check is handled by the 'owner: true' property in cmd definition.
        
        await store.react('⏳');
        const result = clearTmpDirectory();
        
        if (result.success) {
            await reply(`✅ *SUCCESS*\n\n${result.message}`);
            await store.react('✅');
        } else {
            await reply(`❌ *FAILED*\n\n${result.message}\nDetail: ${result.error || 'Check console logs.'}`);
            await store.react('❌');
        }

    } catch (error) {
        console.error('Error in cleartmp command execution:', error);
        await store.react('❌');
        reply('❌ Failed to clear temporary files due to an unexpected error!');
    }
});


// --- 3. Auto Clear Logic (Executed upon module import/start) ---

/**
 * Starts the automatic clearing process (runs immediately and then every 6 hours).
 */
function startAutoClear() {
    // Run immediately on startup
    const initialRun = clearTmpDirectory();
    console.log(`[Auto Clear Initial Run] ${initialRun.success ? 'Success' : 'Failed'}: ${initialRun.message}`);

    // Set interval for every 6 hours (6 * 60 * 60 * 1000 ms)
    setInterval(() => {
        const result = clearTmpDirectory();
        console.log(`[Auto Clear Interval] ${new Date().toLocaleTimeString()} | ${result.success ? 'Success' : 'Failed'}: ${result.message}`);
    }, 6 * 60 * 60 * 1000); 
}

// Start the automatic clearing when the module loads
startAutoClear();
