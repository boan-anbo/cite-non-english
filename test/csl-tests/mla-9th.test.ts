/**
 * MLA 9th Edition - CNE variant tests
 *
 * This test suite validates CNE style handling for MLA 9th edition.
 * Tests use items created in global-setup.test.ts.
 *
 * ## Test Architecture
 *
 * 1. **Global Setup** (00-global-setup.test.ts):
 *    - Creates all items once
 *    - Validates Extra fields
 *
 * 2. **Style Tests** (this file):
 *    - Retrieves existing items
 *    - Renders bibliography once in memory
 *    - Runs assertions against TypeScript expectations
 *
 * 3. **Snapshot Generator** (snapshot-generator.test.ts):
 *    - Generates HTML snapshots for user documentation
 *    - Writes to snapshots/ directory (outside test/ to avoid watch loops)
 *
 * ## Test Strategy
 *
 * Each test asserts that the expected formatted string exists in the
 * rendered bibliography. This approach is simple and effective:
 * - No need to extract individual entries
 * - No need to match by ID
 * - Just check: "does this exact string appear in the output?"
 *
 * Expectations are defined in TypeScript files (e.g., expectations/mla-9th/en-US/chinese.ts)
 */

import { assert } from 'chai';
import * as chai from 'chai';
import * as Diff from 'diff';
import { ALL_FIXTURES, FIXTURE_IDS } from './fixtures';
import { chineseExpectations } from './expectations/mla-9th/en-US/chinese';
import { japaneseExpectations } from './expectations/mla-9th/en-US/japanese';
import { koreanExpectations } from './expectations/mla-9th/en-US/korean';
import { englishExpectations } from './expectations/mla-9th/en-US/english';
import { generateBibliography, extractCslEntry } from './test-helpers';

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
const STYLE_ID = 'http://www.zotero.org/styles/modern-language-association-9th-in-text-cne';
const STYLE_LOCALE = 'en-US';

describe('MLA 9th Edition (in-text) - CNE (en-US)', function() {
  let bibliography: string;

  // Initialize styles before running tests
  before(async function() {
    this.timeout(30000);

    // Retrieve all items created in global setup
    const libraryID = Zotero.Libraries.userLibraryID;
    const allItems = await Zotero.Items.getAll(libraryID);

    // Render bibliography ONCE for all items
    bibliography = await generateBibliography(
      allItems,
      STYLE_ID,
      STYLE_LOCALE
    );
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
  // English Materials (baseline tests for non-CNE behavior)
  // ==========================================================================

  describe('English materials', function() {
    // Dynamically generate tests from expectations
    Object.entries(englishExpectations).forEach(([fixtureId, expected]) => {
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

});
