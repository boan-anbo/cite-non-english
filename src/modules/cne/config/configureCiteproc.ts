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

type CiteprocEngine = any;

declare const CSL: any | undefined;

let originalJsSetLangPrefs: ((obj: any, conv?: any) => void) | null = null;
let originalRsSetLangPrefs: ((obj: any, conv?: any) => void) | null = null;

export function installCneLangPrefPatch(): void {
  // NOTE: This patches citeproc at the prototype level. Any future citations
  // engine updates (citeproc-js or citeproc-rs) should rerun these tests to
  // ensure `setLangPrefsForCites` still behaves as expected.
  try {
    if (typeof CSL !== 'undefined' && CSL?.Engine && !originalJsSetLangPrefs) {
      originalJsSetLangPrefs = CSL.Engine.prototype.setLangPrefsForCites;
      CSL.Engine.prototype.setLangPrefsForCites = function (obj: any, conv?: any) {
        originalJsSetLangPrefs!.call(this, obj, conv);
        try {
          (this as any)._cneLangOverride?.();
        } catch (err) {
          Zotero?.debug?.('[CNE Config] Error in JS lang override: ' + err);
        }
      };
    }

    const RsEngine = (Zotero as any)?.CiteprocRs?.Engine;
    if (RsEngine && !originalRsSetLangPrefs) {
      originalRsSetLangPrefs = RsEngine.prototype.setLangPrefsForCites;
      RsEngine.prototype.setLangPrefsForCites = function (obj: any, conv?: any) {
        originalRsSetLangPrefs!.call(this, obj, conv);
        try {
          (this as any)._cneLangOverride?.();
        } catch (err) {
          Zotero?.debug?.('[CNE Config] Error in RS lang override: ' + err);
        }
      };
      Object.defineProperty(RsEngine.prototype, '_cnePatched', { value: true, configurable: true });
    }
  } catch (err) {
    Zotero?.debug?.('[CNE Config] Error installing lang pref patch: ' + err);
  }
}

export function configureCiteprocForCNE(engine: CiteprocEngine, config: CNEConfigOptions): void {
  try {
    installCneLangPrefPatch();

    if (!engine || typeof engine.setLangPrefsForCites !== 'function') {
      Zotero.debug('[CNE Config] Engine missing setLangPrefsForCites method, skipping');
      return;
    }

    if (!config || typeof config !== 'object') {
      Zotero.debug('[CNE Config] Invalid configuration object, skipping');
      return;
    }

    const citeLangPrefs: Record<string, string[]> = {};
    if (config.persons) {
      citeLangPrefs.persons = config.persons;
    }

    if (citeLangPrefs.persons) {
      const personsSnapshot = [...citeLangPrefs.persons];
      (engine as any)._cneLangOverride = () => {
        enforcePersonsArray(engine.opt?.['cite-lang-prefs'], personsSnapshot);
        enforcePersonsArray(engine.state?.opt?.['cite-lang-prefs'], personsSnapshot);
      };
    } else {
      (engine as any)._cneLangOverride = undefined;
    }

    engine.setLangPrefsForCites(citeLangPrefs);
    (engine as any)._cneLangOverride?.();

    if (citeLangPrefs.persons) {
      enforcePersonsArray(engine.opt?.['cite-lang-prefs'], citeLangPrefs.persons);
      enforcePersonsArray(engine.state?.opt?.['cite-lang-prefs'], citeLangPrefs.persons);
    }

    const romanizedCJK = config.nameFormatting?.romanizedCJK;
    const separator = romanizedCJK?.separator || 'space';
    const translitTags = separator === 'comma' ? ['en-x-western'] : ['en'];

    try {
      engine.setLangTagsForCslTransliteration(translitTags);
    } catch (err) {
      Zotero.debug('[CNE Config] Error calling setLangTagsForCslTransliteration: ' + err);
    }

    Zotero.debug('[CNE Config] Successfully configured citeproc engine');
  } catch (error) {
    Zotero.debug('[CNE Config] Error configuring citeproc engine: ' + error);
  }
}

function enforcePersonsArray(target: any, values: string[]) {
  if (!target) {
    return;
  }

  const arr = Array.isArray(target.persons) ? target.persons : (target.persons = []);
  arr.length = 0;
  arr.push(...values);
}

export function setCiteAffixes(engine: any, affixes: Array<{ prefix?: string; suffix?: string }>): void {
  try {
    if (!engine || typeof engine.setLangPrefsForCiteAffixes !== 'function') {
      Zotero.debug('[CNE Config] Engine missing setLangPrefsForCiteAffixes method');
      return;
    }

    engine.setLangPrefsForCiteAffixes(affixes);
  } catch (error) {
    Zotero.debug('[CNE Config] Error setting cite affixes: ' + error);
  }
}

export function setTransliterationTags(engine: any, tags: string[]): void {
  try {
    if (!engine || typeof engine.setLangTagsForCslTransliteration !== 'function') {
      Zotero.debug('[CNE Config] Engine missing setLangTagsForCslTransliteration method');
      return;
    }

    engine.setLangTagsForCslTransliteration(tags);
  } catch (error) {
    Zotero.debug('[CNE Config] Error setting transliteration tags: ' + error);
  }
}
