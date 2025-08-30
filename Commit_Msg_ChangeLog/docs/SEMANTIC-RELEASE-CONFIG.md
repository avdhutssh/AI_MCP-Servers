# Semantic Release Configuration for Custom Tags

If you decide to use semantic-release with your existing `[Tag]` format, this document provides the configuration needed to make it work.

## Overview

While semantic-release is designed for Conventional Commits, it can be configured to work with custom commit formats through plugins and custom parsers.

## Required Dependencies

```bash
npm install --save-dev \
  semantic-release \
  @semantic-release/changelog \
  @semantic-release/git \
  @semantic-release/github \
  @semantic-release/npm \
  conventional-changelog-conventionalcommits
```

## Configuration Files

### 1. Release Configuration (`.releaserc.js`)

```javascript
const customPreset = require('./semantic-release-preset');

module.exports = {
  branches: [
    'main',
    'master',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true }
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          // Breaking changes
          { type: 'Breaking', release: 'major' },
          { type: 'Major', release: 'major' },
          
          // Features
          { type: 'Feature', release: 'minor' },
          { type: 'Improvement', release: 'minor' },
          { type: 'New', release: 'minor' },
          
          // Fixes
          { type: 'Fix', release: 'patch' },
          { type: 'Security', release: 'patch' },
          { type: 'Performance', release: 'patch' },
          { type: 'WCAG', release: 'patch' },
          { type: 'Liveness', release: 'patch' },
          
          // Documentation
          { type: 'Docs', release: 'patch' },
          { type: 'Documentation', release: 'patch' },
          
          // No release
          { type: 'Chore', release: false },
          { type: 'Style', release: false },
          { type: 'Refactor', release: false },
          { type: 'Test', release: false }
        ],
        parserOpts: {
          // Custom parser for [Tag] format
          headerPattern: /^\[([^\]]+)\](?:\s+\[([^\]]+)\])?\s+(.*)$/,
          headerCorrespondence: ['type', 'scope', 'subject']
        }
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        parserOpts: {
          headerPattern: /^\[([^\]]+)\](?:\s+\[([^\]]+)\])?\s+(.*)$/,
          headerCorrespondence: ['type', 'scope', 'subject']
        },
        writerOpts: {
          transform: (commit, context) => {
            // Transform commits for changelog
            const issues = [];
            
            // Map your tags to conventional types for grouping
            const typeMapping = {
              'Breaking': 'BREAKING CHANGES',
              'Major': 'BREAKING CHANGES',
              'Feature': 'Features',
              'Improvement': 'Features', 
              'New': 'Features',
              'Fix': 'Bug Fixes',
              'Security': 'Security Fixes',
              'Performance': 'Performance Improvements',
              'WCAG': 'Accessibility',
              'Liveness': 'Features',
              'Docs': 'Documentation',
              'Documentation': 'Documentation'
            };
            
            commit.type = typeMapping[commit.type] || commit.type;
            
            // Add badges to subject
            if (commit.scope && commit.scope !== commit.type) {
              commit.subject = `![${commit.type}] ![${commit.scope}] ${commit.subject}`;
            } else {
              commit.subject = `![${commit.type}] ${commit.subject}`;
            }
            
            return commit;
          },
          groupBy: 'type',
          commitGroupsSort: (a, b) => {
            const order = [
              'BREAKING CHANGES',
              'Features', 
              'Bug Fixes',
              'Security Fixes',
              'Performance Improvements',
              'Accessibility',
              'Documentation'
            ];
            return order.indexOf(a.title) - order.indexOf(b.title);
          }
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: `[Improvement]: https://img.shields.io/badge/Improvement-green 'Improvement'
[Fix]: https://img.shields.io/badge/Fix-success 'Fix'
[WCAG]: https://img.shields.io/badge/WCAG-8A2BE2 'WCAG'
[Liveness]: https://img.shields.io/badge/Liveness-F7EC09 'Liveness'
[Feature]: https://img.shields.io/badge/Feature-blue 'Feature'
[Breaking]: https://img.shields.io/badge/Breaking-red 'Breaking'
[Security]: https://img.shields.io/badge/Security-orange 'Security'
[Performance]: https://img.shields.io/badge/Performance-yellow 'Performance'
[Docs]: https://img.shields.io/badge/Docs-lightgrey 'Docs'

# Change Log
All notable changes, such as SDK releases, updates and fixes, are documented in this file.`
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false // Set to true if you want to publish to npm
      }
    ],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
        releasedLabels: false
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: '[Docs] Release ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
};
```

### 2. Custom Commit Parser (`semantic-release-parser.js`)

```javascript
const parser = require('conventional-commits-parser');

/**
 * Custom parser for [Tag] format commits
 */
function parseCommit(commit) {
  const options = {
    headerPattern: /^\[([^\]]+)\](?:\s+\[([^\]]+)\])?\s+(.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject'],
    noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
    revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
    revertCorrespondence: ['header', 'hash']
  };
  
  const parsed = parser.sync(commit, options);
  
  // Handle multiple tags in one commit
  if (parsed.header) {
    const multiTagMatch = parsed.header.match(/^\[([^\]]+)\](?:\s+\[([^\]]+)\])*\s+(.*)$/);
    if (multiTagMatch) {
      const allTags = parsed.header.match(/\[([^\]]+)\]/g);
      if (allTags && allTags.length > 1) {
        // Use the first tag for type, store others in scope or notes
        parsed.type = allTags[0].slice(1, -1);
        parsed.scope = allTags.slice(1).map(tag => tag.slice(1, -1)).join(', ');
      }
    }
  }
  
  return parsed;
}

module.exports = { parseCommit };
```

### 3. GitHub Actions Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main
      - master
      - beta
      - alpha

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

## Limitations and Considerations

### 1. Complex Configuration
The configuration above is complex and may require maintenance as your needs evolve.

### 2. Badge Rendering
Semantic-release doesn't natively support your badge format. The configuration attempts to preserve it, but results may vary.

### 3. Multiple Tags per Commit
Handling multiple tags like `[Improvement] [WCAG]` requires custom parsing and may not work perfectly.

### 4. Version Section Format
Your current format `## SDK Version: __0.3.5__` differs from semantic-release's default format.

## Alternative: Hybrid Approach

If you want some semantic-release benefits without full migration:

### 1. Use semantic-release for automation only
```javascript
// Minimal .releaserc.js
module.exports = {
  plugins: [
    '@semantic-release/github',  // Only GitHub releases
    '@semantic-release/git'      // Only version bumping
  ]
};
```

### 2. Keep using our custom changelog generator
```bash
# In your CI/CD
npm run changelog  # Our custom solution
npx semantic-release  # Only for releases
```

## Migration Strategy

If you decide to adopt semantic-release:

### Phase 1: Parallel Testing
1. Set up semantic-release in a test branch
2. Compare output with our custom solution
3. Refine configuration based on results

### Phase 2: Gradual Migration
1. Start using semantic-release for releases only
2. Keep custom changelog generation
3. Gradually adopt more semantic-release features

### Phase 3: Full Migration (Optional)
1. Migrate to Conventional Commits format
2. Use semantic-release for everything
3. Archive custom solution

## Recommendation

Given the complexity of making semantic-release work with your existing format, **we recommend starting with our custom solution**. It provides:

- ✅ Immediate compatibility with your format
- ✅ Simpler configuration and maintenance
- ✅ All the features you need
- ✅ Easy migration path to semantic-release later if needed

The custom solution can serve as a bridge while you evaluate whether the additional complexity of semantic-release is worth the benefits for your specific use case.