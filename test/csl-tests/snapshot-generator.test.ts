/**
 * Snapshot Generator
 *
 * This test file generates HTML snapshots for all configured CSL styles.
 * Snapshots are written to snapshots/ directory (outside test/ to avoid watch loops).
 *
 * ## Purpose
 *
 * Snapshots serve as:
 * - User documentation and examples
 * - Visual reference for citation formatting
 * - NOT used for regression testing (tests use TypeScript expectations)
 *
 * ## Usage
 *
 * Runs automatically with: `npm test` or `npm run test:snapshots:update`
 *
 * ## Architecture
 *
 * 1. Relies on global setup (00-global-setup.test.ts) to create Zotero items
 * 2. Retrieves those existing items (not creating duplicates)
 * 3. For each registered style+locale:
 *    - Installs the style
 *    - Generates bibliography from the same items in memory
 *    - Saves to snapshots/{style}/{locale}/all-languages.html
 *
 * ## Adding New Styles
 *
 * Add entries to the STYLE_REGISTRY below:
 * ```typescript
 * {
 *   name: 'apa-7th',
 *   styleId: 'http://www.zotero.org/styles/apa-7th-cne',
 *   styleFilename: 'apa-7th-cne.csl',
 *   locale: 'en-US',
 *   snapshotPath: 'snapshots/apa-7th/en-US/all-languages.html'
 * }
 * ```
 */

import { assert } from 'chai';
import { generateBibliography, generateCitations, saveSnapshot } from './test-helpers';

/**
 * Style Registry
 *
 * Defines all styles for which we generate snapshots.
 * Each entry specifies the style ID, filename, locale, and output paths.
 * Two snapshots are generated per style:
 * - Bibliography format (standard bibliography output)
 * - Notes format (individual citations as numbered list)
 */
const STYLE_REGISTRY = [
  {
    name: 'Chicago 18th Edition (Notes and Bibliography) - CNE',
    styleId: 'http://www.zotero.org/styles/chicago-notes-bibliography-cne',
    styleFilename: 'chicago-notes-bibliography-cne.csl',
    locale: 'en-US',
    snapshotPathBibliography: 'snapshots/chicago-notes-bibliography-cne/en-US/all-languages-bibliography.html',
    snapshotPathNotes: 'snapshots/chicago-notes-bibliography-cne/en-US/all-languages-notes.html'
  },
  {
    name: 'APA 7th Edition - CNE',
    styleId: 'http://www.zotero.org/styles/apa-7th-cne',
    styleFilename: 'apa-7th-cne.csl',
    locale: 'en-US',
    snapshotPathBibliography: 'snapshots/apa-7th-cne/en-US/all-languages-bibliography.html',
    snapshotPathNotes: 'snapshots/apa-7th-cne/en-US/all-languages-notes.html'
  },
];

describe('Snapshot Generator', function() {
  let allItems: Zotero.Item[];

  before(async function() {
    this.timeout(60000); // Longer timeout for multiple styles

    // Retrieve all items created by global setup
    const libraryID = Zotero.Libraries.userLibraryID;
    allItems = await Zotero.Items.getAll(libraryID);

    // Generate snapshots for each style
    for (const style of STYLE_REGISTRY) {
      // Generate bibliography format
      const bibliography = await generateBibliography(
        allItems,
        style.styleId,
        style.locale
      );
      await saveSnapshot(style.snapshotPathBibliography, bibliography);

      // Generate notes format
      const citations = await generateCitations(
        allItems,
        style.styleId,
        style.locale
      );
      await saveSnapshot(style.snapshotPathNotes, citations);
    }
  });

  it('should have generated all snapshots', function() {
    // Dummy test to make Mocha happy
    // The actual work is done in the before hook
    assert.isArray(allItems);
    assert.isAbove(allItems.length, 0, 'Should have loaded items from global setup');
  });
});
