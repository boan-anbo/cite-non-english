/**
 * non-English Citation Manager
 * Public API exports
 */

import { ItemToCSLJSONInterceptor } from "./interceptors";
import { GetCiteProcInterceptor } from "./interceptors/GetCiteProcInterceptor";
import {
  enrichAuthorNames,
  injectCSLVariables,
} from "./callbacks";
import { initializeBibLaTeXIntegration } from "./biblatex-export";

/**
 * Initialize CNE interceptors and callbacks
 * Should be called once at plugin startup
 */
export function initializeCNEInterceptors() {
  // MARKER: This proves we're running the NEW bundle
  Zotero.debug('[CNE] ========== MARKER: NEW BUNDLE 11:05 ==========');

  // Install the itemToCSLJSON interceptor for CSL export (preview, Word, etc.)
  ItemToCSLJSONInterceptor.intercept();

  // CRITICAL: Register CSL variable injection FIRST
  // This works around Zotero's built-in Extra field parser bug where title fields
  // are not parsed when they appear after author fields. Our robust parser handles
  // any field ordering and directly injects CSL variables for the CSL style to use.
  ItemToCSLJSONInterceptor.register(injectCSLVariables);

  // Register production callbacks for CSL export
  ItemToCSLJSONInterceptor.register(enrichAuthorNames);

  // Initialize BibLaTeX export integration
  // This intercepts itemToExportFormat for Better BibTeX compatibility
  initializeBibLaTeXIntegration();

  // MARKER: Did we get past BibLaTeX?
  Zotero.debug('[CNE] ========== MARKER: AFTER BibLaTeX ==========');

  // DIAGNOSTIC: Install getCiteProc interceptor with explicit error throwing
  Zotero.debug('[CNE] === DIAGNOSTIC: Installing GetCiteProc interceptor ===');
  try {
    GetCiteProcInterceptor.intercept();
    Zotero.debug('[CNE] === DIAGNOSTIC: GetCiteProc interceptor installation completed ===');
  } catch (error) {
    // Re-throw to make failure visible in logs
    Zotero.debug('[CNE] === DIAGNOSTIC: FATAL ERROR during interceptor installation ===');
    Zotero.debug('[CNE] Error: ' + error);
    Zotero.debug('[CNE] Stack: ' + (error as Error).stack);
    throw error;
  }
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
  CneCreatorData,
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
