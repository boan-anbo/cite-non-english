/**
 * Callback for enriching creator names with CNE metadata
 *
 * This callback intercepts CSL-JSON conversion to enrich creator names with
 * romanized and original script data for creators (authors, editors, directors,
 * translators, etc.) that have CNE metadata.
 *
 * ## Critical Feature: Name Ordering Control via multi.main
 *
 * ### The Problem: Citeproc-js's Language-Based Name Ordering Bug
 *
 * Citeproc-js automatically applies Asian name ordering (family-first, no comma) to
 * ALL creators when an item has an Asian language code (zh, ja, ko), even for Western
 * names without CNE data.
 *
 * **Root Cause** (in citeproc.js `_isRomanesque()`, lines 13771-13779):
 * ```javascript
 * if (ret == 2) {  // Name is pure romanesque (Western)
 *   if (this.Item.language) {
 *     top_locale = this.Item.language.slice(0, 2);  // Gets "zh" from "zh-CN"
 *   }
 *   if (["ja", "zh"].indexOf(top_locale) > -1) {
 *     ret = 1;  // ❌ Downgrades to "mixed content" → family-first ordering
 *   }
 * }
 * ```
 *
 * **Example Bug** - Chinese book edited by "Alastair Morrison" (no CNE data):
 * - Without fix: "Morrison Alastair" (incorrect Asian ordering)
 * - With fix: "Alastair Morrison" (correct Western ordering)
 * - Test case: `test/csl-tests/fixtures/unified-fixtures.ts` ZHCN_DU_2007_DUNHUANG
 *
 * ### The Solution: Per-Name Language Override via multi.main
 *
 * **What is `multi`?**
 * The `multi` object is a citeproc-js extension (originally from Juris-M/Multilingual
 * Zotero) for multilingual citation support. It's NOT part of standard CSL-JSON spec,
 * but IS included in citeproc-js that ships with standard Zotero 7 (version ~1.4.61).
 *
 * **Structure:**
 * ```javascript
 * {
 *   family: "Morrison",
 *   given: "Alastair",
 *   multi: {
 *     main: "en",           // Primary language of THIS specific name
 *     _key: {               // Alternative language versions (we don't use this)
 *       "zh": {...},
 *       "ja": {...}
 *     }
 *   }
 * }
 * ```
 *
 * **How citeproc-js uses it** (lines 14240-14270):
 * 1. First: Check `name.multi._key[targetLanguage]` for specific translation
 * 2. Second: Use `name.multi.main` for name's primary language (this is what we use!)
 * 3. Third: Fall back to `item.language` (this is what causes the bug)
 *
 * **Our strategy**: Set `name.multi.main` on EVERY creator to override item.language:
 * - Creators WITH CNE data → `multi.main = originalLanguage` (zh/ja/ko) → Asian ordering
 * - Creators WITHOUT CNE data → `multi.main = "en"` → Western ordering
 *
 * This gives us **full predictability**: We explicitly control every creator's ordering
 * based on whether they have CNE metadata, rather than letting citeproc-js make
 * incorrect assumptions from the item's language field.
 *
 * **Compatibility**: Works in standard Zotero 7 without any Juris-M installation!
 * The `multi` field support is built into citeproc-js that ships with Zotero.
 *
 * ## Generic Creator Support
 *
 * Uses index-based matching to enrich creators regardless of type:
 * - cne-creator-0 matches first creator in Zotero's creators array
 * - cne-creator-1 matches second creator, etc.
 * - CSL processor automatically handles role labels ("edited by", "directed by")
 *
 * ## Enrichment Strategy
 *
 * For each creator with CNE metadata:
 * 1. Set `multi.main = originalLanguage` for Asian name ordering
 * 2. Replace family/given with romanized versions if available
 * 3. Append original script name to the given field via STRING CONCATENATION
 *
 * For creators WITHOUT CNE metadata:
 * 1. Set `multi.main = "en"` to preserve Western name ordering
 * 2. Skip all other enrichment (no modifications to family/given)
 *
 * ## Why String Concatenation Instead of multi._key?
 *
 * We use string concatenation (e.g., `given: "Xiaobo 王小波"`) to display both
 * romanized and original script simultaneously. Why not use multi._key?
 *
 * **Experiment A (2025-10-17)** tested storing romanized/original as separate
 * variants in multi._key (romanized in main fields, original in multi._key["zh-CN"]).
 * Result: Citeproc-js only SELECTS one variant based on cite-lang-prefs.
 *
 * Standard CSL styles have `cite-lang-prefs: ['orig']` (only ONE slot), so only
 * romanized OR original displays, NOT both. Multi-slot display (`['translit', 'orig']`)
 * requires CSL-M styles, which are not standardized and have sustainability concerns.
 *
 * **Conclusion**: String concatenation is the ONLY viable way to display both
 * languages simultaneously in standard CSL styles (Chicago, APA, MLA).
 *
 * See docs/multi-key-experiment.md for full experimental results and analysis.
 *
 * ## Complete Example: Mixed Creator List
 *
 * **Input** (Chinese book with Western editor):
 * ```
 * Item:
 *   language: zh-CN
 *   creators: [Du 杜伟生, Lin Shitian, Alastair Morrison]
 *
 * Extra field:
 *   cne-creator-0-last-original: 杜
 *   cne-creator-0-first-original: 伟生
 *   cne-creator-0-last-romanized: Du
 *   cne-creator-0-first-romanized: Weisheng
 *   cne-creator-1-last-original: 林
 *   cne-creator-1-first-original: 世田
 *   cne-creator-1-last-romanized: Lin
 *   cne-creator-1-first-romanized: Shitian
 *   (no cne-creator-2-* fields for Morrison)
 * ```
 *
 * **Output** (CSL-JSON after this callback):
 * ```javascript
 * [
 *   {
 *     family: "Du",
 *     given: "Weisheng 杜伟生",
 *     multi: { main: "zh-CN" }  // ← Asian ordering
 *   },
 *   {
 *     family: "Lin",
 *     given: "Shitian 林世田",
 *     multi: { main: "zh-CN" }  // ← Asian ordering
 *   },
 *   {
 *     family: "Morrison",
 *     given: "Alastair",
 *     multi: { main: "en" }      // ← Western ordering (THE FIX!)
 *   }
 * ]
 * ```
 *
 * **Rendered result:**
 * "Du Weisheng 杜伟生... edited by Lin Shitian 林世田 and Alastair Morrison"
 *
 * ## Technical References
 *
 * **Citeproc-js source** (`tools/citeproc-js-server/lib/citeproc.js`):
 * - `_isRomanesque()`: lines 13759-13783 (detects Western vs Asian names)
 * - Language downgrade bug: lines 13771-13779 (causes Morrison → Morrison Alastair)
 * - Multi-language selection: lines 14240-14270 (uses multi.main)
 * - Name rendering: lines 13785-13860 (family-first vs given-first)
 *
 * **Our implementation**:
 * - Multi.main override: lines 234-272 below
 * - Test case: `test/csl-tests/fixtures/unified-fixtures.ts` ZHCN_DU_2007_DUNHUANG
 *
 * **External references**:
 * - Juris-M project: https://github.com/Juris-M/citeproc-js
 * - Citeproc-js docs: https://citeproc-js.readthedocs.io/en/latest/csl-m/
 * - Detailed explanation: `docs/citeproc-name-ordering.md`
 *
 * ## Integration
 *
 * This callback is registered with ItemToCSLJSONInterceptor and runs after
 * Zotero's core itemToCSLJSON conversion but before CSL processing.
 */

import type { CneCreatorData } from "../types";
import { parseCNEMetadata } from "../metadata-parser";

/**
 * Format original script name
 *
 * @param author - CNE author metadata with original script names
 * @returns Formatted original name string, or empty string if no original data
 */
function formatOriginalName(author: CneCreatorData): string {
  if (!author.lastOriginal && !author.firstOriginal) {
    return "";
  }

  const last = author.lastOriginal || "";
  const first = author.firstOriginal || "";

  // Add space between original names if option is enabled (for Japanese, etc.)
  if (author.optionsOriginalSpacing && last && first) {
    return `${last} ${first}`;
  } else {
    return `${last}${first}`;
  }
}

/**
 * Format romanized name
 *
 * @param author - CNE author metadata with romanized names
 * @returns Formatted romanized name string (e.g., "Hao, Chunwen")
 */
function formatRomanizedName(author: CneCreatorData): string {
  if (!author.lastRomanized && !author.firstRomanized) {
    return "";
  }

  const last = author.lastRomanized || "";
  const first = author.firstRomanized || "";

  // Standard Western format: "Last, First"
  if (last && first) {
    return `${last}, ${first}`;
  } else if (last) {
    return last;
  } else {
    return first;
  }
}

/**
 * Build complete literal name from CNE author data
 *
 * Combines romanized and original names:
 * - "Hao, Chunwen 郝春文"
 * - "Yamada, Tarō 山田 太郎" (with spacing option)
 *
 * @param author - CNE author metadata
 * @returns Complete formatted name, or empty string if no data
 */
function buildLiteralName(author: CneCreatorData): string {
  const romanized = formatRomanizedName(author);
  const original = formatOriginalName(author);

  if (!romanized && !original) {
    return "";
  }

  // Both romanized and original available
  if (romanized && original) {
    return `${romanized} ${original}`;
  }

  // Only one available
  return romanized || original;
}

/**
 * Enrich creator names in CSL-JSON with CNE metadata
 *
 * This callback modifies CSL creator arrays (author, editor, director, translator, etc.)
 * in-place, replacing names with CNE romanized versions and appending original script names.
 *
 * ## Index Mapping Strategy
 *
 * Zotero stores creators in a single unified array, but CSL-JSON splits them by type.
 * Example:
 *   Zotero: [Du (author), Lin (editor), Morrison (editor)]
 *   CSL: {author: [Du], editor: [Lin, Morrison]}
 *
 * CNE indices match Zotero's unified array:
 *   cne-creator-0 → Du (author[0])
 *   cne-creator-1 → Lin (editor[0])
 *   cne-creator-2 → Morrison (editor[1])
 *
 * This function builds a mapping from Zotero indices to CSL type/index pairs.
 *
 * Strategy:
 * - Replace family/given with CNE romanized fields (if available)
 * - Append original script name to the given field
 * - Keep CSL's native name handling logic intact (abbreviations, sorting, etc.)
 *
 * Example:
 *   Input CSL: {family: "王", given: "小波"}
 *   CNE data: lastRomanized: "Wang", firstRomanized: "Xiaobo", lastOriginal: "王", firstOriginal: "小波"
 *   Output CSL: {family: "Wang", given: "Xiaobo 王小波"}
 *
 * @param zoteroItem - Original Zotero item (used to read Extra field and creators)
 * @param cslItem - CSL-JSON object to modify in-place
 */
export function enrichAuthorNames(zoteroItem: any, cslItem: any) {
  // Get Extra field content
  const extraContent = zoteroItem.getField("extra");
  if (!extraContent) {
    return; // No Extra field, nothing to do
  }

  // Parse CNE metadata
  const metadata = parseCNEMetadata(extraContent);
  if (!metadata.authors || metadata.authors.length === 0) {
    return; // No creator metadata, nothing to do
  }

  // Get the original language code for CNE creators
  // This will be used to set multi.main for Asian name ordering
  // Priority: 1) CNE metadata, 2) item language field, 3) default to "zh"
  const originalLang = metadata.originalLanguage || zoteroItem.getField("language") || "zh";

  // Track position in metadata.authors array as we process creators sequentially
  let metadataIndex = 0;
  let enrichedCount = 0;

  // Process creators sequentially by iterating through CSL item properties
  // This dynamically discovers creator arrays (author, editor, etc.) without hardcoding types
  for (const key in cslItem) {
    const value = cslItem[key];

    // Check if this property is an array of name objects (creators)
    if (!Array.isArray(value) || value.length === 0) {
      continue;
    }

    // Check if first element looks like a name object (has family/given/literal)
    const firstElement = value[0];
    if (!firstElement || typeof firstElement !== 'object') {
      continue;
    }

    if (!('family' in firstElement || 'given' in firstElement || 'literal' in firstElement)) {
      continue;
    }

    // This is a creator array - enrich each creator
    for (let i = 0; i < value.length; i++) {
      const cslCreator = value[i];

      // Get CNE metadata for this creator
      const cneCreator = metadata.authors[metadataIndex];
      metadataIndex++;

      // ============================================================================
      // CRITICAL: Name Ordering Control via multi.main
      // ============================================================================
      //
      // Problem: Citeproc-js applies Asian name ordering (family-first, no comma)
      // to ALL creators when item.language is Asian (zh/ja/ko), even for Western
      // names without CNE data. This causes "Alastair Morrison" → "Morrison Alastair".
      //
      // Root Cause: In citeproc.js _isRomanesque() (lines 13771-13779), it checks
      // item.language and downgrades romanesque names to "mixed content", triggering
      // family-first ordering.
      //
      // Solution: Set name.multi.main on EVERY creator to override item.language:
      // - WITH CNE data → multi.main = originalLang (zh/ja/ko) → Asian ordering
      // - WITHOUT CNE data → multi.main = "en" → Western ordering
      //
      // Note: The 'multi' object is a citeproc-js extension (from Juris-M/Multilingual
      // Zotero), NOT part of standard CSL-JSON. It provides per-name language control.
      // Structure: { family, given, multi: { main: "en", _key: {...} } }
      //
      // This gives us explicit control over every creator's formatting.
      // See docs/citeproc-name-ordering.md for detailed explanation.
      // ============================================================================

      const hasCneData = cneCreator &&
        (cneCreator.lastRomanized || cneCreator.firstRomanized ||
         cneCreator.lastOriginal || cneCreator.firstOriginal);

      if (hasCneData) {
        // This creator has CNE data → use original language for Asian ordering
        // Example: Du Weisheng 杜伟生 → "Du Weisheng" (family-first)
        if (!cslCreator.multi) {
          cslCreator.multi = {};
        }
        cslCreator.multi.main = originalLang;
      } else {
        // This creator has NO CNE data → force English for Western ordering
        // Example: Alastair Morrison → "Alastair Morrison" (given-first)
        if (!cslCreator.multi) {
          cslCreator.multi = {};
        }
        cslCreator.multi.main = "en";
      }

      // Skip enrichment if no CNE data
      if (!hasCneData) {
        continue;
      }

      // ============================================================================
      // Name Enrichment: String Concatenation Approach
      // ============================================================================
      //
      // We concatenate romanized + original names in the `given` field to display
      // both simultaneously (e.g., "Du Weisheng 杜伟生").
      //
      // WHY NOT USE multi._key FOR DISPLAY?
      //
      // We tested storing romanized/original as separate variants in multi._key
      // (romanized in main fields, original in multi._key["zh-CN"]), but
      // Experiment A (2025-10-17) proved that citeproc-js only SELECTS one
      // variant from multi._key based on cite-lang-prefs configuration.
      //
      // Standard CSL styles have cite-lang-prefs: ['orig'] (only ONE slot),
      // so only romanized OR original displays, NOT both.
      //
      // CONCLUSION: String concatenation is the ONLY way to display both
      // romanized + original simultaneously in standard CSL styles.
      //
      // See docs/multi-key-experiment.md for full experimental analysis.
      // ============================================================================

      // Handle literal names (single-field names) - convert to family/given if we have romanized data
      if (cslCreator.literal) {
        // If we have romanized names, replace literal with structured name
        if (cneCreator.lastRomanized || cneCreator.firstRomanized) {
          delete cslCreator.literal;
          cslCreator.family = cneCreator.lastRomanized || "";
          cslCreator.given = cneCreator.firstRomanized || "";
        }
      }

      // Replace family/given with CNE romanized names if available
      if (cneCreator.lastRomanized) {
        cslCreator.family = cneCreator.lastRomanized;
      }
      if (cneCreator.firstRomanized) {
        cslCreator.given = cneCreator.firstRomanized;
      }

      // Append original script name to the given field
      // NOTE: This string concatenation is NECESSARY because standard CSL styles
      // do not support displaying multiple language variants from multi._key.
      // Experiment A confirmed that multi._key only enables language SELECTION,
      // not simultaneous DISPLAY. See docs/multi-key-experiment.md.
      const originalName = formatOriginalName(cneCreator);
      if (originalName) {
        if (cslCreator.given) {
          cslCreator.given = `${cslCreator.given} ${originalName}`;
        } else {
          cslCreator.given = originalName;
        }
      }

      enrichedCount++;
    }
  }

  if (enrichedCount > 0) {
    ztoolkit.log(`[CNE] Enriched ${enrichedCount} creator name(s) with romanized + original`);
  }
}
