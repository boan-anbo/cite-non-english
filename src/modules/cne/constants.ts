/**
 * Constants for Non-English Citation Manager
 */

import type {
  FieldConfig,
  FieldVariant,
  VariantLabelConfig,
} from "./types";

/**
 * Namespace prefix for all Non-English fields in Extra
 * Fields will be stored as: cne-title-original, cne-title-romanized, cne-title-romanized-short, cne-title-english
 */
export const NAMESPACE = "cne" as const;

/**
 * Field variants in order
 */
export const FIELD_VARIANTS: readonly FieldVariant[] = [
  "original",
  "romanized",
  "romanizedShort",
  "english",
] as const;

/**
 * Configuration for all supported Non-English fields
 * Defines the fields that will appear in the UI
 */
export const SUPPORTED_FIELDS: readonly FieldConfig[] = [
  {
    name: "title",
    label: "Title",
    l10nKey: "cne-field-title",
    description: "Article or book title",
    // Uses all 4 variants (default)
  },
  {
    name: "container-title",
    label: "Container Title",
    l10nKey: "cne-field-container-title",
    description: "Container title for chapters or articles",
    // Uses all 4 variants (default)
  },
  {
    name: "publisher",
    label: "Publisher",
    l10nKey: "cne-field-publisher",
    description: "Publisher name",
    variants: ["original", "romanized"], // Only 2 variants
  },
  {
    name: "journal",
    label: "Journal",
    l10nKey: "cne-field-journal",
    description: "Journal title",
    variants: ["original", "romanized"], // Only 2 variants
  },
  {
    name: "series",
    label: "Series",
    l10nKey: "cne-field-series",
    description: "Series title",
    variants: ["original", "romanized"], // Only 2 variants
  },
] as const;

/**
 * Labels for field variants
 */
export const VARIANT_LABELS: readonly VariantLabelConfig[] = [
  {
    variant: "original",
    label: "Original",
    l10nKey: "cne-variant-original",
    placeholder: "汉字, 漢字, かな, 한글",
  },
  {
    variant: "romanized",
    label: "Romanized",
    l10nKey: "cne-variant-romanized",
    placeholder: "Pinyin, Romaji, etc.",
  },
  {
    variant: "romanizedShort",
    label: "Romanized (Short)",
    l10nKey: "cne-variant-romanized-short",
    placeholder: "Short form for subsequent citations",
  },
  {
    variant: "english",
    label: "English",
    l10nKey: "cne-variant-english",
    placeholder: "English translation",
  },
] as const;

/**
 * UI element ID prefix to avoid conflicts
 */
export const UI_ID_PREFIX = "cne" as const;

/**
 * Extra field metadata key for original language
 */
export const ORIGINAL_LANGUAGE_KEY = "original-language" as const;

/**
 * Helper to create namespaced field key
 * @example getFieldKey('title', 'english') => 'cne-title-english'
 */
export function getFieldKey(
  fieldName: string,
  variant?: FieldVariant,
): string {
  if (variant) {
    return `${NAMESPACE}-${fieldName}-${variant}`;
  }
  return `${NAMESPACE}-${fieldName}`;
}

/**
 * Helper to create UI element ID
 * @example getElementId('title', 'romanized') => 'cne-title-romanized'
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
 * @example getL10nKey('title', 'romanized') => 'cne-field-title-romanized'
 */
export function getL10nKey(fieldName: string, variant?: FieldVariant): string {
  if (variant) {
    return `${UI_ID_PREFIX}-field-${fieldName}-${variant}`;
  }
  return `${UI_ID_PREFIX}-field-${fieldName}`;
}
