import { initLocale } from "./utils/locale";
import { getPref } from "./utils/prefs";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import { installCuratedStylesSilently } from "./modules/cne/styles/installCuratedStyles";

import {
  registerCneSection,
  registerCreatorColumn,
  CneUIFactory,
  CnePreviewFactory,
  registerCnePrefs,
  setCneProcessingEnabled,
  watchCneProcessingPreference,
  unwatchCneProcessingPreference,
} from "./modules/cne";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  try {
    await installCuratedStylesSilently();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    Zotero.logError(err);
  }

  // Initialize CNE processing interceptors based on preference
  const enablePref = getPref("enable");
  const processingPrefEnabled = enablePref === undefined ? true : Boolean(enablePref);
  setCneProcessingEnabled(processingPrefEnabled);
  watchCneProcessingPreference();

  registerCnePrefs();

  // Register Creator (CNE) column for locale-aware name display
  await registerCreatorColumn();

  // Register CJK citation section (replaces example section)
  registerCneSection();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );

  // Mark initialized as true to confirm plugin loading status
  // outside of the plugin (e.g. scaffold testing process)
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  // Register CNE UI features
  // Removed for now - can be re-enabled in future:
  // CneUIFactory.registerCSLExportMenuItem();
  // CnePreviewFactory.registerPreviewMenuItem();

  // New menu item for clearing CNE metadata
  CneUIFactory.registerClearMetadataMenuItem();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();

  // Clean up CNE processing interceptors and observers
  setCneProcessingEnabled(false);
  unwatchCneProcessingPreference();

  ztoolkit.log("[CNE] All interceptors cleaned up");

  // Remove addon object
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // Reserved for future CNE notifier handling
  ztoolkit.log("notify", event, type, ids, extraData);
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

function onDialogEvents(type: string) {
  switch (type) {
    case "cslJsonExport":
      CneUIFactory.cslJsonExportDialog();
      break;
    case "cnePreview":
      CnePreviewFactory.showPreviewDialog();
      break;
    case "clearCNEMetadata":
      CneUIFactory.clearCNEMetadata();
      break;
    default:
      break;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintain.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onDialogEvents,
};
