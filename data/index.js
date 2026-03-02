const { 
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    setAntiEdit,   // Naya function: Edit status set karne ke liye
    getAntiEdit,   // Naya function: Edit status check karne ke liye
    getAllAntiDeleteSettings, 
} = require('./antidel'); // Ensure karein antidel.js mein ye functions hon

const {
    saveContact,
    loadMessage,
    getName,
    getChatSummary,
    saveGroupMetadata,
    getGroupMetadata,
    saveMessageCount,
    getInactiveGroupMembers,
    getGroupMembersMessageCount,
    saveMessage,
} = require('./store');

module.exports = {
    // Anti-Delete & Anti-Edit Settings
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    setAntiEdit, 
    getAntiEdit,
    getAllAntiDeleteSettings,
    
    // Store Functions
    saveContact,
    loadMessage,
    getName,
    getChatSummary,
    saveGroupMetadata,
    getGroupMetadata,
    saveMessageCount,
    getInactiveGroupMembers,
    getGroupMembersMessageCount,
    saveMessage,
};
