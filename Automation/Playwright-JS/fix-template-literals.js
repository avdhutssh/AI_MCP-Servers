#!/usr/bin/env node

// Simple script to fix template literals in JS files
// Converts single quotes with ${} to backticks

const fs = require('fs');
const path = require('path');

// File to process
const filePath = process.argv[2];

if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
}

try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all '${...}' with `${...}`
    // This regex looks for strings with single quotes that contain ${...} pattern
    const fixedContent = content.replace(/'([^']*\${[^']*)+'/g, (match) => {
        // Replace the outer single quotes with backticks
        return `\`${match.slice(1, -1)}\``;
    });
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    
    console.log(`Successfully fixed template literals in ${filePath}`);
} catch (error) {
    console.error(`Error processing file: ${error.message}`);
    process.exit(1);
}
