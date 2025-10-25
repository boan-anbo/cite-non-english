/**
 * non-English Citation Manager
 * Public API exports
 */

import { ItemToCSLJSONInterceptor } from "./interceptors";
import { GetCiteProcInterceptor } from "./interceptors/GetCiteProcInterceptor";
import { enrichAuthorNames, injectCSLVariables } from "./callbacks";
import {
  initializeBibLaTeXIntegration,
  removeBibLaTeXIntegration,
} from "./biblatex-export";
import { getPref } from "../../utils/prefs";
import { config } from "../../../package.json";
import { getString } from "../../utils/locale";

let cneProcessingActive = false;
let prefObserverID: symbol | undefined;

function installCneProcessing() {
  Zotero.debug("[CNE] ========== MARKER: NEW BUNDLE 11:05 ==========");

  ItemToCSLJSONInterceptor.intercept();
  ItemToCSLJSONInterceptor.clearCallbacks();
  ItemToCSLJSONInterceptor.register(injectCSLVariables);
  ItemToCSLJSONInterceptor.register(enrichAuthorNames);

  initializeBibLaTeXIntegration();

  Zotero.debug("[CNE] ========== MARKER: AFTER BibLaTeX ==========");
  Zotero.debug("[CNE] === DIAGNOSTIC: Installing GetCiteProc interceptor ===");

  try {
    GetCiteProcInterceptor.intercept();
    Zotero.debug(
      "[CNE] === DIAGNOSTIC: GetCiteProc interceptor installation completed ===",
    );
  } catch (error) {
    Zotero.debug(
      "[CNE] === DIAGNOSTIC: FATAL ERROR during interceptor installation ===",
    );
    Zotero.debug("[CNE] Error: " + error);
    Zotero.debug("[CNE] Stack: " + (error as Error).stack);
    throw error;
  }
}

function uninstallCneProcessing() {
  ItemToCSLJSONInterceptor.remove();
  ItemToCSLJSONInterceptor.clearCallbacks();
  GetCiteProcInterceptor.remove();
  removeBibLaTeXIntegration();
}

export function setCneProcessingEnabled(enabled: boolean) {
  if (enabled && !cneProcessingActive) {
    installCneProcessing();
    cneProcessingActive = true;
    ztoolkit.log("[CNE] Processing interceptors enabled");
  } else if (!enabled && cneProcessingActive) {
    uninstallCneProcessing();
    cneProcessingActive = false;
    ztoolkit.log("[CNE] Processing interceptors disabled");
  }
}

export function isCneProcessingEnabled() {
  return cneProcessingActive;
}

export function watchCneProcessingPreference() {
  if (prefObserverID) {
    return prefObserverID;
  }

  const prefName = `${config.prefsPrefix}.enable`;
  prefObserverID = Zotero.Prefs.registerObserver(prefName, () => {
    const enabled = getPref("enable");
    setCneProcessingEnabled(enabled !== false);
  });

  return prefObserverID;
}

export function unwatchCneProcessingPreference() {
  if (!prefObserverID) {
    return;
  }
  Zotero.Prefs.unregisterObserver(prefObserverID);
  prefObserverID = undefined;
}

/**
 * Register the CNE preferences pane with Zotero's preferences UI.
 */
export function registerCnePrefs() {
  Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    src: rootURI + "content/preferences.xhtml",
    label: getString("prefs-title"),
    image: `chrome://${addon.data.config.addonRef}/content/icons/cne-20.svg`,
  });
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
