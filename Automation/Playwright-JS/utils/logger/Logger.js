// Logger.js
// Logging utility for the automation framework

/**
 * Storage for logs
 * @type {Array<{timestamp: string, message: string, type: string}>}
 */
const logs = [];

/**
 * Log with timestamp and optional color
 * @param {string} message - Log message
 * @param {string} type - Log type (info, success, error, warn)
 */
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colorCode = type === 'error' ? '\x1b[31m' : 
                     type === 'success' ? '\x1b[32m' : 
                     type === 'warn' ? '\x1b[33m' : '\x1b[0m';
    console.log(`${colorCode}[${timestamp}] ${message}\x1b[0m`);
    
    // Store log for report
    logs.push({
        timestamp,
        message,
        type
    });
}

/**
 * Clear stored logs
 */
function clearLogs() {
    logs.length = 0;
}

/**
 * Get all stored logs
 * @returns {Array<{timestamp: string, message: string, type: string}>}
 */
function getLogs() {
    return [...logs];
}

module.exports = {
    log,
    clearLogs,
    getLogs
};
