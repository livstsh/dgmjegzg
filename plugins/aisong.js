const { cmd } = require('../command'); 

cmd({
    pattern: "clear",
    alias: ["delmsg", "clr"],
    desc: "Deletes the user's command message and the bot's temporary response, cleaning up the chat.",
    react: '🗑️',
    category: 'owner', 
    owner: true, 
    limit: false,
    filename: __filename
}, async (conn, m, store, { reply }) => {
    
    // NOTE: WhatsApp API does not allow bots to delete arbitrary messages or clear all chat history. 
    // This command deletes the user's *command message* and the bot's *placeholder message* // to keep the chat clean.
    
    try {
        await store.react('🗑️');
        
        // 1. Send a temporary placeholder message
        const placeholder = await conn.sendMessage(m.chat, { 
            text: 'Deleting command and cleaning up...' 
        });
        
        // Add a short delay to ensure messages register before deletion
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // 2. Delete the user's original command message (the trigger)
        // Note: Bot must be an admin to delete other users' messages in a group.
        await conn.sendMessage(m.chat, { delete: m.key });

        // 3. Delete the bot's placeholder message
        await conn.sendMessage(m.chat, { delete: placeholder.key });
        
        // Success is silent (no messages left)
        
    } catch (error) {
        console.error('Error clearing messages:', error);
        await store.react('❌');
        // If deletion fails, notify the user. This message will remain.
        reply('❌ Failed to clean up the chat. (Bot may not have admin rights or deletion is restricted)');
    }
});
