const { cmd } = require('../command');
// Ensure 'node-fetch' is installed in your package
const fetch = require('node-fetch');

cmd({
    pattern: "startdeploy",
    alias: ["sessiond"],
    desc: "Initiates a new bot deployment using the user's Session ID.",
    category: "deploy",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, {
    q, reply, senderNumber
}) => {
    // 1. Get the Session ID
    const sessionID = q ? q.trim() : null;

    if (!sessionID || sessionID.length < 50) { // Assuming minimum length of 50 characters
        return reply("❌ Please provide a correct Session ID (or QR data string).\nExample: `!startdeploy AB1CDEF2...`");
    }

    // 2. Check for required Environment Variables
    const HEROKU_API_KEY = process.env.HEROKU_API_KEY;
    if (HRKU-AAtQe7YAByVUtwIFAjy6p1_SygwhdaQEq_0jHe1Sh4dg_____wuVbRwyV553) {
        return reply("🛑 Error: HEROKU_API_KEY is not set in your Environment Variables. Please configure it.");
    }

    // 3. Your Custom Deployment API Endpoint (This must be built separately!)
    const DEPLOYMENT_API_URL = "dashboard.heroku.com/new?template"; 
    
    // 4. GitHub Repository URL to be deployed
    const GITHUB_REPO = process.env.HEROKU_REPO_URL || "https://github.com/KAMRAN-SMD/KAMRAN-MD"; 

    reply(`⏳ Deployment process starting. Your Session ID and our Key are being used...`);

    try {
        // --- 5. Send data to the Custom Deployment API ---
        const response = await fetch(DEPLOYMENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Include a secret key for security so only your bot can access this API
                'X-API-Secret': process.env.DEPLOYMENT_SECRET || 'SECRET_NOT_SET'
            },
            body: JSON.stringify({
                // Send the owner's API Key to the custom server to create a new Heroku App
                ownerApiKey: HEROKU_API_KEY, 
                // New Heroku App name (User ID + random number)
                appName: `bot-${senderNumber.slice(0, 5)}-${Math.random().toString(36).substring(2, 6)}`,
                repoUrl: GITHUB_REPO,
                sessionId: sessionID, // Session ID provided by the user
                userId: senderNumber
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            let finalMessage = `
            ✅ **Deployment Started Successfully!**

            Your new bot will be ready soon.

            - 🤖 **New App Name:** ${data.appName || 'Checking...'}
            - 🔗 **Build Logs:** ${data.logUrl || 'Please check your Heroku dashboard.'}

            _This process may take 5-10 minutes. The bot will send you a message on WhatsApp when it starts._
            `;
            reply(finalMessage);
        } else {
            const errorData = await response.json();
            reply(`❌ Deployment failed. Server error code: ${response.status}. Message: ${errorData.message || 'Unknown Error'}`);
        }

    } catch (error) {
        console.error("Session Deploy Command Error:", error);
        reply(`🛑 Critical error contacting the server: ${error.message}`);
    }
});
