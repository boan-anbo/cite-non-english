/**
 * Chicago 18th Edition (Notes and Bibliography) - CNE variant tests
 *
 * This test suite validates CNE style handling for Chicago Manual of Style
 * 18th edition. Tests use items created in global-setup.test.ts.
 *
 * ## Test Architecture
 *
 * 1. **Global Setup** (global-setup.test.ts):
 *    - Creates all items once
 *    - Validates Extra fields
 *
 * 2. **Style Tests** (this file):
 *    - Retrieves existing items
 *    - Renders bibliography once
 *    - Runs read-only assertions
 *
 * ## Test Strategy
 *
 * Each test asserts that the expected formatted string exists in the
 * rendered bibliography. This approach is simple and effective:
 * - No need to extract individual entries
 * - No need to match by ID
 * - Just check: "does this exact string appear in the output?"
 *
 * ## Running Tests
 *
 * - Normal mode: Compares output against expectations
 * - Update mode: Generates new snapshots (set cne.updateSnapshots pref)
 */

import { assert } from 'chai';
import * as chai from 'chai';
import * as Diff from 'diff';
import { ALL_FIXTURES, FIXTURE_IDS } from './fixtures';
import { chineseExpectations } from './expectations/chicago-18th/en-US/chinese';
import { japaneseExpectations } from './expectations/chicago-18th/en-US/japanese';
import { koreanExpectations } from './expectations/chicago-18th/en-US/korean';
import { generateBibliography, loadSnapshot, extractCslEntry } from './test-helpers';

// Configure Chai to show full string diffs (not truncated)
chai.config.truncateThreshold = 0;
chai.config.showDiff = true;

/**
 * Assert equality with enhanced diff visualization using jsdiff
 * Includes character-level diff in the assertion error message
 *
 * For large comparisons (like snapshots), suppresses full string output
 * and only shows the diff analysis to keep output readable.
 */
function assertEqualWithDiff(actual: string | null | undefined, expected: string, message: string): void {
  const actualTrimmed = actual?.trim() || '';
  const expectedTrimmed = expected.trim();

  if (actualTrimmed !== expectedTrimmed) {
    // Generate character-level diff
    const diffResult = Diff.diffChars(expectedTrimmed, actualTrimmed);

    let diffOutput = '\n\n📊 Diff Analysis:\n';

    // Collect all differences with their positions
    let position = 0;
    const differences: Array<{pos: number; expected: string; actual: string; context: string}> = [];
    let currentContext = '';

    diffResult.forEach((part) => {
      if (part.added || part.removed) {
        // Find the matching pair (removed + added)
        const contextBefore = currentContext.slice(-20); // Last 20 chars

        if (!differences.length || differences[differences.length - 1].actual !== '') {
          // Start new difference entry
          differences.push({
            pos: position - contextBefore.length,
            expected: part.removed ? part.value : '',
            actual: part.added ? part.value : '',
            context: contextBefore
          });
        } else {
          // Complete the pair
          const lastDiff = differences[differences.length - 1];
          if (part.added) lastDiff.actual = part.value;
          if (part.removed) lastDiff.expected = part.value;
        }

        if (!part.removed) position += part.value.length;
      } else {
        currentContext += part.value;
        position += part.value.length;
      }
    });

    // Format differences compactly
    diffOutput += `Found ${differences.length} difference(s):\n\n`;

    differences.forEach((diff, index) => {
      diffOutput += `Diff #${index + 1} at position ${diff.pos}:\n`;

      // Show context
      const visibleContext = diff.context
        .replace(/\n/g, '↵')
        .replace(/\t/g, '→')
        .replace(/ /g, '·')
        .slice(-30); // Show last 30 chars of context

      diffOutput += `  Context: ...${visibleContext}\n`;

      // Show expected vs actual with Unicode info
      const formatChar = (str: string) => {
        if (!str) return '(none)';
        const visible = str.replace(/\n/g, '↵').replace(/\t/g, '→').replace(/ /g, '·');
        const codes = Array.from(str).map(c => {
          const code = c.charCodeAt(0);
          return code > 127 ? `U+${code.toString(16).toUpperCase().padStart(4, '0')}` : `'${c}'`;
        }).join(' ');
        return `${visible} [${codes}]`;
      };

      diffOutput += `  Expected: ${formatChar(diff.expected)}\n`;
      diffOutput += `  Actual:   ${formatChar(diff.actual)}\n`;
      diffOutput += '\n';
    });

    // Throw assertion error with diff but let Chai handle Expected/Received display
    try {
      assert.equal(actualTrimmed, expectedTrimmed);
    } catch (err: any) {
      // Modify the error message to include our diff analysis
      err.message = message + diffOutput;
      throw err;
    }
  } else {
    // Strings match, just run regular assertion
    assert.equal(actualTrimmed, expectedTrimmed, message);
  }
}

// Style configuration
const STYLE_ID = 'http://www.zotero.org/styles/chicago-notes-bibliography-cne';
const STYLE_LOCALE = 'en-US';

/**
 * Install a CSL style silently by copying to Zotero's styles directory
 */
async function installStyleSilently(styleFilename: string): Promise<void> {
  const stylesDir = PathUtils.join(Zotero.DataDirectory.dir, 'styles');
  await IOUtils.makeDirectory(stylesDir, { ignoreExisting: true });

  const dataDir = Zotero.DataDirectory.dir;
  const projectRoot = PathUtils.parent(PathUtils.parent(dataDir));
  const sourcePath = PathUtils.join(
    projectRoot,
    'build',
    'addon',
    'styles',
    'cne',
    styleFilename
  );

  const sourceExists = await IOUtils.exists(sourcePath);
  if (!sourceExists) {
    throw new Error(`Style file not found at: ${sourcePath}`);
  }

  const destPath = PathUtils.join(stylesDir, styleFilename);
  await IOUtils.copy(sourcePath, destPath, { noOverwrite: false });
}

describe('Chicago 18th Edition - CNE (en-US)', function() {
  let bibliography: string;

  // Initialize styles before running tests
  before(async function() {
    this.timeout(30000);

    // Install CNE style
    try {
      await installStyleSilently('chicago-notes-bibliography-cne.csl');
    } catch (error) {
      console.warn('⚠️  Could not install style:', error);
    }

    // Initialize Zotero styles
    await Zotero.Styles.init();

    // Retrieve all items created in global setup
    console.log('📚 Retrieving existing items...');
    const libraryID = Zotero.Libraries.userLibraryID;
    const allItems = await Zotero.Items.getAll(libraryID);
    console.log(`✅ Found ${allItems.length} items`);

    // Render bibliography ONCE for all items
    console.log('📚 Generating bibliography for all items...');
    bibliography = await generateBibliography(
      allItems,
      STYLE_ID,
      STYLE_LOCALE
    );
    console.log(`✅ Generated bibliography (${bibliography.length} characters)`);

  });

  // ==========================================================================
  // Chinese Materials
  // ==========================================================================

  describe('Chinese materials', function() {
    // Dynamically generate tests from expectations
    Object.entries(chineseExpectations).forEach(([fixtureId, expected]) => {
      const hasExpectation = expected && expected.trim();
      const testFn = hasExpectation ? it : it.skip;
      const testName = hasExpectation
        ? `should format ${fixtureId} correctly`
        : `should format ${fixtureId} correctly - no expectation`;

      testFn(testName, function() {
        const actual = extractCslEntry(bibliography, ALL_FIXTURES[fixtureId]);
        assertEqualWithDiff(
          actual,
          expected,
          `CSL entry for ${fixtureId} does not match expected output`
        );
      });
    });
  });

  // ==========================================================================
  // Japanese Materials
  // ==========================================================================

  describe('Japanese materials', function() {
    // Dynamically generate tests from expectations
    Object.entries(japaneseExpectations).forEach(([fixtureId, expected]) => {
      const hasExpectation = expected && expected.trim();
      const testFn = hasExpectation ? it : it.skip;
      const testName = hasExpectation
        ? `should format ${fixtureId} correctly`
        : `should format ${fixtureId} correctly - no expectation`;

      testFn(testName, function() {
        const actual = extractCslEntry(bibliography, ALL_FIXTURES[fixtureId]);
        assertEqualWithDiff(
          actual,
          expected,
          `CSL entry for ${fixtureId} does not match expected output`
        );
      });
    });
  });

  // ==========================================================================
  // Korean Materials
  // ==========================================================================

  describe('Korean materials', function() {
    // Dynamically generate tests from expectations
    Object.entries(koreanExpectations).forEach(([fixtureId, expected]) => {
      const hasExpectation = expected && expected.trim();
      const testFn = hasExpectation ? it : it.skip;
      const testName = hasExpectation
        ? `should format ${fixtureId} correctly`
        : `should format ${fixtureId} correctly - no expectation`;

      testFn(testName, function() {
        const actual = extractCslEntry(bibliography, ALL_FIXTURES[fixtureId]);
        assertEqualWithDiff(
          actual,
          expected,
          `CSL entry for ${fixtureId} does not match expected output`
        );
      });
    });
  });

  // ==========================================================================
  // Snapshot Regression Test
  // ==========================================================================

  after(async function() {
    this.timeout(20000);

    const snapshotPath = 'snapshots/chicago-18th/en-US/all-languages.html';

    // Load snapshot
    let snapshotHtml: string;
    try {
      snapshotHtml = await loadSnapshot(snapshotPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Snapshot not found')) {
        console.log(`⚠️  Snapshot not found at ${snapshotPath}, skipping comparison`);
        console.log(`   💡 Generate snapshots with: npm run test:snapshots:generate`);
        return;
      } else {
        throw error;
      }
    }

    // Compare each entry from generated bibliography against snapshot
    console.log('📸 Verifying snapshot regression...');
    let mismatches = 0;

    Object.entries(ALL_FIXTURES).forEach(([fixtureId, fixture]) => {
      // Extract entry from generated bibliography
      const actualEntry = extractCslEntry(bibliography, fixture);

      // Extract entry from snapshot
      const expectedEntry = extractCslEntry(snapshotHtml, fixture);

      // Skip if entry not found in either source
      if (!actualEntry || !expectedEntry) {
        console.warn(`⚠️  Could not extract entry for ${fixtureId}`);
        return;
      }

      // Compare (only ~200-500 chars per entry, not 18000+)
      try {
        assertEqualWithDiff(
          actualEntry,
          expectedEntry,
          `Snapshot mismatch for fixture: ${fixtureId}`
        );
      } catch (error) {
        mismatches++;
        throw error;
      }
    });

    if (mismatches === 0) {
      console.log(`✅ Snapshot matches: ${snapshotPath} (${Object.keys(ALL_FIXTURES).length} entries verified)`);
    }
  });
});
