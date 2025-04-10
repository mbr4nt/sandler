const fs = require('fs').promises;
const path = require('path');

const outputDir = path.join(__dirname, 'output');
const logFilePath = path.join(outputDir, 'logs.txt');

async function ensureDirectoryExists() {
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
}

function getTimestamp() {
    return new Date().toISOString();
}

async function log(message) {
    try {
        await ensureDirectoryExists();
        const timestamp = getTimestamp();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(message); // Log to console
        await fs.appendFile(logFilePath, logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err);
        throw err; // Re-throw if you want calling code to handle the error
    }
}

module.exports = log;