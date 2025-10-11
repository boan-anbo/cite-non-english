/**
 * Type definitions for CJK Citation Manager
 */

/**
 * Field variant types for CJK fields
 * - original: Original script (汉字, 漢字, かな, 한글)
 * - english: English translation
 * - romanized: Romanization (Pinyin, Romaji, etc.)
 */
export type FieldVariant = "original" | "english" | "romanized";

/**
 * Supported CJK field names
 * Based on common citation requirements for CJK sources
 */
export type CjkFieldName =
  | "title"
  | "booktitle"
  | "publisher"
  | "journal"
  | "series";

/**
 * Data structure for a single CJK field with its variants
 */
export interface CjkFieldData {
  /** Original script */
  original?: string;
  /** English translation */
  english?: string;
  /** Romanization */
  romanized?: string;
}

/**
 * Complete CJK metadata structure
 * Represents all CJK fields stored for an item
 */
export interface CjkMetadataData {
  /** Article or book title */
  title?: CjkFieldData;
  /** Container title (for chapters, articles) */
  booktitle?: CjkFieldData;
  /** Publisher name */
  publisher?: CjkFieldData;
  /** Journal title */
  journal?: CjkFieldData;
  /** Series title */
  series?: CjkFieldData;
  /** ISO language code (e.g., zh-CN, ja-JP, ko-KR) */
  originalLanguage?: string;
}

/**
 * Configuration for a CJK field in the UI
 */
export interface FieldConfig {
  /** Internal field name */
  name: CjkFieldName;
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
