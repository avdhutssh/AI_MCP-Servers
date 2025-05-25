// Script to fix template literals in JavaScript files
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix a single file
function fixFile(filePath) {
    console.log(`Processing ${filePath}`);
    try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Fix patterns
        let newContent = content;
        
        // 1. Fix template literals with single quotes
        newContent = newContent.replace(/'([^']*\${[^']*)+'/g, (match) => {
            return `\`${match.slice(1, -1)}\``;
        });
        
        // 2. Fix mismatched quotes and backticks
        newContent = newContent.replace(/'([^']*)(`|\$\{)/g, (match, p1, p2) => {
            return `\`${p1}${p2}`;
        });
        
        newContent = newContent.replace(/(`|\$\{)([^`]*)'/g, (match, p1, p2) => {
            return `${p1}${p2}\``;
        });
        
        // Only write if changes were made
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Fixed: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
        return false;
    }
}

// Main function
function main() {
    // Files to focus on first
    const priorityFiles = [
        './utils/api/ApiClient.js',
        './utils/logger/Logger.js',
        './utils/helpers/Utils.js',
        './tests/api/LoginApiTest.js',
        './tests/ui/AddToCartTest.js'
    ];
    
    // Fix priority files first
    console.log('Fixing priority files...');
    let fixedCount = 0;
    
    priorityFiles.forEach(file => {
        if (fs.existsSync(file)) {
            if (fixFile(file)) {
                fixedCount++;
            }
        } else {
            console.log(`File not found: ${file}`);
        }
    });
    
    // Then find and fix other JS files
    console.log('\nScanning for other JavaScript files...');
    const allJsFiles = glob.sync('**/*.js', { 
        ignore: ['node_modules/**', 'fix*.js'] 
    });
    
    allJsFiles.forEach(file => {
        if (!priorityFiles.includes(file)) {
            if (fixFile(file)) {
                fixedCount++;
            }
        }
    });
    
    console.log(`\nFixed ${fixedCount} files.`);
}

// Run the script
main();
