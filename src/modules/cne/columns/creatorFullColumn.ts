/**
 * Creator Column for CNE (Cite Non-English)
 * Displays formatted creator names with locale-aware formatting
 *
 * Formatting rules:
 * - CJK languages (zh-*, ja-JP, ko-KR): "LastFirst" (no comma, no space)
 * - Other languages: "Last, First" (with comma and space)
 */

import { parseCNEMetadata } from "../metadata-parser";

/**
 * CJK language codes that should use no-space formatting
 */
const CJK_LANGUAGES = new Set([
  "zh-CN", "zh-TW", "zh-HK", "zh-SG", // Chinese variants
  "ja-JP", "ja",                       // Japanese
  "ko-KR", "ko",                       // Korean
  "zh", // Generic Chinese
]);

/**
 * Check if a language code is CJK
 *
 * @param languageCode - ISO language code (e.g., "zh-CN", "ja-JP")
 * @returns true if the language is CJK
 */
function isCJKLanguage(languageCode: string): boolean {
  if (!languageCode) return false;

  // Check exact match
  if (CJK_LANGUAGES.has(languageCode)) return true;

  // Check prefix match (e.g., "zh-" for any Chinese variant)
  const prefix = languageCode.split("-")[0];
  return CJK_LANGUAGES.has(prefix);
}

/**
 * Get language from item's CNE metadata
 *
 * @param item - Zotero item
 * @returns Language code or empty string
 */
function getItemLanguage(item: Zotero.Item): string {
  try {
    // Try to get language from Zotero's native language field
    const zoteroLanguage = item.getField("language");
    if (zoteroLanguage) return zoteroLanguage as string;

    // If not available, try to get from CNE metadata
    const extraContent = item.getField("extra") as string;
    if (extraContent) {
      const cneMetadata = parseCNEMetadata(extraContent);
      if (cneMetadata.originalLanguage) {
        return cneMetadata.originalLanguage;
      }
    }
  } catch (e) {
    // Silently fail - not all items have these fields
  }

  return "";
}

/**
 * Detect if a name string contains CJK characters
 * Used as fallback when language field is not available
 *
 * @param text - Text to check
 * @returns true if text contains CJK characters
 */
function containsCJKCharacters(text: string): boolean {
  if (!text) return false;

  // Unicode ranges for CJK characters
  const cjkPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
  return cjkPattern.test(text);
}

/**
 * Format creator name based on language
 *
 * @param creator - Zotero creator object
 * @param isCJK - Whether to use CJK formatting
 * @returns Formatted name string
 */
function formatCreatorName(creator: any, isCJK: boolean): string {
  const lastName = creator.lastName || "";
  const firstName = creator.firstName || "";

  // If only lastName exists (single-field name)
  if (!firstName) {
    return lastName;
  }

  if (isCJK) {
    // CJK: LastFirst (no comma, no space)
    return `${lastName}${firstName}`;
  } else {
    // Other languages: Last, First (with comma and space)
    return `${lastName}, ${firstName}`;
  }
}

/**
 * Get formatted creator display for an item
 *
 * @param item - Zotero item
 * @returns Formatted creator string
 */
export function getCreatorDisplay(item: Zotero.Item): string {
  try {
    // Get creators
    const creators = item.getCreators();
    if (!creators || creators.length === 0) {
      return "";
    }

    // Get first creator
    const firstCreator = creators[0];

    // Determine language and formatting
    const language = getItemLanguage(item);
    let useCJKFormat = false;

    if (language) {
      // Use language field if available
      useCJKFormat = isCJKLanguage(language);
    } else {
      // Fallback: detect from name characters
      const lastName = firstCreator.lastName || "";
      const firstName = firstCreator.firstName || "";
      useCJKFormat = containsCJKCharacters(lastName) || containsCJKCharacters(firstName);
    }

    // Format and return
    return formatCreatorName(firstCreator, useCJKFormat);
  } catch (e) {
    ztoolkit.log("[CNE] Error getting creator display:", e);
    return "";
  }
}

/**
 * Register the Creators Full column
 * Adds a custom column to the Zotero item tree
 */
export async function registerCreatorColumn(): Promise<void> {
  try {
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: "cne-creator",
      label: "Creators Full",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return getCreatorDisplay(item);
      },
      // Optional: Add icon
      // iconPath: "chrome://zotero/skin/16/universal/user.svg",
    });

    ztoolkit.log("[CNE] Creator column registered successfully");
  } catch (e) {
    ztoolkit.log("[CNE] Error registering creator column:", e);
  }
}
