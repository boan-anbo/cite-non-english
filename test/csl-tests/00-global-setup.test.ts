/**
 * Global Test Setup - Batch Item Creation
 *
 * This test suite runs FIRST and creates all test items once for use across
 * all CSL test files. This architecture provides:
 *
 * - **Performance**: Items created once, not per test file
 * - **Simplicity**: Clear separation of setup vs assertions
 * - **Maintainability**: Centralized fixture management
 *
 * ## Architecture
 *
 * 1. **Global Setup (this file)**:
 *    - Creates all items from unified fixtures
 *    - Validates key items have correct Extra fields
 *    - Items persist for subsequent tests
 *
 * 2. **CSL Style Tests** (e.g., chicago-18th.test.ts):
 *    - Retrieve existing items
 *    - Render bibliography once
 *    - Run read-only assertions
 *
 * ## Validation Strategy
 *
 * We validate a subset of critical items to ensure:
 * - Items were created successfully
 * - Extra fields contain CNE metadata
 * - CNE plugin will process them correctly
 *
 * Focus on items with complex metadata (e.g., hua-1999-qingdai with
 * romanized title, English translation, and romanized journal).
 */

import { assert } from 'chai';
import { ALL_FIXTURES, FIXTURE_IDS } from './fixtures';
import { createZoteroItemFromTestCase, stylesManager, installCslStyle } from './test-helpers';

describe('Global Setup - Batch Item Creation', function() {
  // Increase timeout for batch creation
  this.timeout(30000);

  /**
   * Create all test items once
   *
   * Items are created from unified fixtures across all languages.
   * They persist in Zotero for use by subsequent test files.
   */
  before(async function() {
    // Get user library ID
    const libraryID = Zotero.Libraries.userLibraryID;

    // Clean up any existing items from previous test runs
    console.log('🧹 Cleaning up existing items...');
    const existingItems = await Zotero.Items.getAll(libraryID);
    if (existingItems.length > 0) {
      await Promise.all(existingItems.map(item => item.eraseTx()));
      console.log(`✅ Deleted ${existingItems.length} existing items`);
    }

    // Install all CNE styles BEFORE initializing Zotero.Styles
    console.log('📝 Installing CNE styles...');
    await installCslStyle('chicago-notes-bibliography-cne.csl');
    await installCslStyle('apa-7th-cne.csl');
    console.log('✅ Styles installed');

    // Initialize Zotero Styles ONCE for all tests (after styles are installed)
    await stylesManager.ensureInitialized();

    console.log(`📦 Creating ${Object.keys(ALL_FIXTURES).length} test items...`);

    let createdCount = 0;
    for (const [fixtureId, fixture] of Object.entries(ALL_FIXTURES)) {
      await createZoteroItemFromTestCase(fixture);
      createdCount++;
    }

    console.log(`✅ Created ${createdCount} items`);
  });

  /**
   * Validate that items were created successfully
   */
  it('should create all fixture items', async function() {
    const libraryID = Zotero.Libraries.userLibraryID;
    const items = await Zotero.Items.getAll(libraryID);
    assert.isAtLeast(
      items.length,
      Object.keys(ALL_FIXTURES).length,
      `Expected at least ${Object.keys(ALL_FIXTURES).length} items to be created`
    );
  });

  /**
   * Validate hua-1999-qingdai item has correct Extra fields
   *
   * This is a critical test item that requires:
   * - Romanized author names
   * - Romanized article title + English translation
   * - Romanized journal title
   *
   * If this validation fails, CNE plugin won't enrich the item correctly.
   */
  it('should have correct Extra fields for hua-1999-qingdai', async function() {
    // Find item by original title (unique identifier)
    const libraryID = Zotero.Libraries.userLibraryID;
    const items = await Zotero.Items.getAll(libraryID);
    const huaItem = items.find(
      item => item.getField('title') === '清代以来三峡地区水旱灾害的初步研究'
    );

    assert.exists(huaItem, 'hua-1999-qingdai item should exist');

    // Validate Extra field contains CNE metadata
    const extra = huaItem!.getField('extra');
    assert.isString(extra, 'Extra field should be a string');
    assert.isNotEmpty(extra, 'Extra field should not be empty');

    // Check for key CNE fields
    assert.include(extra, 'cne-creator-0-last-romanized: Hua', 'Should have romanized author last name');
    assert.include(extra, 'cne-creator-0-first-romanized: Linfu', 'Should have romanized author first name');
    assert.include(extra, 'cne-title-romanized:', 'Should have romanized title');
    assert.include(extra, 'cne-title-english:', 'Should have English translation');
    assert.include(extra, 'cne-journal-romanized: Zhongguo shehui kexue', 'Should have romanized journal');

    console.log(`✅ hua-1999-qingdai Extra fields validated (${extra.length} chars)`);
  });

  /**
   * Validate beijing-airusheng-2011 (institutional author)
   *
   * Tests single-field (literal) author name handling
   */
  it('should have correct Extra fields for beijing-airusheng-2011', async function() {
    const libraryID = Zotero.Libraries.userLibraryID;
    const items = await Zotero.Items.getAll(libraryID);
    const beijingItem = items.find(
      item => item.getField('title') === '中国基本古籍库'
    );

    assert.exists(beijingItem, 'beijing-airusheng-2011 item should exist');

    const extra = beijingItem!.getField('extra');
    assert.include(extra, 'cne-creator-0-last-romanized:', 'Should have romanized institutional author');
    assert.include(extra, 'cne-title-romanized:', 'Should have romanized title');
  });

  /**
   * Validate abe-1983-saigo (multiple authors)
   *
   * Tests handling of multiple authors with CNE metadata
   */
  it('should have correct Extra fields for abe-1983-saigo', async function() {
    const libraryID = Zotero.Libraries.userLibraryID;
    const items = await Zotero.Items.getAll(libraryID);
    const abeItem = items.find(
      item => item.getField('title') === '最後の「日本人」 : 朝河貫一の生涯'
    );

    assert.exists(abeItem, 'abe-1983-saigo item should exist');

    const extra = abeItem!.getField('extra');
    assert.include(extra, 'cne-creator-0-last-romanized: Abe', 'Should have first author romanized');
    assert.include(extra, 'cne-creator-1-last-romanized: Kaneko', 'Should have second author romanized');
  });

  /**
   * Validate ha-2000-tongsam has page numbers
   *
   * Tests that bookSection items properly store page numbers
   */
  it('should have page numbers for ha-2000-tongsam', async function() {
    const libraryID = Zotero.Libraries.userLibraryID;
    const items = await Zotero.Items.getAll(libraryID);
    const haItem = items.find(
      item => item.getField('title') === 'Tongsam-dong P\'aech\'ong chŏnghwa chiyŏk palgul sŏngkwa'
    );

    assert.exists(haItem, 'ha-2000-tongsam item should exist');

    const pages = haItem!.getField('pages');
    console.log(`✅ ha-2000-tongsam pages field: '${pages}'`);
    assert.equal(pages, '111-133', 'Should have pages 111-133');
  });
});
