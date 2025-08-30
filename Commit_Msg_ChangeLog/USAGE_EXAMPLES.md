# Usage Examples

This document provides practical examples of how to use the automated changelog generation system in various scenarios.

## Basic Usage Examples

### Example 1: Simple Feature Development

**Scenario**: Adding a new user authentication feature

```bash
# Start development
git checkout -b feature/user-auth

# Make commits with proper tags
git commit -m "[Feature] Add user registration endpoint"
git commit -m "[Fix] [Security] Validate email format in registration"
git commit -m "[Improvement] [WCAG] Add screen reader support to login form"
git commit -m "[Docs] Update API documentation for auth endpoints"

# Update version for release
npm run version:analyze
# Output: Suggested version bump: 0.3.6 → 0.4.0 (minor)

npm run version:bump minor
# Updates package.json version to 0.4.0

# Generate changelog
npm run changelog
```

**Generated Changelog Section**:
```markdown
## SDK Version: __0.4.0__

- ![Feature] Add user registration endpoint
- ![Fix] ![Security] Validate email format in registration  
- ![Improvement] ![WCAG] Add screen reader support to login form
- ![Docs] Update API documentation for auth endpoints

---
```

### Example 2: Bug Fix Release

**Scenario**: Fixing critical bugs for patch release

```bash
# Bug fix commits
git commit -m "[Fix] Resolve memory leak in image processing"
git commit -m "[Fix] [Performance] Optimize database queries"
git commit -m "[Security] Update dependencies to fix vulnerabilities"

# Check version suggestion
npm run version:analyze
# Output: Suggested version bump: 0.4.0 → 0.4.1 (patch)

npm run version:bump patch
npm run changelog
```

**Generated Changelog Section**:
```markdown
## SDK Version: __0.4.1__

- ![Fix] Resolve memory leak in image processing
- ![Fix] ![Performance] Optimize database queries
- ![Security] Update dependencies to fix vulnerabilities

---
```

### Example 3: Breaking Change Release

**Scenario**: Major API changes requiring version 1.0.0

```bash
# Breaking change commits
git commit -m "[Breaking] Change authentication API response format"
git commit -m "[Breaking] Remove deprecated v1 endpoints"
git commit -m "[Improvement] Add comprehensive error handling"
git commit -m "[Docs] Update migration guide for v1.0.0"

npm run version:analyze
# Output: Suggested version bump: 0.4.1 → 1.0.0 (major)

npm run version:bump major
npm run changelog
```

**Generated Changelog Section**:
```markdown
## SDK Version: __1.0.0__

- ![Breaking] Change authentication API response format
- ![Breaking] Remove deprecated v1 endpoints
- ![Improvement] Add comprehensive error handling
- ![Docs] Update migration guide for v1.0.0

---
```

## Advanced Usage Examples

### Example 4: Multiple Tags per Commit

**Scenario**: Commits that span multiple categories

```bash
git commit -m "[Improvement] [WCAG] [Performance] Optimize image loading with lazy loading and alt text"
git commit -m "[Fix] [Liveness] [Security] Resolve authentication bypass in liveness check"
```

**Generated Changelog**:
```markdown
- ![Improvement] ![WCAG] ![Performance] Optimize image loading with lazy loading and alt text
- ![Fix] ![Liveness] ![Security] Resolve authentication bypass in liveness check
```

### Example 5: Monorepo Usage

**Scenario**: Managing changelogs for different packages

```bash
# Frontend package changelog
node src/changelog-generator.js \
  --package packages/frontend/package.json \
  --changelog packages/frontend/CHANGELOG.md

# Backend package changelog  
node src/changelog-generator.js \
  --package packages/backend/package.json \
  --changelog packages/backend/CHANGELOG.md
```

### Example 6: Custom Badge Configuration

**Scenario**: Adding project-specific tags

```javascript
// custom-config.js
const ChangelogGenerator = require('./src/changelog-generator');

const generator = new ChangelogGenerator({
  badges: {
    'API': '![API](https://img.shields.io/badge/API-blue)',
    'UI': '![UI](https://img.shields.io/badge/UI-green)', 
    'Database': '![Database](https://img.shields.io/badge/Database-orange)'
  },
  tagMappings: {
    'db': 'Database',
    'frontend': 'UI',
    'backend': 'API'
  }
});

generator.run();
```

**Usage**:
```bash
git commit -m "[db] Optimize user query performance"
git commit -m "[frontend] Add dark mode toggle"
git commit -m "[backend] Implement rate limiting"
```

**Generated Changelog**:
```markdown
- ![Database] Optimize user query performance
- ![UI] Add dark mode toggle
- ![API] Implement rate limiting
```

## CI/CD Integration Examples

### Example 7: GitHub Actions with Auto-commit

```yaml
name: Auto-update Changelog

on:
  push:
    branches: [main]

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_TOKEN }}  # Personal Access Token
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate changelog
        run: npm run changelog
        
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          if ! git diff --quiet HEAD -- CHANGELOG.md; then
            git add CHANGELOG.md
            git commit -m "[Docs] Update changelog for v$(node -p 'require("./package.json").version')"
            git push
          fi
```

### Example 8: Conditional Release Based on Commits

```yaml
name: Conditional Release

on:
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    outputs:
      should-release: ${{ steps.check.outputs.should-release }}
      version-type: ${{ steps.check.outputs.version-type }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Check if release needed
        id: check
        run: |
          npm ci
          ANALYSIS=$(npm run version:analyze)
          if echo "$ANALYSIS" | grep -q "No version bump needed"; then
            echo "should-release=false" >> $GITHUB_OUTPUT
          else
            echo "should-release=true" >> $GITHUB_OUTPUT
            VERSION_TYPE=$(echo "$ANALYSIS" | grep "Type:" | awk '{print $2}')
            echo "version-type=$VERSION_TYPE" >> $GITHUB_OUTPUT
          fi

  release:
    needs: analyze
    if: needs.analyze.outputs.should-release == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Bump version and release
        run: |
          npm ci
          npm run version:bump ${{ needs.analyze.outputs.version-type }}
          npm run changelog
          # Additional release steps...
```

### Example 9: Pull Request Preview

```yaml
name: Changelog Preview

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Generate changelog preview
        id: preview
        run: |
          npm ci
          
          # Create temporary changelog
          cp CHANGELOG.md CHANGELOG.backup.md
          npm run changelog
          
          # Extract new entries
          NEW_ENTRIES=$(git diff CHANGELOG.backup.md CHANGELOG.md | grep '^+' | grep -v '+++' | sed 's/^+//')
          
          # Restore original
          mv CHANGELOG.backup.md CHANGELOG.md
          
          # Set output (escape for GitHub Actions)
          echo "entries<<EOF" >> $GITHUB_OUTPUT
          echo "$NEW_ENTRIES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const entries = `${{ steps.preview.outputs.entries }}`;
            if (entries.trim()) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `## 📝 Changelog Preview\n\nThis PR will add:\n\n${entries}\n\n---\n*Auto-generated preview*`
              });
            }
```

## Testing Examples

### Example 10: Unit Testing Your Changelog

```javascript
// test/changelog.test.js
const ChangelogGenerator = require('../src/changelog-generator');
const fs = require('fs').promises;

describe('Changelog Generation', () => {
  test('should parse commit with multiple tags', () => {
    const generator = new ChangelogGenerator();
    const commit = {
      hash: 'abc123',
      message: '[Fix] [Security] Resolve XSS vulnerability',
      date: '2024-01-01',
      author_name: 'Developer'
    };
    
    const parsed = generator.parseCommit(commit);
    
    expect(parsed.tags).toContain('Fix');
    expect(parsed.tags).toContain('Security');
    expect(parsed.description).toBe('Resolve XSS vulnerability');
  });
  
  test('should suggest correct version bump', async () => {
    const helper = new VersionHelper();
    const commits = [
      { tags: ['Breaking'], description: 'API change' }
    ];
    
    const suggested = await helper.suggestNextVersion(commits);
    expect(suggested).toBe('2.0.0'); // Assuming current is 1.x.x
  });
});
```

### Example 11: Integration Testing

```bash
#!/bin/bash
# test/integration-test.sh

# Setup test environment
mkdir -p test-repo
cd test-repo
git init
echo '{"version": "1.0.0"}' > package.json

# Copy changelog system
cp -r ../src .
cp ../package.json .
npm install

# Create test commits
git add .
git commit -m "Initial commit"
git commit -m "[Fix] Test bug fix"
git commit -m "[Feature] Test new feature"

# Test changelog generation
npm run changelog

# Verify output
if grep -q "## SDK Version: __1.0.0__" CHANGELOG.md; then
  echo "✅ Changelog generation test passed"
else
  echo "❌ Changelog generation test failed"
  exit 1
fi

# Cleanup
cd ..
rm -rf test-repo
```

## Error Handling Examples

### Example 12: Handling Invalid Package.json

```javascript
// Error handling in your scripts
try {
  const generator = new ChangelogGenerator();
  await generator.run();
} catch (error) {
  if (error.message.includes('Invalid version')) {
    console.error('❌ Please ensure package.json has a valid semver version');
    console.log('Example: "version": "1.0.0"');
    process.exit(1);
  } else if (error.message.includes('Failed to read package.json')) {
    console.error('❌ package.json not found or unreadable');
    console.log('Ensure you\'re running from the project root');
    process.exit(1);
  } else {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}
```

### Example 13: Git Repository Validation

```javascript
// Add to changelog-generator.js
async validateGitRepository() {
  try {
    await this.git.status();
  } catch (error) {
    throw new Error('Not a git repository. Please run from a git project root.');
  }
  
  const status = await this.git.status();
  if (status.files.length > 0) {
    console.warn('⚠️  Working directory has uncommitted changes');
    console.log('Consider committing changes before generating changelog');
  }
}
```

## Debugging Examples

### Example 14: Verbose Logging

```bash
# Enable debug mode
DEBUG=changelog npm run changelog

# Or with custom logging
npm run changelog -- --verbose
```

```javascript
// Add to your scripts
const debug = process.env.DEBUG === 'changelog';

function log(message, ...args) {
  if (debug || process.argv.includes('--verbose')) {
    console.log(`🔍 ${message}`, ...args);
  }
}

// Usage
log('Processing commit:', commit.hash, commit.message);
log('Found tags:', commit.tags);
log('Generated entry:', entry);
```

These examples should cover most common usage scenarios and help you implement the changelog system effectively in your workflow.