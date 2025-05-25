@echo off
SETLOCAL EnableDelayedExpansion

echo Fixing JavaScript files in the Playwright-JS directory...

:: Create a temporary PowerShell script to fix the files
echo $files = Get-ChildItem -Path . -Recurse -Include *.js -Exclude node_modules\* > fix_js_files.ps1
echo foreach ($file in $files) { >> fix_js_files.ps1
echo     Write-Host "Processing $($file.FullName)" >> fix_js_files.ps1
echo     $content = Get-Content $file.FullName -Raw >> fix_js_files.ps1
echo     # Fix single quotes with template literals >> fix_js_files.ps1
echo     $content = $content -replace "'([^']*\$\{[^']*)+\'", '`$1`' >> fix_js_files.ps1
echo     # Fix log messages with template expressions >> fix_js_files.ps1
echo     $content = $content -replace "log\('([^']*\$\{[^']*)+', '([^']*)'\)", "log(`$1, '`$2')" >> fix_js_files.ps1
echo     # Fix fetch URLs with template expressions >> fix_js_files.ps1
echo     $content = $content -replace "fetch\('([^']*\$\{[^']*)+", "fetch(`$1" >> fix_js_files.ps1
echo     # Fix request paths with template expressions >> fix_js_files.ps1
echo     $content = $content -replace "request\.(get|post|put|delete)\(\s*'([^']*\$\{[^']*)+", "request.`$1(`$2" >> fix_js_files.ps1
echo     # Fix endpoints in recordApiCall with template expressions >> fix_js_files.ps1
echo     $content = $content -replace "endpoint:\s*'([^']*\$\{[^']*)+", "endpoint: `$1" >> fix_js_files.ps1
echo     # Fix Authorization headers with template expressions >> fix_js_files.ps1
echo     $content = $content -replace "'Authorization': 'Bearer \$\{([^}]+)\}'", "'Authorization': `Bearer `${`$1}`'" >> fix_js_files.ps1
echo     # Save the file >> fix_js_files.ps1
echo     Set-Content $file.FullName $content >> fix_js_files.ps1
echo } >> fix_js_files.ps1

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File fix_js_files.ps1

:: Clean up
del fix_js_files.ps1

echo Done.
