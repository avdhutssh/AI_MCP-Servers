const fs = require('fs').promises;
const path = require('path');
const ChangelogGenerator = require('../src/changelog-generator');
const VersionHelper = require('../src/version-helper');

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running tests...\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertContains(text, substring, message) {
    if (!text.includes(substring)) {
      throw new Error(message || `Expected text to contain "${substring}"`);
    }
  }
}

// Test setup
const runner = new TestRunner();
const testDir = path.join(__dirname, 'temp');

// Utility functions
async function createTestPackageJson(version = '1.0.0') {
  const packageJson = {
    name: 'test-package',
    version: version,
    description: 'Test package'
  };
  
  await fs.writeFile(
    path.join(testDir, 'package.json'), 
    JSON.stringify(packageJson, null, 2)
  );
}

async function createTestChangelog(content = '') {
  const defaultContent = `[Improvement]: https://img.shields.io/badge/Improvement-green 'Improvement'
[Fix]: https://img.shields.io/badge/Fix-success 'Fix'

# Change Log
All notable changes are documented in this file.

---

${content}`;
  
  await fs.writeFile(
    path.join(testDir, 'CHANGELOG.md'), 
    defaultContent
  );
}

async function setupTestDir() {
  try {
    await fs.mkdir(testDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function cleanupTestDir() {
  try {
    await fs.rmdir(testDir, { recursive: true });
  } catch (error) {
    // Directory doesn't exist or cleanup failed
  }
}

// Tests
runner.test('ChangelogGenerator - Parse commit with single tag', async () => {
  const generator = new ChangelogGenerator();
  
  const commit = {
    hash: 'abc123456789',
    message: '[Fix] Resolve authentication bug',
    date: '2024-01-01',
    author_name: 'Test User'
  };
  
  const parsed = generator.parseCommit(commit);
  
  runner.assertEqual(parsed.tags.length, 1);
  runner.assertEqual(parsed.tags[0], 'Fix');
  runner.assertEqual(parsed.description, 'Resolve authentication bug');
});

runner.test('ChangelogGenerator - Parse commit with multiple tags', async () => {
  const generator = new ChangelogGenerator();
  
  const commit = {
    hash: 'abc123456789',
    message: '[Improvement] [WCAG] Add keyboard navigation support',
    date: '2024-01-01',
    author_name: 'Test User'
  };
  
  const parsed = generator.parseCommit(commit);
  
  runner.assertEqual(parsed.tags.length, 2);
  runner.assert(parsed.tags.includes('Improvement'));
  runner.assert(parsed.tags.includes('WCAG'));
  runner.assertEqual(parsed.description, 'Add keyboard navigation support');
});

runner.test('ChangelogGenerator - Parse commit with no tags', async () => {
  const generator = new ChangelogGenerator();
  
  const commit = {
    hash: 'abc123456789',
    message: 'Regular commit message without tags',
    date: '2024-01-01',
    author_name: 'Test User'
  };
  
  const parsed = generator.parseCommit(commit);
  
  runner.assertEqual(parsed.tags.length, 0);
  runner.assertEqual(parsed.description, 'Regular commit message without tags');
});

runner.test('ChangelogGenerator - Tag mapping works', async () => {
  const generator = new ChangelogGenerator();
  
  const commit = {
    hash: 'abc123456789',
    message: '[feat] Add new feature',
    date: '2024-01-01',
    author_name: 'Test User'
  };
  
  const parsed = generator.parseCommit(commit);
  
  runner.assertEqual(parsed.tags.length, 1);
  runner.assertEqual(parsed.tags[0], 'Feature');
});

runner.test('ChangelogGenerator - Has version section detection', async () => {
  await setupTestDir();
  
  const generator = new ChangelogGenerator({ 
    rootDir: testDir 
  });
  
  // Test with existing version
  await createTestChangelog('## SDK Version: __1.0.0__\n\n- ![Fix] Some fix\n\n---\n');
  
  const changelog = await generator.readChangelog();
  const hasVersion = generator.hasVersionSection(changelog, '1.0.0');
  
  runner.assert(hasVersion, 'Should detect existing version section');
  
  const noVersion = generator.hasVersionSection(changelog, '2.0.0');
  runner.assert(!noVersion, 'Should not detect non-existent version section');
  
  await cleanupTestDir();
});

runner.test('ChangelogGenerator - Format commits correctly', async () => {
  const generator = new ChangelogGenerator();
  
  const commits = [
    {
      tags: ['Fix'],
      description: 'Resolve authentication bug',
      hash: 'abc123',
      message: '[Fix] Resolve authentication bug'
    },
    {
      tags: ['Improvement', 'WCAG'],
      description: 'Add keyboard navigation',
      hash: 'def456',
      message: '[Improvement] [WCAG] Add keyboard navigation'
    }
  ];
  
  const formatted = generator.formatCommits(commits);
  
  runner.assertEqual(formatted.length, 2);
  runner.assertContains(formatted[0], '![Fix]');
  runner.assertContains(formatted[0], 'Resolve authentication bug');
  runner.assertContains(formatted[1], '![Improvement] ![WCAG]');
  runner.assertContains(formatted[1], 'Add keyboard navigation');
});

runner.test('VersionHelper - Suggest version bump based on commits', async () => {
  await setupTestDir();
  await createTestPackageJson('1.0.0');
  
  const helper = new VersionHelper({ rootDir: testDir });
  
  // Test breaking change
  let commits = [{ tags: ['Breaking'], description: 'Breaking change' }];
  let suggested = await helper.suggestNextVersion(commits);
  runner.assertEqual(suggested, '2.0.0');
  
  // Test feature
  commits = [{ tags: ['Feature'], description: 'New feature' }];
  suggested = await helper.suggestNextVersion(commits);
  runner.assertEqual(suggested, '1.1.0');
  
  // Test fix
  commits = [{ tags: ['Fix'], description: 'Bug fix' }];
  suggested = await helper.suggestNextVersion(commits);
  runner.assertEqual(suggested, '1.0.1');
  
  // Test no version bump
  commits = [{ tags: ['Docs'], description: 'Update docs' }];
  suggested = await helper.suggestNextVersion(commits);
  runner.assertEqual(suggested, '1.0.0');
  
  await cleanupTestDir();
});

runner.test('VersionHelper - Read and update package.json version', async () => {
  await setupTestDir();
  await createTestPackageJson('1.0.0');
  
  const helper = new VersionHelper({ rootDir: testDir });
  
  // Read current version
  const currentVersion = await helper.getCurrentVersion();
  runner.assertEqual(currentVersion, '1.0.0');
  
  // Update version
  await helper.updateVersion('1.1.0');
  const newVersion = await helper.getCurrentVersion();
  runner.assertEqual(newVersion, '1.1.0');
  
  await cleanupTestDir();
});

runner.test('ChangelogGenerator - Create new version section', async () => {
  await setupTestDir();
  await createTestPackageJson('1.1.0');
  await createTestChangelog();
  
  const generator = new ChangelogGenerator({ rootDir: testDir });
  
  const commits = [
    {
      tags: ['Fix'],
      description: 'Resolve authentication bug',
      hash: 'abc123',
      message: '[Fix] Resolve authentication bug'
    }
  ];
  
  const existingChangelog = await generator.readChangelog();
  const hasVersionSection = generator.hasVersionSection(existingChangelog, '1.1.0');
  
  runner.assert(!hasVersionSection, 'Version section should not exist initially');
  
  const updatedChangelog = await generator.updateChangelog(
    existingChangelog, 
    '1.1.0', 
    commits, 
    hasVersionSection
  );
  
  runner.assertContains(updatedChangelog, '## SDK Version: __1.1.0__');
  runner.assertContains(updatedChangelog, '![Fix] Resolve authentication bug');
  
  await cleanupTestDir();
});

runner.test('ChangelogGenerator - Initial changelog creation', async () => {
  await setupTestDir();
  
  const generator = new ChangelogGenerator({ rootDir: testDir });
  
  // Try to read non-existent changelog
  const changelog = await generator.readChangelog();
  
  runner.assertContains(changelog, '# Change Log');
  runner.assertContains(changelog, '[Improvement]:');
  runner.assertContains(changelog, '[Fix]:');
  
  await cleanupTestDir();
});

// Run all tests
runner.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});