// fixRemainingTemplates.js
// A script to fix all remaining template literals in the codebase

const fs = require('fs');
const path = require('path');

// Function to fix template literals in a file
async function fixTemplateStrings(filePath) {
    try {
        // Read file
        const content = fs.readFileSync(filePath, 'utf8');

        // Replace single quotes with backticks in template literals
        const regex = /'([^']*\${[^']*})'/g;
        const fixed = content.replace(regex, '`$1`');

        // Write back if changes were made
        if (content !== fixed) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`Fixed template literals in: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
        return false;
    }
}

// Function to walk through directory recursively
async function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let fixedCount = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and other build directories
            if (file !== 'node_modules' && file !== 'dist' && file !== 'build') {
                fixedCount += await processDirectory(filePath);
            }
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
            const wasFixed = await fixTemplateStrings(filePath);
            if (wasFixed) fixedCount++;
        }
    }

    return fixedCount;
}

// Main execution
async function main() {
    const rootDir = path.resolve(__dirname);
    console.log(`Scanning directory: ${rootDir}`);
    
    const fixedCount = await processDirectory(rootDir);
    console.log(`Completed. Fixed template literals in ${fixedCount} files.`);
}

main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
});
