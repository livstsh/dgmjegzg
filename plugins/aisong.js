const { cmd } = require('../command'); 

cmd({
    pattern: "clear",
    alias: ["delmsg", "clr"],
    desc: "Clears the last message sent by the bot in the current chat.",
    react: '🗑️',
    category: 'owner', 
    owner: true, 
    limit: false,
    filename: __filename
}, async (conn, m, store, { reply }) => {
    
    // Note: In modern multi-device bots, message deletion can be complex,
    // as we usually need the key of the message we want to delete.
    // This command focuses on deleting the message it just sent.
    
    try {
        await store.react('🗑️');
        
        // 1. Send an initial message
        const message = await conn.sendMessage(m.chat, { 
            text: 'Clearing bot messages...' 
        });
        
        const messageKey = message.key; 
        
        // 2. Add a short delay (optional, but ensures the message registers before deletion)
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // 3. Delete the bot's message using the key
        await conn.sendMessage(m.chat, { delete: messageKey });
        
        // Since the success message is deleted instantly, we can't show a success reaction easily,
        // but we assume success if no error was thrown.
        
    } catch (error) {
        console.error('Error clearing messages:', error);
        await store.react('❌');
        // Reply with error, but this message won't be deleted.
        reply('❌ An error occurred while attempting to clear the message.');
    }
});
