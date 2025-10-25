import { assert } from 'chai';
import { stylesManager } from './test-helpers';
import { extractCNEConfigFromStyle } from '../../src/modules/cne/config/parseCNEConfig';
/**
 * Regression guard for the Style Editor flow.
 *
 * In production, the Style Editor calls `style.getCiteProc()` without any
 * CNE-specific helpers. The GetCiteProc interceptor is supposed to configure
 * the engine so that romanized + original names render automatically.
 *
 * This test exercises that code path directly: it creates a fresh engine,
 * renders the Hua Linfu bibliography entry, and asserts that the romanized
 * name appears without any manual configuration.
 */
describe('GetCiteProcInterceptor', function () {
  this.timeout(15000);

  const CHICAGO_CNE_STYLE_ID = 'http://www.zotero.org/styles/chicago-notes-bibliography-cne';
  const HUA_TITLE = '清代以来三峡地区水旱灾害的初步研究';

  before(async function () {
    // Global setup installs styles; make sure the style cache is initialized.
    Zotero.Prefs.set('cite.useCiteprocRs', false);
    await stylesManager.ensureInitialized();
  });

  it('configures citeproc engines without manual helpers', async function () {
    let style = Zotero.Styles.get(CHICAGO_CNE_STYLE_ID);
    assert.exists(style, 'Expected Chicago CNE style to be registered');

    const resolvedConfig = extractCNEConfigFromStyle(style);
    assert.deepEqual(
      resolvedConfig?.persons,
      ['translit', 'orig'],
      'extractCNEConfigFromStyle should find persons slots'
    );

    // Force a fresh engine so we exercise the interceptor rather than a cache hit.
    style.clearEngineCache();

    let engine = style.getCiteProc('en-US', 'html');
    assert.exists(engine, 'Expected citeproc engine to be created');
    assert.include(
      ['CSL.Engine', 'Engine'],
      engine.constructor?.name || 'Engine',
      `Unexpected engine constructor: ${engine.constructor?.name}`
    );

    const initialLangPrefs = engine.opt?.['cite-lang-prefs']?.persons?.slice() ?? null;

    let citeLangPrefs = engine.opt?.['cite-lang-prefs']?.persons;
    if (!Array.isArray(citeLangPrefs) || citeLangPrefs.length <= 1) {
      // Try to pull a fresh style instance from the registry. The Style Editor
      // can hand us an ephemeral style object that does not carry the summary PI.
      style = Zotero.Styles.get(CHICAGO_CNE_STYLE_ID);
      assert.exists(style, 'Chicago CNE style should exist in registry');

      style.clearEngineCache();
      engine = style.getCiteProc('en-US', 'html');
      citeLangPrefs = engine.opt?.['cite-lang-prefs']?.persons;
    }

    assert.isArray(citeLangPrefs, 'cite-lang-prefs.persons should be defined');
    assert.isAtLeast(citeLangPrefs!.length, 1, 'cite-lang-prefs.persons should have entries');

    // Grab the Hua Linfu test item that global setup loads into the library.
    const libraryID = Zotero.Libraries.userLibraryID;
    const allItems = await Zotero.Items.getAll(libraryID);
    const huaItem = allItems.find(
      (item) => item.getField('title') === HUA_TITLE
    );

    assert.exists(huaItem, 'Expected Hua Linfu test item to be available');

    engine.updateItems([huaItem!.id]);

    citeLangPrefs = engine.opt?.['cite-lang-prefs']?.persons;
    assert.isTrue(
      Boolean((engine as any)._cneConfigured),
      'Interceptor should have marked the engine as configured'
    );
    const debugSnapshot = {
      appliedConfig: (engine as any)._cneConfigApplied ?? null,
      recordedLangPrefs: (engine as any)._cneLangPrefs ?? null,
      isArray: Array.isArray(citeLangPrefs),
      constructorName: citeLangPrefs?.constructor?.name || null,
      initialLangPrefs,
      engineType: engine.constructor?.name || null,
      usingCiteprocRs: Zotero.Prefs.get('cite.useCiteprocRs'),
    };
    assert.deepEqual(
      citeLangPrefs,
      ['translit', 'orig'],
      `Unexpected cite-lang-prefs.persons: ${JSON.stringify(citeLangPrefs)} | debug=${JSON.stringify(debugSnapshot)}`
    );

    const bibliography = Zotero.Cite.makeFormattedBibliography(engine, 'html');
    const entries = Array.isArray(bibliography?.[1])
      ? bibliography[1].join('\n')
      : String(bibliography);

    // If the interceptor runs, the bibliography entry should include the romanized name.
    assert.include(
      entries,
      'Hua Linfu',
      'Romanized name should appear without manual configuration'
    );
    assert.include(
      entries,
      '华林甫',
      'Original script should still be present in the rendered entry'
    );
  });
});
