/**
 * CJK Citation Manager
 * Public API exports
 */

// Section registration
export { registerCjkSection } from "./section/register";

// Data model
export { CjkMetadata } from "./model/CjkMetadata";

// Parser utilities
export {
  parseExtraField,
  serializeToExtra,
  hasCjkMetadata,
} from "./model/extraFieldParser";

// Types
export type {
  FieldVariant,
  CjkFieldName,
  CjkFieldData,
  CjkMetadataData,
  FieldConfig,
  VariantLabelConfig,
} from "./types";

// Constants
export {
  NAMESPACE,
  FIELD_VARIANTS,
  SUPPORTED_FIELDS,
  VARIANT_LABELS,
  getFieldKey,
  getElementId,
  getL10nKey,
} from "./constants";
