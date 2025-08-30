#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const simpleGit = require('simple-git');
const semver = require('semver');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

class ChangelogGenerator {
  constructor(options = {}) {
    this.git = simpleGit();
    this.packagePath = options.packagePath || 'package.json';
    this.changelogPath = options.changelogPath || 'CHANGELOG.md';
    this.rootDir = options.rootDir || process.cwd();
    
    // Badge definitions matching your current format
    this.badges = {
      'Improvement': '![Improvement]',
      'Fix': '![Fix]',
      'WCAG': '![WCAG]',
      'Liveness': '![Liveness]',
      'Feature': '![Feature]',
      'Breaking': '![Breaking]',
      'Security': '![Security]',
      'Performance': '![Performance]',
      'Docs': '![Docs]'
    };
    
    // Tag mappings for flexibility
    this.tagMappings = {
      'feat': 'Feature',
      'feature': 'Feature',
      'new': 'Feature',
      'add': 'Feature',
      'improvement': 'Improvement',
      'improve': 'Improvement',
      'update': 'Improvement',
      'enhance': 'Improvement',
      'fix': 'Fix',
      'bugfix': 'Fix',
      'hotfix': 'Fix',
      'patch': 'Fix',
      'breaking': 'Breaking',
      'major': 'Breaking',
      'wcag': 'WCAG',
      'accessibility': 'WCAG',
      'a11y': 'WCAG',
      'liveness': 'Liveness',
      'security': 'Security',
      'sec': 'Security',
      'perf': 'Performance',
      'performance': 'Performance',
      'docs': 'Docs',
      'doc': 'Docs',
      'documentation': 'Docs'
    };
  }

  async run(options = {}) {
    try {
      console.log('🚀 Starting changelog generation...');
      
      const packageJson = await this.readPackageJson();
      const currentVersion = packageJson.version;
      
      if (!semver.valid(currentVersion)) {
        throw new Error(`Invalid version in package.json: ${currentVersion}`);
      }
      
      console.log(`📦 Current version: ${currentVersion}`);
      
      const existingChangelog = await this.readChangelog();
      const hasVersionSection = this.hasVersionSection(existingChangelog, currentVersion);
      
      if (options.checkOnly) {
        console.log(hasVersionSection ? 
          '✅ Version section exists' : 
          '❌ Version section missing');
        return hasVersionSection;
      }
      
      const commits = await this.getTaggedCommitsSinceLastVersion(currentVersion);
      
      if (commits.length === 0) {
        console.log('ℹ️  No tagged commits found since last version');
        return;
      }
      
      console.log(`📝 Found ${commits.length} tagged commits`);
      
      const updatedChangelog = await this.updateChangelog(
        existingChangelog, 
        currentVersion, 
        commits, 
        hasVersionSection
      );
      
      await this.writeChangelog(updatedChangelog);
      console.log('✅ Changelog updated successfully!');
      
    } catch (error) {
      console.error('❌ Error generating changelog:', error.message);
      process.exit(1);
    }
  }

  async readPackageJson() {
    try {
      const packagePath = path.join(this.rootDir, this.packagePath);
      const content = await fs.readFile(packagePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  async readChangelog() {
    try {
      const changelogPath = path.join(this.rootDir, this.changelogPath);
      return await fs.readFile(changelogPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create initial changelog structure
        return this.createInitialChangelog();
      }
      throw new Error(`Failed to read changelog: ${error.message}`);
    }
  }

  createInitialChangelog() {
    return `[Improvement]: https://img.shields.io/badge/Improvement-green 'Improvement'
[Fix]: https://img.shields.io/badge/Fix-success 'Fix'
[WCAG]: https://img.shields.io/badge/WCAG-8A2BE2 'WCAG'
[Liveness]: https://img.shields.io/badge/Liveness-F7EC09 'Liveness'
[Feature]: https://img.shields.io/badge/Feature-blue 'Feature'
[Breaking]: https://img.shields.io/badge/Breaking-red 'Breaking'
[Security]: https://img.shields.io/badge/Security-orange 'Security'
[Performance]: https://img.shields.io/badge/Performance-yellow 'Performance'
[Docs]: https://img.shields.io/badge/Docs-lightgrey 'Docs'

# Change Log
All notable changes, such as SDK releases, updates and fixes, are documented in this file.

---

`;
  }

  hasVersionSection(changelog, version) {
    const versionPattern = new RegExp(`## (?:SDK Version: )?__?${this.escapeRegex(version)}__?`, 'i');
    return versionPattern.test(changelog);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getTaggedCommitsSinceLastVersion(currentVersion) {
    try {
      // Get all tags
      const tags = await this.git.tags();
      const validTags = tags.all
        .filter(tag => semver.valid(semver.clean(tag)))
        .sort((a, b) => semver.rcompare(semver.clean(a), semver.clean(b)));
      
      let fromRef = 'HEAD~100'; // Default fallback
      
      if (validTags.length > 0) {
        // Find the most recent tag that's older than current version
        const olderTags = validTags.filter(tag => 
          semver.lt(semver.clean(tag), currentVersion)
        );
        
        if (olderTags.length > 0) {
          fromRef = olderTags[0];
        }
      }
      
      console.log(`🔍 Getting commits from ${fromRef} to HEAD`);
      
      const log = await this.git.log({ from: fromRef, to: 'HEAD' });
      
      return log.all
        .map(commit => this.parseCommit(commit))
        .filter(commit => commit.tags.length > 0)
        .reverse(); // Chronological order
        
    } catch (error) {
      console.warn(`Warning: Could not get git history: ${error.message}`);
      return [];
    }
  }

  parseCommit(commit) {
    const message = commit.message;
    const tags = [];
    
    // Extract tags in [Tag] format
    const tagMatches = message.match(/\[([^\]]+)\]/g);
    
    if (tagMatches) {
      tagMatches.forEach(match => {
        const tag = match.slice(1, -1).toLowerCase().trim();
        const mappedTag = this.tagMappings[tag] || this.capitalizeFirst(tag);
        if (!tags.includes(mappedTag)) {
          tags.push(mappedTag);
        }
      });
    }
    
    // Extract the description (everything after tags)
    let description = message;
    if (tagMatches) {
      // Remove all tags from the beginning
      description = message.replace(/^\s*(?:\[[^\]]+\]\s*)+/, '').trim();
    }
    
    return {
      hash: commit.hash.substring(0, 7),
      message: commit.message,
      description,
      tags,
      date: commit.date,
      author: commit.author_name
    };
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async updateChangelog(existingChangelog, version, commits, hasVersionSection) {
    const lines = existingChangelog.split('\n');
    
    if (hasVersionSection) {
      return this.appendToExistingVersion(lines, version, commits);
    } else {
      return this.createNewVersionSection(lines, version, commits);
    }
  }

  appendToExistingVersion(lines, version, commits) {
    const versionPattern = new RegExp(`## (?:SDK Version: )?__?${this.escapeRegex(version)}__?`, 'i');
    const versionIndex = lines.findIndex(line => versionPattern.test(line));
    
    if (versionIndex === -1) {
      throw new Error(`Version section ${version} not found despite detection`);
    }
    
    // Find the next version section or end of file
    let insertIndex = versionIndex + 1;
    while (insertIndex < lines.length && !lines[insertIndex].startsWith('## ')) {
      insertIndex++;
    }
    
    // Insert new commits before the next section
    const newEntries = this.formatCommits(commits);
    lines.splice(insertIndex, 0, '', ...newEntries);
    
    return lines.join('\n');
  }

  createNewVersionSection(lines, version, commits) {
    // Find where to insert the new version (after the header section)
    let insertIndex = 0;
    let foundHeader = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '---' && foundHeader) {
        insertIndex = i + 1;
        break;
      }
      if (lines[i].startsWith('# Change Log') || lines[i].startsWith('# Changelog')) {
        foundHeader = true;
      }
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const versionHeader = `## SDK Version: __${version}__`;
    const newEntries = this.formatCommits(commits);
    
    const newSection = [
      '',
      versionHeader,
      '',
      ...newEntries,
      '',
      '---'
    ];
    
    lines.splice(insertIndex, 0, ...newSection);
    
    return lines.join('\n');
  }

  formatCommits(commits) {
    const entries = [];
    
    commits.forEach(commit => {
      const badges = commit.tags
        .filter(tag => this.badges[tag])
        .map(tag => this.badges[tag])
        .join(' ');
      
      if (badges && commit.description) {
        entries.push(`- ${badges} ${commit.description}`);
      }
    });
    
    return entries;
  }

  async writeChangelog(content) {
    const changelogPath = path.join(this.rootDir, this.changelogPath);
    await fs.writeFile(changelogPath, content, 'utf8');
  }
}

// CLI Interface
const argv = yargs(hideBin(process.argv))
  .option('check', {
    alias: 'c',
    type: 'boolean',
    description: 'Check if version section exists without updating'
  })
  .option('package', {
    alias: 'p',
    type: 'string',
    description: 'Path to package.json file',
    default: 'package.json'
  })
  .option('changelog', {
    alias: 'o',
    type: 'string',
    description: 'Path to changelog file',
    default: 'CHANGELOG.md'
  })
  .help()
  .argv;

// Run the generator
const generator = new ChangelogGenerator({
  packagePath: argv.package,
  changelogPath: argv.changelog
});

generator.run({ checkOnly: argv.check });

module.exports = ChangelogGenerator;