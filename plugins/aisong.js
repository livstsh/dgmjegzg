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
    
    // NOTE: Due to WhatsApp API limitations, deleting all messages in a chat is impossible. 
    // This command only deletes the user's command and the bot's placeholder message.
    
    try {
        await store.react('🗑️');
        
        // 1. Send a temporary placeholder message
        const placeholder = await conn.sendMessage(m.chat, { 
            text: 'Deleting command and cleaning up...' 
        });
        
        // Delay to ensure the messages are registered before deletion
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // 2. Delete the user's original command message (the trigger)
        await conn.sendMessage(m.chat, { delete: m.key });

        // 3. Delete the bot's placeholder message
        await conn.sendMessage(m.chat, { delete: placeholder.key });
        
    } catch (error) {
        console.error('Error clearing messages:', error);
        await store.react('❌');
        reply('❌ Failed to clean up the chat. (Bot may not have admin rights or deletion is restricted)');
    }
});
