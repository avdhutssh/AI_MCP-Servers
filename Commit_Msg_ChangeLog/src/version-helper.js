#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const semver = require('semver');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ChangelogGenerator = require('./changelog-generator');

class VersionHelper {
  constructor(options = {}) {
    this.packagePath = options.packagePath || 'package.json';
    this.rootDir = options.rootDir || process.cwd();
  }

  async getCurrentVersion() {
    const packagePath = path.join(this.rootDir, this.packagePath);
    const content = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(content);
    return packageJson.version;
  }

  async updateVersion(newVersion) {
    const packagePath = path.join(this.rootDir, this.packagePath);
    const content = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(content);
    
    packageJson.version = newVersion;
    
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated package.json version to ${newVersion}`);
  }

  async suggestNextVersion(commits) {
    const currentVersion = await this.getCurrentVersion();
    
    const hasBreaking = commits.some(c => 
      c.tags.some(tag => ['Breaking', 'Major'].includes(tag))
    );
    
    const hasFeature = commits.some(c => 
      c.tags.some(tag => ['Feature', 'Improvement', 'New'].includes(tag))
    );
    
    const hasFix = commits.some(c => 
      c.tags.some(tag => ['Fix', 'Security', 'Performance'].includes(tag))
    );
    
    let increment;
    if (hasBreaking) {
      increment = 'major';
    } else if (hasFeature) {
      increment = 'minor';
    } else if (hasFix) {
      increment = 'patch';
    } else {
      return currentVersion; // No version bump needed
    }
    
    return semver.inc(currentVersion, increment);
  }

  async analyzeCommits() {
    const generator = new ChangelogGenerator();
    const currentVersion = await this.getCurrentVersion();
    
    // Get commits since last version
    const commits = await generator.getTaggedCommitsSinceLastVersion(currentVersion);
    
    if (commits.length === 0) {
      console.log('ℹ️  No tagged commits found since last version');
      return;
    }
    
    console.log(`\n📊 Commit Analysis for version ${currentVersion}:`);
    console.log('─'.repeat(50));
    
    const tagCounts = {};
    commits.forEach(commit => {
      commit.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    Object.entries(tagCounts).forEach(([tag, count]) => {
      console.log(`${tag}: ${count} commit${count > 1 ? 's' : ''}`);
    });
    
    const suggestedVersion = await this.suggestNextVersion(commits);
    
    console.log('\n💡 Version Bump Suggestion:');
    console.log(`Current: ${currentVersion}`);
    console.log(`Suggested: ${suggestedVersion}`);
    
    if (suggestedVersion !== currentVersion) {
      const increment = semver.diff(currentVersion, suggestedVersion);
      console.log(`Type: ${increment} bump`);
    } else {
      console.log('Type: No version bump needed');
    }
    
    return { currentVersion, suggestedVersion, commits, tagCounts };
  }

  async bumpVersion(type) {
    const currentVersion = await this.getCurrentVersion();
    const newVersion = semver.inc(currentVersion, type);
    
    if (!newVersion) {
      throw new Error(`Invalid version increment type: ${type}`);
    }
    
    await this.updateVersion(newVersion);
    return newVersion;
  }
}

// CLI Interface
const argv = yargs(hideBin(process.argv))
  .command('analyze', 'Analyze commits and suggest version bump', {}, async () => {
    const helper = new VersionHelper();
    await helper.analyzeCommits();
  })
  .command('bump <type>', 'Bump version by type', 
    (yargs) => {
      yargs.positional('type', {
        describe: 'Version bump type',
        choices: ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease']
      });
    }, 
    async (argv) => {
      const helper = new VersionHelper();
      const newVersion = await helper.bumpVersion(argv.type);
      console.log(`🚀 Version bumped to ${newVersion}`);
    }
  )
  .command('current', 'Show current version', {}, async () => {
    const helper = new VersionHelper();
    const version = await helper.getCurrentVersion();
    console.log(version);
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .argv;

module.exports = VersionHelper;