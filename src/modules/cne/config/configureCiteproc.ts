/**
 * Citeproc Configuration Module
 *
 * Applies CNE configuration to citeproc-js engines by calling the appropriate
 * JavaScript APIs to configure multi-slot rendering behavior.
 *
 * @see /docs/PLAN-multi-slot-architecture.md
 * @see /docs/citeproc-multilingual-infrastructure.md
 */

import type { CNEConfigOptions } from "./parseCNEConfig";

type CiteprocEngine = any;

declare const CSL: any | undefined;

let originalJsSetLangPrefs: ((obj: any, conv?: any) => void) | null = null;
let originalRsSetLangPrefs: ((obj: any, conv?: any) => void) | null = null;

const CITATION_PERSON_METHODS = [
  "previewCitationCluster",
  "appendCitationCluster",
  "processCitationCluster",
  "makeCitationCluster",
] as const;

export function installCneLangPrefPatch(): void {
  // NOTE: This patches citeproc at the prototype level. Any future citations
  // engine updates (citeproc-js or citeproc-rs) should rerun these tests to
  // ensure `setLangPrefsForCites` still behaves as expected.
  try {
    if (typeof CSL !== "undefined" && CSL?.Engine && !originalJsSetLangPrefs) {
      originalJsSetLangPrefs = CSL.Engine.prototype.setLangPrefsForCites;
      CSL.Engine.prototype.setLangPrefsForCites = function (
        obj: any,
        conv?: any,
      ) {
        originalJsSetLangPrefs!.call(this, obj, conv);
        try {
          (this as any)._cneLangOverride?.();
        } catch (err) {
          Zotero?.debug?.("[CNE Config] Error in JS lang override: " + err);
        }
      };
    }

    const RsEngine = (Zotero as any)?.CiteprocRs?.Engine;
    if (RsEngine && !originalRsSetLangPrefs) {
      originalRsSetLangPrefs = RsEngine.prototype.setLangPrefsForCites;
      RsEngine.prototype.setLangPrefsForCites = function (
        obj: any,
        conv?: any,
      ) {
        originalRsSetLangPrefs!.call(this, obj, conv);
        try {
          (this as any)._cneLangOverride?.();
        } catch (err) {
          Zotero?.debug?.("[CNE Config] Error in RS lang override: " + err);
        }
      };
      Object.defineProperty(RsEngine.prototype, "_cnePatched", {
        value: true,
        configurable: true,
      });
    }
  } catch (err) {
    Zotero?.debug?.("[CNE Config] Error installing lang pref patch: " + err);
  }
}

export function configureCiteprocForCNE(
  engine: CiteprocEngine,
  config: CNEConfigOptions,
): void {
  try {
    installCneLangPrefPatch();

    if (!engine || typeof engine.setLangPrefsForCites !== "function") {
      Zotero.debug(
        "[CNE Config] Engine missing setLangPrefsForCites method, skipping",
      );
      return;
    }

    if (!config || typeof config !== "object") {
      Zotero.debug("[CNE Config] Invalid configuration object, skipping");
      return;
    }

    const basePersons = config.persons ? [...config.persons] : undefined;
    const citationPersons = config.citationPersons
      ? [...config.citationPersons]
      : undefined;

    setCneLangOverride(engine, basePersons);
    setPersonPrefsForCNE(engine, basePersons);
    installCitationPersonsOverride(engine, basePersons, citationPersons);

    const romanizedCJK = config.nameFormatting?.romanizedCJK;
    const separator = romanizedCJK?.separator || "space";
    const translitTags = separator === "comma" ? ["en-x-western"] : ["en"];

    try {
      engine.setLangTagsForCslTransliteration(translitTags);
    } catch (err) {
      Zotero.debug(
        "[CNE Config] Error calling setLangTagsForCslTransliteration: " + err,
      );
    }

    Zotero.debug("[CNE Config] Successfully configured citeproc engine");
  } catch (error) {
    Zotero.debug("[CNE Config] Error configuring citeproc engine: " + error);
  }
}

function setCneLangOverride(engine: CiteprocEngine, persons?: string[]): void {
  if (!persons) {
    (engine as any)._cneLangOverride = undefined;
    return;
  }

  const personsSnapshot = [...persons];
  (engine as any)._cneLangOverride = () => {
    enforcePersonPrefs(engine, personsSnapshot);
  };
}

function setPersonPrefsForCNE(
  engine: CiteprocEngine,
  persons?: string[],
): void {
  const citeLangPrefs: Record<string, string[]> = {};
  if (persons) {
    citeLangPrefs.persons = persons;
  }

  engine.setLangPrefsForCites(citeLangPrefs);
  enforcePersonPrefs(engine, persons);
}

function enforcePersonPrefs(engine: CiteprocEngine, persons?: string[]): void {
  if (!persons) {
    return;
  }

  enforcePersonsArray(engine.opt?.["cite-lang-prefs"], persons);
  enforcePersonsArray(engine.state?.opt?.["cite-lang-prefs"], persons);
}

function installCitationPersonsOverride(
  engine: CiteprocEngine,
  basePersons?: string[],
  citationPersons?: string[],
): void {
  const cneEngine = engine as any;
  cneEngine._cneBasePersons = basePersons ? [...basePersons] : undefined;
  cneEngine._cneCitationPersons =
    citationPersons && !sameSlots(citationPersons, basePersons)
      ? [...citationPersons]
      : undefined;

  if (!cneEngine._cneCitationPersons) {
    return;
  }

  if (cneEngine._cneCitationPersonsWrapped) {
    return;
  }

  let wrappedCount = 0;
  for (const methodName of CITATION_PERSON_METHODS) {
    const original = engine?.[methodName];
    if (typeof original !== "function") {
      continue;
    }

    cneEngine[`_cneOriginal_${methodName}`] = original;
    engine[methodName] = function (...args: any[]) {
      return withCitationPersonPrefs(this, () => original.apply(this, args));
    };
    wrappedCount++;
  }

  if (wrappedCount > 0) {
    cneEngine._cneCitationPersonsWrapped = true;
  }
}

function withCitationPersonPrefs<T>(
  engine: CiteprocEngine,
  render: () => T,
): T {
  const cneEngine = engine as any;
  const citationPersons = cneEngine._cneCitationPersons as string[] | undefined;
  const basePersons = cneEngine._cneBasePersons as string[] | undefined;

  if (!citationPersons || sameSlots(citationPersons, basePersons)) {
    return render();
  }

  const depth = cneEngine._cneCitationDepth || 0;
  if (depth > 0) {
    return render();
  }

  const previousOverride = cneEngine._cneLangOverride;
  cneEngine._cneCitationDepth = depth + 1;

  try {
    setCneLangOverride(engine, citationPersons);
    setPersonPrefsForCNE(engine, citationPersons);
    return render();
  } finally {
    cneEngine._cneCitationDepth = depth;
    cneEngine._cneLangOverride = previousOverride;
    setPersonPrefsForCNE(engine, basePersons);
    cneEngine._cneLangOverride?.();
  }
}

function sameSlots(
  left: string[] | undefined,
  right: string[] | undefined,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return left.every((slot, index) => slot === right[index]);
}

function enforcePersonsArray(target: any, values: string[]) {
  if (!target) {
    return;
  }

  const arr = Array.isArray(target.persons)
    ? target.persons
    : (target.persons = []);
  arr.length = 0;
  arr.push(...values);
}

export function setCiteAffixes(
  engine: any,
  affixes: Array<{ prefix?: string; suffix?: string }>,
): void {
  try {
    if (!engine || typeof engine.setLangPrefsForCiteAffixes !== "function") {
      Zotero.debug(
        "[CNE Config] Engine missing setLangPrefsForCiteAffixes method",
      );
      return;
    }

    engine.setLangPrefsForCiteAffixes(affixes);
  } catch (error) {
    Zotero.debug("[CNE Config] Error setting cite affixes: " + error);
  }
}

export function setTransliterationTags(engine: any, tags: string[]): void {
  try {
    if (
      !engine ||
      typeof engine.setLangTagsForCslTransliteration !== "function"
    ) {
      Zotero.debug(
        "[CNE Config] Engine missing setLangTagsForCslTransliteration method",
      );
      return;
    }

    engine.setLangTagsForCslTransliteration(tags);
  } catch (error) {
    Zotero.debug("[CNE Config] Error setting transliteration tags: " + error);
  }
}
