/**
 * Constants for CJK Citation Manager
 */

import type {
  FieldConfig,
  FieldVariant,
  VariantLabelConfig,
} from "./types";

/**
 * Namespace prefix for all CJK fields in Extra
 * Fields will be stored as: cite-cjk.title-original, cite-cjk.title-english, etc.
 */
export const NAMESPACE = "cite-cjk" as const;

/**
 * Field variants in order
 */
export const FIELD_VARIANTS: readonly FieldVariant[] = [
  "original",
  "english",
  "romanized",
] as const;

/**
 * Configuration for all supported CJK fields
 * Defines the fields that will appear in the UI
 */
export const SUPPORTED_FIELDS: readonly FieldConfig[] = [
  {
    name: "title",
    label: "Title",
    l10nKey: "citecjk-field-title",
    description: "Article or book title",
  },
  {
    name: "booktitle",
    label: "Book/Container Title",
    l10nKey: "citecjk-field-booktitle",
    description: "Container title for chapters or articles",
  },
  {
    name: "publisher",
    label: "Publisher",
    l10nKey: "citecjk-field-publisher",
    description: "Publisher name",
  },
  {
    name: "journal",
    label: "Journal",
    l10nKey: "citecjk-field-journal",
    description: "Journal title",
  },
  {
    name: "series",
    label: "Series",
    l10nKey: "citecjk-field-series",
    description: "Series title",
  },
] as const;

/**
 * Labels for field variants
 */
export const VARIANT_LABELS: readonly VariantLabelConfig[] = [
  {
    variant: "original",
    label: "Original",
    l10nKey: "citecjk-variant-original",
    placeholder: "汉字, 漢字, かな, 한글",
  },
  {
    variant: "english",
    label: "English",
    l10nKey: "citecjk-variant-english",
    placeholder: "English translation",
  },
  {
    variant: "romanized",
    label: "Romanized",
    l10nKey: "citecjk-variant-romanized",
    placeholder: "Pinyin, Romaji, etc.",
  },
] as const;

/**
 * UI element ID prefix to avoid conflicts
 */
export const UI_ID_PREFIX = "citecjk" as const;

/**
 * Extra field metadata key for original language
 */
export const ORIGINAL_LANGUAGE_KEY = "original-language" as const;

/**
 * Helper to create namespaced field key
 * @example getFieldKey('title', 'original') => 'cite-cjk.title-original'
 */
export function getFieldKey(
  fieldName: string,
  variant?: FieldVariant,
): string {
  if (variant) {
    return `${NAMESPACE}.${fieldName}-${variant}`;
  }
  return `${NAMESPACE}.${fieldName}`;
}

/**
 * Helper to create UI element ID
 * @example getElementId('title', 'original') => 'citecjk-title-original'
 */
export function getElementId(
  fieldName: string,
  variant?: FieldVariant,
): string {
  if (variant) {
    return `${UI_ID_PREFIX}-${fieldName}-${variant}`;
  }
  return `${UI_ID_PREFIX}-${fieldName}`;
}

/**
 * Helper to get localization key for a field variant
 * @example getL10nKey('title', 'original') => 'citecjk-field-title-original'
 */
export function getL10nKey(fieldName: string, variant?: FieldVariant): string {
  if (variant) {
    return `${UI_ID_PREFIX}-field-${fieldName}-${variant}`;
  }
  return `${UI_ID_PREFIX}-field-${fieldName}`;
}
