/**
 * Type definitions for CNE (Cite Non-English) Manager
 */

/**
 * Field variant types for non-English fields
 * - original: Original script (汉字, 漢字, かな, 한글, Cyrillic, etc.)
 * - english: English translation
 * - romanized: Romanization (Pinyin, Romaji, etc.)
 */
export type FieldVariant = "original" | "english" | "romanized";

/**
 * Supported non-English field names
 * Based on common citation requirements for non-English sources
 */
export type CneFieldName =
  | "title"
  | "booktitle"
  | "publisher"
  | "journal"
  | "series";

/**
 * Data structure for a single non-English field with its variants
 */
export interface CneFieldData {
  /** Original script */
  original?: string;
  /** English translation */
  english?: string;
  /** Romanization */
  romanized?: string;
}

/**
 * Complete non-English metadata structure
 * Represents all non-English fields stored for an item
 */
export interface CneMetadataData {
  /** Article or book title */
  title?: CneFieldData;
  /** Container title (for chapters, articles) */
  booktitle?: CneFieldData;
  /** Publisher name */
  publisher?: CneFieldData;
  /** Journal title */
  journal?: CneFieldData;
  /** Series title */
  series?: CneFieldData;
  /** ISO language code (e.g., zh-CN, ja-JP, ko-KR, ru-RU, ar-SA) */
  originalLanguage?: string;
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
