/**
 * non-English Citation Manager
 * Public API exports
 */

import { ItemToCSLJSONInterceptor } from "./interceptors";
import {
  testAppendToNote,
  enrichAuthorNames,
  enrichTitleFields,
  enrichTitleFieldsWithShortForm,
} from "./callbacks";
import { initializeBibLaTeXIntegration } from "./biblatex-export";

/**
 * Initialize CNE interceptors and callbacks
 * Should be called once at plugin startup
 */
export function initializeCNEInterceptors() {
  // Install the itemToCSLJSON interceptor for CSL export (preview, Word, etc.)
  ItemToCSLJSONInterceptor.intercept();

  // Register production callbacks for CSL export
  ItemToCSLJSONInterceptor.register(enrichAuthorNames);

  // Register hard-coded title enrichment
  // This callback checks the enableHardcodedTitles preference internally
  // Uses preset-based configuration for flexible title formatting
  ItemToCSLJSONInterceptor.register(enrichTitleFields);

  // Optional: Short form for subsequent citations
  // ItemToCSLJSONInterceptor.register(enrichTitleFieldsWithShortForm);

  // Register test callback (for demonstration - can be commented out in production)
  // ItemToCSLJSONInterceptor.register(testAppendToNote);

  // Initialize BibLaTeX export integration
  // This intercepts itemToExportFormat for Better BibTeX compatibility
  initializeBibLaTeXIntegration();
}

// Section registration
export { registerCneSection } from "./section/register";

// Column registration
export { registerCreatorColumn } from "./columns";

// UI Factories
export { CneUIFactory } from "./CneUIFactory";
export { CnePreviewFactory } from "./CnePreviewFactory";

// Data model
export { CneMetadata } from "./model/CneMetadata";

// Parser utilities
export {
  parseCNEMetadata,
  serializeToExtra,
  hasCneMetadata,
  stripCneMetadata,
} from "./metadata-parser";

// Types
export type {
  FieldVariant,
  CneFieldName,
  CneFieldData,
  CneMetadataData,
  CneAuthorData,
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
