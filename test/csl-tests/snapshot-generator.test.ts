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
  // Add more styles here as needed:
  // {
  //   name: 'APA 7th Edition - CNE',
  //   styleId: 'http://www.zotero.org/styles/apa-7th-cne',
  //   styleFilename: 'apa-7th-cne.csl',
  //   locale: 'en-US',
  //   snapshotPathBibliography: 'snapshots/apa-7th/en-US/all-languages-bibliography.html',
  //   snapshotPathNotes: 'snapshots/apa-7th/en-US/all-languages-notes.html'
  // },
];

/**
 * Install a CSL style by copying to Zotero's styles directory
 *
 * @param styleFilename - Filename of the style (e.g., 'chicago-notes-bibliography-cne.csl')
 */
async function installStyle(styleFilename: string): Promise<void> {
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
  console.log(`  ✅ Installed: ${styleFilename}`);
}

describe('Snapshot Generator', function() {
  let allItems: Zotero.Item[];

  before(async function() {
    this.timeout(60000); // Longer timeout for multiple styles

    console.log('');
    console.log('📸 Snapshot Generator');
    console.log('════════════════════════════════════════');
    console.log('');

    // Retrieve all items created by global setup
    console.log('📚 Retrieving existing items from Zotero...');
    const libraryID = Zotero.Libraries.userLibraryID;
    allItems = await Zotero.Items.getAll(libraryID);
    console.log(`  ✅ Found ${allItems.length} items`);
    console.log('');

    // Install all styles
    console.log('🎨 Installing CSL styles...');
    for (const style of STYLE_REGISTRY) {
      await installStyle(style.styleFilename);
    }
    console.log('');

    // Initialize Zotero styles system
    console.log('🔧 Initializing Zotero Styles...');
    await Zotero.Styles.init();
    console.log('  ✅ Styles initialized');
    console.log('');

    // Generate snapshots for each style
    console.log('📝 Generating snapshots for all styles...');
    console.log('');

    for (const style of STYLE_REGISTRY) {
      console.log(`  🎯 ${style.name} (${style.locale})`);

      // Generate bibliography format
      const bibliography = await generateBibliography(
        allItems,
        style.styleId,
        style.locale
      );
      console.log(`     Generated bibliography: ${bibliography.length} characters`);
      await saveSnapshot(style.snapshotPathBibliography, bibliography);
      console.log(`     Saved to: ${style.snapshotPathBibliography}`);

      // Generate notes format
      const citations = await generateCitations(
        allItems,
        style.styleId,
        style.locale
      );
      console.log(`     Generated notes: ${citations.length} characters`);
      await saveSnapshot(style.snapshotPathNotes, citations);
      console.log(`     Saved to: ${style.snapshotPathNotes}`);
      console.log('');
    }

    console.log('✅ All snapshots generated successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - Review changes: git diff snapshots/');
    console.log('   - Run tests: npm test');
    console.log('');
  });

  it('should have generated all snapshots', function() {
    // Dummy test to make Mocha happy
    // The actual work is done in the before hook
    assert.isArray(allItems);
    assert.isAbove(allItems.length, 0, 'Should have loaded items from global setup');
  });
});
