# Automated Changelog Generation System

A comprehensive solution for automatically generating and maintaining changelog files based on specially-tagged commit messages and `package.json` versioning.

## 🚀 Features

- **Custom Tag Support**: Uses your existing `[Tag]` format from commit messages
- **Version-Driven**: Automatically manages changelog sections based on `package.json` version
- **Flexible Integration**: Works with existing tools or as a standalone solution
- **CI/CD Ready**: Includes GitHub Actions workflow for automation
- **Semantic Versioning**: Suggests version bumps based on commit analysis
- **Idempotent**: Safe to run multiple times without duplication

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Comparison with Existing Tools](#comparison-with-existing-tools)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## 🏁 Quick Start

1. **Install dependencies**:
   ```bash
   cd Commit_Msg_ChangeLog
   npm install
   ```

2. **Update your package.json version**:
   ```json
   {
     "version": "0.3.6"
   }
   ```

3. **Make commits with tags**:
   ```bash
   git commit -m "[Fix] Resolve issue with user authentication"
   git commit -m "[Improvement] [WCAG] Enhance accessibility features"
   ```

4. **Generate changelog**:
   ```bash
   npm run changelog
   ```

## 📦 Installation

### Prerequisites

- Node.js 16.0.0 or higher
- Git repository with commit history
- `package.json` file with valid semver version

### Setup

1. **Copy the system files** to your project:
   ```
   your-project/
   ├── package.json
   ├── CHANGELOG.md
   ├── src/
   │   ├── changelog-generator.js
   │   └── version-helper.js
   └── .github/
       └── workflows/
           └── changelog.yml
   ```

2. **Install dependencies**:
   ```bash
   npm install simple-git semver yargs --save-dev
   ```

3. **Add scripts to your package.json**:
   ```json
   {
     "scripts": {
       "changelog": "node src/changelog-generator.js",
       "changelog:check": "node src/changelog-generator.js --check",
       "version:analyze": "node src/version-helper.js analyze",
       "version:bump": "node src/version-helper.js bump"
     }
   }
   ```

## 🔧 Usage

### Basic Commands

#### Generate/Update Changelog
```bash
npm run changelog
```

#### Check if Version Section Exists
```bash
npm run changelog:check
```

#### Analyze Commits and Suggest Version Bump
```bash
npm run version:analyze
```

#### Bump Version
```bash
npm run version:bump patch   # 0.3.6 → 0.3.7
npm run version:bump minor   # 0.3.6 → 0.4.0
npm run version:bump major   # 0.3.6 → 1.0.0
```

### Commit Message Format

Use square brackets to tag your commits:

```bash
# Single tag
git commit -m "[Fix] Resolve authentication bug"

# Multiple tags
git commit -m "[Improvement] [WCAG] Add keyboard navigation support"

# Complex message
git commit -m "[Breaking] [Security] Update encryption algorithm - requires API key regeneration"
```

### Supported Tags

| Tag | Badge | Purpose | Version Impact |
|-----|-------|---------|----------------|
| `[Fix]` | ![Fix] | Bug fixes | Patch |
| `[Improvement]` | ![Improvement] | Enhancements | Minor |
| `[Feature]` | ![Feature] | New features | Minor |
| `[Breaking]` | ![Breaking] | Breaking changes | Major |
| `[WCAG]` | ![WCAG] | Accessibility | Patch |
| `[Liveness]` | ![Liveness] | Liveness features | Patch |
| `[Security]` | ![Security] | Security fixes | Patch |
| `[Performance]` | ![Performance] | Performance improvements | Patch |
| `[Docs]` | ![Docs] | Documentation | Patch |

### Tag Aliases

The system supports common aliases:

- `feat`, `feature`, `new`, `add` → `Feature`
- `improve`, `update`, `enhance` → `Improvement`
- `bugfix`, `hotfix`, `patch` → `Fix`
- `major` → `Breaking`
- `accessibility`, `a11y` → `WCAG`
- `perf` → `Performance`
- `doc`, `documentation` → `Docs`

## ⚙️ Configuration

### Custom Configuration

Create a `changelog.config.js` file:

```javascript
module.exports = {
  packagePath: 'package.json',
  changelogPath: 'CHANGELOG.md',
  
  // Custom badge definitions
  badges: {
    'Custom': '![Custom](https://img.shields.io/badge/Custom-purple)',
  },
  
  // Custom tag mappings
  tagMappings: {
    'refactor': 'Improvement',
    'style': 'Improvement',
  }
};
```

### Environment Variables

- `CHANGELOG_PACKAGE_PATH`: Path to package.json (default: `package.json`)
- `CHANGELOG_PATH`: Path to changelog file (default: `CHANGELOG.md`)

## 🔄 CI/CD Integration

### GitHub Actions (Recommended)

The included workflow (`changelog.yml`) automatically:

1. **On Push to Main**: Updates changelog and commits changes
2. **On Pull Requests**: Shows changelog preview in comments
3. **Manual Trigger**: Allows version bump workflows

#### Setup

1. Copy `.github/workflows/changelog.yml` to your repository
2. Ensure GitHub Actions has write permissions:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

### GitLab CI

```yaml
# .gitlab-ci.yml
changelog:
  stage: deploy
  image: node:18
  script:
    - cd Commit_Msg_ChangeLog
    - npm ci
    - npm run changelog
    - |
      if git diff --quiet HEAD -- CHANGELOG.md; then
        echo "No changelog changes"
      else
        git config --global user.email "gitlab-ci@example.com"
        git config --global user.name "GitLab CI"
        git add CHANGELOG.md
        git commit -m "[Docs] Update changelog"
        git push origin $CI_COMMIT_REF_NAME
      fi
  only:
    - main
    - master
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Update Changelog') {
            steps {
                dir('Commit_Msg_ChangeLog') {
                    sh 'npm ci'
                    sh 'npm run changelog'
                    script {
                        if (sh(script: 'git diff --quiet HEAD -- CHANGELOG.md', returnStatus: true) != 0) {
                            sh '''
                                git config --local user.email "jenkins@example.com"
                                git config --local user.name "Jenkins"
                                git add CHANGELOG.md
                                git commit -m "[Docs] Update changelog"
                                git push origin main
                            '''
                        }
                    }
                }
            }
        }
    }
}
```

## 🔍 Comparison with Existing Tools

### vs. Semantic Release

| Feature | Our System | Semantic Release |
|---------|------------|------------------|
| Custom Tags | ✅ `[Fix]`, `[Improvement]` | ❌ Requires Conventional Commits |
| Version Control | ✅ package.json driven | ✅ Git tag driven |
| Setup Complexity | ✅ Simple | ❌ Complex configuration |
| Flexibility | ✅ High | ❌ Opinionated |
| Badge Support | ✅ Built-in | ❌ Requires plugins |

### vs. Conventional Changelog

| Feature | Our System | Conventional Changelog |
|---------|------------|----------------------|
| Custom Format | ✅ Your existing format | ❌ Requires migration |
| Version Management | ✅ Automatic | ❌ Manual |
| CI Integration | ✅ Ready-to-use | ❌ Custom setup needed |

### When to Use Each

**Use Our System When:**
- You have existing `[Tag]` commit format
- You want package.json-driven versioning
- You need simple, immediate setup
- You want flexible badge/tag support

**Use Semantic Release When:**
- You want industry-standard Conventional Commits
- You need complex release workflows
- You're starting a new project
- You want extensive plugin ecosystem

**Use Conventional Changelog When:**
- You only need changelog generation
- You want manual version control
- You're integrating with existing tools

## 🚀 Advanced Usage

### Custom Workflow Integration

```javascript
const ChangelogGenerator = require('./src/changelog-generator');
const VersionHelper = require('./src/version-helper');

async function customWorkflow() {
  const generator = new ChangelogGenerator();
  const helper = new VersionHelper();
  
  // Analyze commits
  const analysis = await helper.analyzeCommits();
  
  // Conditionally bump version
  if (analysis.suggestedVersion !== analysis.currentVersion) {
    await helper.updateVersion(analysis.suggestedVersion);
  }
  
  // Generate changelog
  await generator.run();
}
```

### Monorepo Support

```javascript
// For workspace-specific changelogs
const generator = new ChangelogGenerator({
  packagePath: 'packages/frontend/package.json',
  changelogPath: 'packages/frontend/CHANGELOG.md'
});
```

### Custom Badge System

```javascript
const generator = new ChangelogGenerator({
  badges: {
    'API': '![API](https://img.shields.io/badge/API-blue)',
    'UI': '![UI](https://img.shields.io/badge/UI-green)',
    'DB': '![DB](https://img.shields.io/badge/Database-orange)'
  }
});
```

## 🔧 Troubleshooting

### Common Issues

#### "Invalid version in package.json"
```bash
# Ensure your package.json has valid semver
{
  "version": "1.0.0"  // ✅ Valid
  "version": "v1.0.0" // ❌ Invalid
}
```

#### "No tagged commits found"
```bash
# Ensure your commits use the correct format
git commit -m "[Fix] Your message here"  # ✅ Correct
git commit -m "Fix: Your message here"   # ❌ Wrong format
```

#### Changelog not updating
```bash
# Check if version section already exists
npm run changelog:check

# Force regeneration by bumping version
npm run version:bump patch
npm run changelog
```

### Debugging

Enable debug mode:
```bash
DEBUG=changelog npm run changelog
```

### Performance Optimization

For large repositories:
```javascript
// Limit commit history depth
const generator = new ChangelogGenerator({
  maxCommits: 100
});
```

## 📝 Examples

### Example Workflow

1. **Start development**:
   ```bash
   git checkout -b feature/user-auth
   ```

2. **Make tagged commits**:
   ```bash
   git commit -m "[Feature] Add user registration endpoint"
   git commit -m "[Fix] [Security] Validate email format properly"
   git commit -m "[Improvement] [WCAG] Add screen reader support"
   ```

3. **Update version** (when ready to release):
   ```bash
   # Analyze what version bump is needed
   npm run version:analyze
   
   # Bump version (e.g., minor for new features)
   npm run version:bump minor
   ```

4. **Generate changelog**:
   ```bash
   npm run changelog
   ```

5. **Result in CHANGELOG.md**:
   ```markdown
   ## SDK Version: __0.4.0__
   
   - ![Feature] Add user registration endpoint
   - ![Fix] ![Security] Validate email format properly
   - ![Improvement] ![WCAG] Add screen reader support
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit with tags: `git commit -m "[Feature] Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [AV Web SDK](https://github.com/AV/web-sdk) changelog format
- Built with [simple-git](https://github.com/steveukx/git-js) for Git operations
- Uses [semver](https://github.com/npm/node-semver) for version management