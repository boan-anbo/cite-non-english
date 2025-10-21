/**
 * Citeproc Configuration Module
 *
 * Applies CNE configuration to citeproc-js engines by calling the appropriate
 * JavaScript APIs to configure multi-slot rendering behavior.
 *
 * @see /docs/PLAN-multi-slot-architecture.md
 * @see /docs/citeproc-multilingual-infrastructure.md
 */

import type { CNEConfigOptions } from './parseCNEConfig';

/**
 * Configure citeproc engine for CNE multi-slot rendering
 *
 * Applies the parsed CNE configuration to a citeproc engine instance.
 * Must be called AFTER engine creation but BEFORE updateItems().
 *
 * @param engine - Citeproc engine instance (from style.getCiteProc())
 * @param config - Parsed CNE configuration
 *
 * @example
 * ```typescript
 * // 1. Create engine
 * const engine = style.getCiteProc(locale, format);
 *
 * // 2. Configure for CNE
 * const config = { persons: ['translit', 'orig'], titles: ['translit'] };
 * configureCiteprocForCNE(engine, config);
 *
 * // 3. Register items and render
 * engine.updateItems(itemIds);
 * const output = Zotero.Cite.makeFormattedBibliography(engine, format);
 * ```
 *
 * ## What this does
 *
 * Calls `engine.setLangPrefsForCites(config)` which controls which language
 * variants are displayed for each field type. The config maps directly to
 * citeproc-js cite-lang-prefs structure:
 *
 * - `persons: ['translit', 'orig']` → Show romanized + original for names
 * - `titles: ['translit']` → Show romanized only for titles
 *
 * ## Slot mechanism
 *
 * The array values map to slots:
 * - `[0]` → Primary slot (always rendered)
 * - `[1]` → Secondary slot (rendered in bibliography only)
 * - `[2]` → Tertiary slot (rendered in bibliography only)
 *
 * Each slot value selects from multi._key:
 * - `'orig'` → Uses main fields or multi._key.{original-lang}
 * - `'translit'` → Uses multi._key.{romanized-lang}
 * - `'translat'` → Uses multi._key.{translated-lang}
 *
 * @see /tools/citeproc-js-server/lib/citeproc.js:5000-5041 (setLangPrefsForCites)
 * @see /tools/citeproc-js-server/lib/citeproc.js:13405-13413 (slot mapping)
 * @see /tools/citeproc-js-server/lib/citeproc.js:14240-14270 (variant selection)
 */
export function configureCiteprocForCNE(engine: any, config: CNEConfigOptions): void {
  try {
    console.log('[CNE Config] === START configureCiteprocForCNE ===');
    console.log('[CNE Config] Config received:', config);

    // Validate engine
    if (!engine || typeof engine.setLangPrefsForCites !== 'function') {
      console.log('[CNE Config] Engine missing setLangPrefsForCites method, skipping configuration');
      Zotero.debug(
        '[CNE Config] Engine missing setLangPrefsForCites method, skipping configuration'
      );
      return;
    }

    // Validate config
    if (!config || typeof config !== 'object') {
      console.log('[CNE Config] Invalid configuration object, skipping');
      Zotero.debug('[CNE Config] Invalid configuration object, skipping');
      return;
    }

    // Extract slot mappings (persons, institutions) from config
    // Exclude nameFormatting as it's CNE-specific, not a citeproc field
    const citeLangPrefs: Record<string, string[]> = {};
    if (config.persons) {
      citeLangPrefs.persons = config.persons;
    }
    // Future: add institutions, etc. as needed

    // Apply cite-lang-prefs configuration
    console.log('[CNE Config] Applying cite-lang-prefs:', JSON.stringify(citeLangPrefs));
    Zotero.debug('[CNE Config] Applying cite-lang-prefs: ' + JSON.stringify(citeLangPrefs));
    engine.setLangPrefsForCites(citeLangPrefs);
    console.log('[CNE Config] Called engine.setLangPrefsForCites()');

    // Verify cite-lang-prefs was set
    if (engine.opt && engine.opt['cite-lang-prefs']) {
      console.log('[CNE Config] Verified cite-lang-prefs:', JSON.stringify(engine.opt['cite-lang-prefs']));
      Zotero.debug('[CNE Config] Verified cite-lang-prefs: ' + JSON.stringify(engine.opt['cite-lang-prefs']));
    } else {
      console.log('[CNE Config] WARNING: Could not verify cite-lang-prefs was set');
      console.log('[CNE Config] engine.opt exists?', !!engine.opt);
      if (engine.opt) {
        console.log('[CNE Config] engine.opt keys:', Object.keys(engine.opt).join(', '));
      }
      Zotero.debug('[CNE Config] WARNING: Could not verify cite-lang-prefs was set');
    }

    // Configure language tags for transliteration slot based on name formatting
    //
    // Dual-variant architecture:
    // - separator='space' → ['en'] → uses multi._key['en'] (no multi.main, no commas)
    // - separator='comma' → ['en-x-western'] → uses multi._key['en-x-western'] (multi.main='en', commas)
    //
    // Defaults to 'space' for backward compatibility
    const romanizedCJK = config.nameFormatting?.romanizedCJK;
    const separator = romanizedCJK?.separator || 'space';
    const translitTags = separator === 'comma' ? ['en-x-western'] : ['en'];

    Zotero.debug('[CNE Config] nameFormatting.romanizedCJK.separator: ' + separator);
    Zotero.debug('[CNE Config] Checking if setLangTagsForCslTransliteration exists: ' +
                typeof engine.setLangTagsForCslTransliteration);
    Zotero.debug('[CNE Config] Setting transliteration language tags: ' + JSON.stringify(translitTags));

    try {
      engine.setLangTagsForCslTransliteration(translitTags);
      Zotero.debug('[CNE Config] Successfully called setLangTagsForCslTransliteration');

      // Try to read back the value to verify it was set
      if (engine.opt && engine.opt['locale-translit']) {
        Zotero.debug('[CNE Config] Verified locale-translit: ' + JSON.stringify(engine.opt['locale-translit']));
      }
    } catch (err) {
      Zotero.debug('[CNE Config] Error calling setLangTagsForCslTransliteration: ' + err);
    }

    Zotero.debug('[CNE Config] Successfully configured citeproc engine');
  } catch (error) {
    Zotero.debug('[CNE Config] Error configuring citeproc engine: ' + error);
    // Don't throw - gracefully degrade to default behavior
  }
}

/**
 * Configure spacing between multi-slot outputs
 *
 * Optional: Controls prefix/suffix affixes between primary/secondary/tertiary slots.
 * By default, citeproc uses a single space between slots.
 *
 * @param engine - Citeproc engine instance
 * @param affixes - Array of affix configurations
 *
 * @example
 * ```typescript
 * // Add space before secondary slot
 * setCiteAffixes(engine, [
 *   { prefix: ' ', suffix: '' }  // Before secondary slot
 * ]);
 * ```
 *
 * @see /tools/citeproc-js-server/lib/citeproc.js:5069-5098 (setLangPrefsForCiteAffixes)
 * @see /tools/citeproc-js-server/lib/citeproc.js:13722-13750 (affix application)
 */
export function setCiteAffixes(
  engine: any,
  affixes: Array<{ prefix?: string; suffix?: string }>
): void {
  try {
    if (!engine || typeof engine.setLangPrefsForCiteAffixes !== 'function') {
      Zotero.debug('[CNE Config] Engine missing setLangPrefsForCiteAffixes method');
      return;
    }

    Zotero.debug('[CNE Config] Setting cite affixes: ' + JSON.stringify(affixes));
    engine.setLangPrefsForCiteAffixes(affixes);
  } catch (error) {
    Zotero.debug('[CNE Config] Error setting cite affixes: ' + error);
  }
}

/**
 * Configure language tags for romanization/transliteration
 *
 * Optional: Sets which language tags should be treated as romanized variants
 * when selecting from multi._key.
 *
 * @param engine - Citeproc engine instance
 * @param tags - Array of language tags (e.g., ['en', 'en-Latn'])
 *
 * @example
 * ```typescript
 * // Treat 'en-Latn' as romanized variant
 * setTransliterationTags(engine, ['en-Latn']);
 * ```
 *
 * @see /tools/citeproc-js-server/lib/citeproc.js:5043-5067 (setLangTagsForCslTransliteration)
 */
export function setTransliterationTags(engine: any, tags: string[]): void {
  try {
    if (!engine || typeof engine.setLangTagsForCslTransliteration !== 'function') {
      Zotero.debug('[CNE Config] Engine missing setLangTagsForCslTransliteration method');
      return;
    }

    Zotero.debug('[CNE Config] Setting transliteration tags: ' + JSON.stringify(tags));
    engine.setLangTagsForCslTransliteration(tags);
  } catch (error) {
    Zotero.debug('[CNE Config] Error setting transliteration tags: ' + error);
  }
}
