/**
 * non-English Citation Manager
 * Public API exports
 */

// Section registration
export { registerCneSection } from "./section/register";

// Data model
export { CneMetadata } from "./model/CneMetadata";

// Parser utilities
export {
  parseExtraField,
  serializeToExtra,
  hasCneMetadata,
} from "./model/extraFieldParser";

// Types
export type {
  FieldVariant,
  CneFieldName,
  CneFieldData,
  CneMetadataData,
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
