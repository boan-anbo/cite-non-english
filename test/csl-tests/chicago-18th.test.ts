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
import { FIXTURE_IDS } from './fixtures/constants';
import { chineseExpectations } from './expectations/chicago-18th/en-US/chinese';
import { japaneseExpectations } from './expectations/chicago-18th/en-US/japanese';
import { koreanExpectations } from './expectations/chicago-18th/en-US/korean';
import { generateBibliography, loadSnapshot, saveSnapshot } from './test-helpers';

// Style configuration
const STYLE_ID = 'http://www.zotero.org/styles/chicago-notes-bibliography-cne';
const STYLE_LOCALE = 'en-US';

// Check if we're in update mode
let UPDATE_SNAPSHOTS = false;

// Check environment variable first
if (typeof Services !== 'undefined' && Services.env) {
  const envValue = Services.env.get('UPDATE_SNAPSHOTS');
  if (envValue === '1' || envValue === 'true') {
    UPDATE_SNAPSHOTS = true;
    console.log('[Chicago 18th] UPDATE_SNAPSHOTS enabled via environment variable');
  }
}

// Fall back to Zotero preference if not set by environment
if (!UPDATE_SNAPSHOTS && typeof Zotero !== 'undefined' && Zotero.Prefs) {
  UPDATE_SNAPSHOTS = Zotero.Prefs.get('extensions.zotero.cne.updateSnapshots', false);
  if (UPDATE_SNAPSHOTS) {
    console.log('[Chicago 18th] UPDATE_SNAPSHOTS enabled via Zotero preference');
  }
}

console.log(`[Chicago 18th] UPDATE_SNAPSHOTS mode: ${UPDATE_SNAPSHOTS}`);

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

    if (UPDATE_SNAPSHOTS) {
      console.log('🔄 UPDATE MODE: Will generate new snapshots');
    } else {
      console.log('🧪 TEST MODE: Will compare against snapshots and expectations');
    }

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
    it(`should format ${FIXTURE_IDS.ZHCN_HAO_1998_TANG} correctly`, function() {
      const expected = chineseExpectations[FIXTURE_IDS.ZHCN_HAO_1998_TANG];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.ZHCN_HAO_1998_TANG}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.ZHCN_HAO_1998_TANG}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI} correctly`, function() {
      const expected = chineseExpectations[FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011} correctly`, function() {
      const expected = chineseExpectations[FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI} correctly`, function() {
      const expected = chineseExpectations[FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG} correctly`, function() {
      const expected = chineseExpectations[FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.ZHCN_SHA_2014_SHIKU} correctly`, function() {
      const expected = chineseExpectations[FIXTURE_IDS.ZHCN_SHA_2014_SHIKU];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.ZHCN_SHA_2014_SHIKU}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.ZHCN_SHA_2014_SHIKU}, skipping`);
      }
    });
  });

  // ==========================================================================
  // Japanese Materials
  // ==========================================================================

  describe('Japanese materials', function() {
    it(`should format ${FIXTURE_IDS.JA_ABE_1983_SAIGO} correctly`, function() {
      const expected = japaneseExpectations[FIXTURE_IDS.JA_ABE_1983_SAIGO];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.JA_ABE_1983_SAIGO}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.JA_ABE_1983_SAIGO}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.JA_KONDO_2013_YALE} correctly`, function() {
      const expected = japaneseExpectations[FIXTURE_IDS.JA_KONDO_2013_YALE];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.JA_KONDO_2013_YALE}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.JA_KONDO_2013_YALE}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.JA_OZU_1953_TOKYO} correctly`, function() {
      const expected = japaneseExpectations[FIXTURE_IDS.JA_OZU_1953_TOKYO];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.JA_OZU_1953_TOKYO}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.JA_OZU_1953_TOKYO}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.JA_YOSHIMI_2012_MOHITOTSU} correctly`, function() {
      const expected = japaneseExpectations[FIXTURE_IDS.JA_YOSHIMI_2012_MOHITOTSU];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.JA_YOSHIMI_2012_MOHITOTSU}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.JA_YOSHIMI_2012_MOHITOTSU}, skipping`);
      }
    });
  });

  // ==========================================================================
  // Korean Materials
  // ==========================================================================

  describe('Korean materials', function() {
    it(`should format ${FIXTURE_IDS.KO_KANG_1990_WONYUNG} correctly`, function() {
      const expected = koreanExpectations[FIXTURE_IDS.KO_KANG_1990_WONYUNG];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.KO_KANG_1990_WONYUNG}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.KO_KANG_1990_WONYUNG}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.KO_HAN_1991_KYONGHUNG} correctly`, function() {
      const expected = koreanExpectations[FIXTURE_IDS.KO_HAN_1991_KYONGHUNG];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.KO_HAN_1991_KYONGHUNG}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.KO_HAN_1991_KYONGHUNG}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.KO_HA_2000_TONGSAM} correctly`, function() {
      const expected = koreanExpectations[FIXTURE_IDS.KO_HA_2000_TONGSAM];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.KO_HA_2000_TONGSAM}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.KO_HA_2000_TONGSAM}, skipping`);
      }
    });

    it(`should format ${FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG} correctly`, function() {
      const expected = koreanExpectations[FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG];
      if (expected && expected.trim()) {
        assert.include(
          bibliography,
          expected.trim(),
          `Bibliography should contain correctly formatted ${FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG}`
        );
      } else {
        console.log(`⚠️  No expectation defined for ${FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG}, skipping`);
      }
    });
  });

  // ==========================================================================
  // Snapshot Regression Test
  // ==========================================================================

  after(async function() {
    this.timeout(20000);

    const snapshotPath = 'snapshots/chicago-18th/en-US/all-languages.html';

    if (UPDATE_SNAPSHOTS) {
      // Update mode: Save new snapshot
      console.log(`💾 Saving snapshot to ${snapshotPath}...`);
      await saveSnapshot(snapshotPath, bibliography);
      console.log(`✅ Updated snapshot: ${snapshotPath}`);
    } else {
      // Test mode: Compare with existing snapshot
      try {
        const expected = await loadSnapshot(snapshotPath);
        assert.equal(
          bibliography.trim(),
          expected.trim(),
          'Bibliography snapshot mismatch'
        );
        console.log(`✅ Snapshot matches: ${snapshotPath}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Snapshot not found')) {
          console.log(`⚠️  Snapshot not found at ${snapshotPath}, skipping comparison`);
        } else {
          console.error(`❌ Error loading/comparing snapshot: ${errorMessage}`);
          throw error;
        }
      }
    }
  });
});
