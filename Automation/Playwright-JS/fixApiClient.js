#!/usr/bin/env node

// Script to fix the ApiClient.js file
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils', 'api', 'ApiClient.js');

try {
    console.log(`Reading file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix all template literals with single quotes to use backticks
    content = content.replace(/\'([^']*\${[^']*)+\'/g, (match) => {
        return `\`${match.slice(1, -1)}\``;
    });
    
    // Also fix any mismatched backticks and single quotes
    content = content.replace(/\'([^']*)\`/g, (match, p1) => {
        return `'${p1}'`;
    });
    
    content = content.replace(/\`([^`]*)\'/g, (match, p1) => {
        return `\`${p1}\``;
    });
    
    // Fix log message with embedded template literals
    content = content.replace(/log\('([^']*\${[^']*)+', '([^']*)'\)/g, (match, p1, p2) => {
        return `log(\`${p1}\`, '${p2}')`;
    });
    
    // Write the fixed content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully fixed ApiClient.js');
} catch (error) {
    console.error(`Error: ${error.message}`);
}
