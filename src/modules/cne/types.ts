/**
 * Type definitions for CNE (Cite Non-English) Manager
 */

/**
 * Field variant types for non-English fields
 * - original: Original script (汉字, 漢字, かな, 한글, Cyrillic, etc.)
 * - romanized: Romanization (Pinyin, Romaji, etc.)
 * - romanizedShort: Optional short form for subsequent citations
 * - english: English translation
 */
export type FieldVariant = "original" | "romanized" | "romanizedShort" | "english";

/**
 * Supported non-English field names
 * Based on common citation requirements for non-English sources
 */
export type CneFieldName =
  | "title"
  | "container-title"
  | "publisher"
  | "journal";

/**
 * Data structure for a single non-English field with its variants
 */
export interface CneFieldData {
  /** Original script */
  original?: string;
  /** Romanization */
  romanized?: string;
  /** Optional short form for subsequent citations */
  romanizedShort?: string;
  /** English translation */
  english?: string;
}

/**
 * CNE data for a single creator (author, editor, director, translator, etc.)
 * Stored with indexed fields in Extra (cne-creator-0-*, cne-creator-1-*, etc.)
 *
 * Philosophy: Allow users to store original script names in Zotero's native fields,
 * while CNE manages both romanized and original forms for flexible citation handling.
 */
export interface CneCreatorData {
  /** Family name in romanized form (Pinyin, Romaji, etc.) */
  lastRomanized?: string;
  /** Given name in romanized form */
  firstRomanized?: string;
  /** Family name in original script */
  lastOriginal?: string;
  /** Given name in original script */
  firstOriginal?: string;
  /** Add space between original names (for Japanese, etc.) */
  optionsOriginalSpacing?: boolean;
  /** Force comma separator in romanized name (for CJK names that default to space) */
  optionsForceComma?: boolean;
}

/**
 * Complete non-English metadata structure
 * Represents all non-English fields stored for an item
 */
export interface CneMetadataData {
  /** Article or book title */
  title?: CneFieldData;
  /** Container title (CSL-compliant hyphenated format) */
  "container-title"?: CneFieldData;
  /** Publisher name */
  publisher?: CneFieldData;
  /** Journal title */
  journal?: CneFieldData;
  /** ISO language code (e.g., zh-CN, ja-JP, ko-KR, ru-RU, ar-SA) */
  originalLanguage?: string;
  /** Creator names with CNE metadata (indexed by position, matches Zotero creators array) */
  authors?: CneCreatorData[];
}

/**
 * Configuration for a non-English field in the UI
 */
export interface FieldConfig {
  /** Internal field name */
  name: CneFieldName;
  /** Display label in English */
  label: string;
  /** Localization key for Fluent */
  l10nKey: string;
  /** Description or help text */
  description?: string;
}

/**
 * Variant label configuration for UI
 */
export interface VariantLabelConfig {
  variant: FieldVariant;
  label: string;
  l10nKey: string;
  placeholder?: string;
}
