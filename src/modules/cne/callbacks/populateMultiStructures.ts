/**
 * Experimental callback to populate Juris-M style multi structures
 *
 * This is an experimental implementation to test if we can activate
 * the dormant multilingual infrastructure in standard Zotero's citeproc.
 *
 * ## Background
 *
 * Standard Zotero's citeproc.js contains the same multilingual code as Juris-M:
 * - multi.main: stores primary language tags for fields
 * - multi._keys: stores variant data by language
 * - cite-lang-prefs: configuration for slot rendering
 *
 * This infrastructure is dormant because Zotero has no UI to populate it.
 * We're testing if we can activate it by populating these structures from CNE data.
 *
 * ## Expected Structure
 *
 * ```javascript
 * item.multi = {
 *   main: {
 *     title: "zh",        // Primary language for title field
 *     author: "zh"        // Primary language for author field
 *   },
 *   _keys: {
 *     title: {
 *       "zh": "环境政策的经济分析",           // Original
 *       "zh-Latn": "Huanjing zhengce...",   // Romanized
 *       "en": "Economic Analysis..."         // Translated
 *     },
 *     publisher: {
 *       "zh": "经济出版社",
 *       "zh-Latn": "Jingji chubanshe",
 *       "en": "Economic Press"
 *     }
 *   }
 * }
 * ```
 *
 * ## Language Tag Mapping
 *
 * CNE variant -> Language tag:
 * - original -> Primary language (zh, ja, ko, etc.)
 * - romanized -> Language-Latn (zh-Latn, ja-Latn, ko-Latn)
 * - english -> en
 *
 * @module populateMultiStructures
 */

import { parseCNEMetadata } from "../metadata-parser";
import type { CneMetadataData, CneFieldData, CneCreatorData } from "../types";

/**
 * Map CNE language codes to standard language tags
 *
 * CNE uses simplified codes, we need to map to standard tags
 */
const LANGUAGE_MAP: Record<string, string> = {
  // Chinese variants
  'chinese': 'zh',
  'chinese-simplified': 'zh-Hans',
  'chinese-traditional': 'zh-Hant',
  'zh': 'zh',
  'zh-cn': 'zh-Hans',
  'zh-tw': 'zh-Hant',

  // Japanese
  'japanese': 'ja',
  'ja': 'ja',

  // Korean
  'korean': 'ko',
  'ko': 'ko',

  // Others
  'arabic': 'ar',
  'hebrew': 'he',
  'russian': 'ru',
  'thai': 'th',
  'vietnamese': 'vi',
};

/**
 * Detect primary language from metadata
 *
 * Uses the original-language field if present, otherwise tries to detect
 * from the content of the original fields.
 */
function detectPrimaryLanguage(metadata: CneMetadataData): string {
  // If explicit language is set, use it
  if (metadata.originalLanguage) {
    const normalized = metadata.originalLanguage.toLowerCase();
    return LANGUAGE_MAP[normalized] || normalized;
  }

  // Try to detect from original text content
  const sampleText = metadata.title?.original ||
                     metadata.journal?.original ||
                     metadata.publisher?.original || '';

  // Simple detection based on character ranges
  if (/[\u4e00-\u9fff]/.test(sampleText)) return 'zh';      // Chinese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sampleText)) return 'ja';  // Japanese
  if (/[\uac00-\ud7af]/.test(sampleText)) return 'ko';      // Korean
  if (/[\u0600-\u06ff]/.test(sampleText)) return 'ar';      // Arabic
  if (/[\u0590-\u05ff]/.test(sampleText)) return 'he';      // Hebrew
  if (/[\u0400-\u04ff]/.test(sampleText)) return 'ru';      // Cyrillic
  if (/[\u0e00-\u0e7f]/.test(sampleText)) return 'th';      // Thai

  // Default to Chinese if we have original text but can't detect
  return sampleText ? 'zh' : '';
}

/**
 * Populate multi._keys for a single field
 */
function populateFieldMulti(
  multiKeys: any,
  fieldName: string,
  fieldData: CneFieldData,
  primaryLang: string
): void {
  if (!fieldData) return;

  // Initialize field object if needed
  if (!multiKeys[fieldName]) {
    multiKeys[fieldName] = {};
  }

  // Map CNE variants to language-tagged values
  if (fieldData.original && primaryLang) {
    multiKeys[fieldName][primaryLang] = fieldData.original;
  }

  if (fieldData.romanized && primaryLang) {
    // Add -Latn suffix for romanized version
    multiKeys[fieldName][`${primaryLang}-Latn`] = fieldData.romanized;
  }

  if (fieldData.romanizedShort && primaryLang) {
    // Store short version with special suffix
    multiKeys[fieldName][`${primaryLang}-Latn-short`] = fieldData.romanizedShort;
  }

  if (fieldData.english) {
    multiKeys[fieldName]['en'] = fieldData.english;
  }
}

/**
 * Populate multi structures for creators
 *
 * Creators in Juris-M use a special structure where each creator
 * has its own multi object.
 */
function populateCreatorMulti(
  creators: any[],
  cneCreators: CneCreatorData[],
  primaryLang: string
): void {
  // Match CNE creators to Zotero creators by index
  cneCreators.forEach((cneCreator, index) => {
    if (!creators[index]) return;

    const creator = creators[index];

    // Initialize multi structure for this creator
    if (!creator.multi) {
      creator.multi = {
        main: null,
        _key: {}
      };
    }

    // Set main language
    if (primaryLang && cneCreator.original) {
      creator.multi.main = primaryLang;
    }

    // Populate _key with variants
    if (cneCreator.original) {
      const originalName: any = {};
      if (cneCreator.original.family) {
        originalName.family = cneCreator.original.family;
      }
      if (cneCreator.original.given) {
        originalName.given = cneCreator.original.given;
      }
      creator.multi._key[primaryLang] = originalName;
    }

    if (cneCreator.romanized) {
      const romanizedName: any = {};
      if (cneCreator.romanized.family) {
        romanizedName.family = cneCreator.romanized.family;
      }
      if (cneCreator.romanized.given) {
        romanizedName.given = cneCreator.romanized.given;
      }
      creator.multi._key[`${primaryLang}-Latn`] = romanizedName;
    }
  });
}

/**
 * Main callback to populate multi structures
 *
 * This runs BEFORE itemToCSLJSON conversion, modifying the Zotero item
 * to include multi structures that the citeproc engine can use.
 *
 * @param zoteroItem - Zotero item to modify
 */
export function populateMultiStructures(zoteroItem: any): void {
  ztoolkit.log("[CNE-JURIS-M] Starting populateMultiStructures");

  try {
    // Get Extra field content
    let extraContent: string | undefined;

    if (typeof zoteroItem.getField === 'function') {
      extraContent = zoteroItem.getField("extra");
    } else if (zoteroItem.extra) {
      extraContent = zoteroItem.extra;
    }

    if (!extraContent) {
      ztoolkit.log("[CNE-JURIS-M] No Extra field content found");
      return;
    }

    // Parse CNE metadata
    const metadata = parseCNEMetadata(extraContent);

    // Detect primary language
    const primaryLang = detectPrimaryLanguage(metadata);
    if (!primaryLang) {
      ztoolkit.log("[CNE-JURIS-M] Could not detect primary language");
      return;
    }

    ztoolkit.log(`[CNE-JURIS-M] Detected primary language: ${primaryLang}`);

    // Initialize multi structure
    if (!zoteroItem.multi) {
      zoteroItem.multi = {
        main: {},
        _keys: {}
      };
    }

    // Ensure sub-objects exist
    if (!zoteroItem.multi.main) {
      zoteroItem.multi.main = {};
    }
    if (!zoteroItem.multi._keys) {
      zoteroItem.multi._keys = {};
    }

    // Populate title
    if (metadata.title) {
      zoteroItem.multi.main.title = primaryLang;
      populateFieldMulti(zoteroItem.multi._keys, 'title', metadata.title, primaryLang);
      ztoolkit.log("[CNE-JURIS-M] Populated title multi structures");
    }

    // Populate container-title (journal)
    if (metadata.journal) {
      zoteroItem.multi.main['container-title'] = primaryLang;
      populateFieldMulti(zoteroItem.multi._keys, 'container-title', metadata.journal, primaryLang);
      ztoolkit.log("[CNE-JURIS-M] Populated container-title multi structures");
    }

    // Populate publisher
    if (metadata.publisher) {
      zoteroItem.multi.main.publisher = primaryLang;
      populateFieldMulti(zoteroItem.multi._keys, 'publisher', metadata.publisher, primaryLang);
      ztoolkit.log("[CNE-JURIS-M] Populated publisher multi structures");
    }

    // Populate publisher-place
    if (metadata.place) {
      zoteroItem.multi.main['publisher-place'] = primaryLang;
      populateFieldMulti(zoteroItem.multi._keys, 'publisher-place', metadata.place, primaryLang);
      ztoolkit.log("[CNE-JURIS-M] Populated publisher-place multi structures");
    }

    // Populate series/collection-title
    if (metadata.series) {
      zoteroItem.multi.main['collection-title'] = primaryLang;
      populateFieldMulti(zoteroItem.multi._keys, 'collection-title', metadata.series, primaryLang);
      ztoolkit.log("[CNE-JURIS-M] Populated collection-title multi structures");
    }

    // Populate creators
    if (metadata.creators && metadata.creators.length > 0) {
      // Get creators array - try multiple access patterns
      let creators;
      if (typeof zoteroItem.getCreators === 'function') {
        creators = zoteroItem.getCreators();
      } else if (zoteroItem.creators) {
        creators = zoteroItem.creators;
      } else if (zoteroItem.author) {
        creators = zoteroItem.author;
      }

      if (creators) {
        populateCreatorMulti(creators, metadata.creators, primaryLang);
        ztoolkit.log(`[CNE-JURIS-M] Populated ${metadata.creators.length} creator multi structures`);
      }
    }

    // Log the resulting structure for debugging
    ztoolkit.log("[CNE-JURIS-M] Final multi structure:", JSON.stringify(zoteroItem.multi, null, 2));

    // Try to configure cite-lang-prefs if we can access the engine
    configureCiteLangPrefs();

  } catch (error) {
    ztoolkit.log(`[CNE-JURIS-M] Error in populateMultiStructures: ${error}`, 'error');
  }
}

/**
 * Attempt to configure cite-lang-prefs in the citeproc engine
 *
 * This is experimental - we're trying to access and configure the engine
 * to enable multilingual rendering.
 */
function configureCiteLangPrefs(): void {
  try {
    // Try to access the global citeproc engine
    // This is a long shot but worth trying

    // Attempt 1: Through Zotero.Cite
    if ((Zotero as any).Cite && (Zotero as any).Cite.System) {
      const system = (Zotero as any).Cite.System;
      ztoolkit.log("[CNE-JURIS-M] Found Zotero.Cite.System");

      // Try to find and configure any active engines
      // This is highly experimental...
    }

    // Attempt 2: Through style manager
    if ((Zotero as any).Styles) {
      ztoolkit.log("[CNE-JURIS-M] Found Zotero.Styles");
      // Styles might have access to citeproc engines
    }

    // Log what we find for debugging
    ztoolkit.log("[CNE-JURIS-M] Unable to configure cite-lang-prefs - engine not accessible");

  } catch (error) {
    ztoolkit.log(`[CNE-JURIS-M] Error configuring cite-lang-prefs: ${error}`);
  }
}