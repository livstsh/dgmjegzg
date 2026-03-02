const { DATABASE } = require('../lib/database');
const { DataTypes } = require('sequelize');
const config = require('../config');

const AntiDelDB = DATABASE.define('AntiDelete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    status: { // Yeh Anti-Delete ke liye hai
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTI_DELETE || false,
    },
    edit_status: { // Naya field: Yeh Anti-Edit ke liye hai
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTI_EDIT || false, // Make sure config mein ANTI_EDIT define ho
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
    hooks: {
        beforeCreate: record => { record.id = 1; },
        beforeBulkCreate: records => { records.forEach(record => { record.id = 1; }); },
    },
});

let isInitialized = false;

async function initializeAntiDeleteSettings() {
    if (isInitialized) return;
    try {
        await AntiDelDB.sync(); // Naya column 'edit_status' apne aap add ho jayega
        
        await AntiDelDB.findOrCreate({
            where: { id: 1 },
            defaults: { 
                status: config.ANTI_DELETE || false,
                edit_status: config.ANTI_EDIT || false 
            },
        });
        
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing anti-settings:', error);
    }
}

// --- Anti-Delete Set/Get ---
async function setAnti(status) {
    try {
        await initializeAntiDeleteSettings();
        const [affectedRows] = await AntiDelDB.update({ status }, { where: { id: 1 } });
        return affectedRows > 0;
    } catch (error) { return false; }
}

async function getAnti() {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        return record ? record.status : false;
    } catch (error) { return false; }
}

// --- Anti-Edit Set/Get (Naya Logic) ---
async function setAntiEdit(status) {
    try {
        await initializeAntiDeleteSettings();
        const [affectedRows] = await AntiDelDB.update({ edit_status: status }, { where: { id: 1 } });
        return affectedRows > 0;
    } catch (error) { return false; }
}

async function getAntiEdit() {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        return record ? record.edit_status : false;
    } catch (error) { return false; }
}

module.exports = {
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    setAntiEdit, // Export naya function
    getAntiEdit, // Export naya function
};
                
