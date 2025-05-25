#!/usr/bin/env node

// Script to fix all JavaScript files with template string issues
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all JavaScript files in the project
const files = glob.sync('**/*.js', { ignore: ['node_modules/**', 'fixAllFiles.js'] });

let fixedFiles = 0;
let errorFiles = 0;

files.forEach(file => {
    try {
        console.log(`Processing file: ${file}`);
        let content = fs.readFileSync(file, 'utf8');
        
        // Store original content to check if it changed
        const originalContent = content;
        
        // Fix 1: Replace single quotes with backticks for template strings
        content = content.replace(/\'([^']*\${[^']*)+\'/g, (match) => {
            return `\`${match.slice(1, -1)}\``;
        });
        
        // Fix 2: Fix any mismatched quotes
        content = content.replace(/\'([^']*)\`/g, (match, p1) => {
            return `'${p1}'`;
        });
        
        content = content.replace(/\`([^`]*)\'/g, (match, p1) => {
            return `\`${p1}\``;
        });
        
        // Fix 3: Fix log messages with embedded template literals
        content = content.replace(/log\('([^']*\${[^']*)+', '([^']*)'\)/g, (match, p1, p2) => {
            return `log(\`${p1}\`, '${p2}')`;
        });
        
        // Fix 4: Fix fetch URLs with template literals
        content = content.replace(/fetch\('([^']*\${[^']*)+'/g, (match, p1) => {
            return `fetch(\`${p1}\``;
        });
        
        // Fix 5: Fix request paths with template literals
        content = content.replace(/request\.(get|post|put|delete)\(\s*'([^']*\${[^']*)+'/g, (match, method, p1) => {
            return `request.${method}(\`${p1}\``;
        });
        
        // Fix 6: Fix endpoints in recordApiCall with template literals
        content = content.replace(/endpoint:\s*'([^']*\${[^']*)+'/g, (match, p1) => {
            return `endpoint: \`${p1}\``;
        });
        
        // Only write back if content has changed
        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Fixed file: ${file}`);
            fixedFiles++;
        }
    } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
        errorFiles++;
    }
});

console.log(`Fixed ${fixedFiles} files with ${errorFiles} errors.`);
