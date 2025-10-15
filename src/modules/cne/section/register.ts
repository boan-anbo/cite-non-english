/**
 * Section registration for non-English Citation Manager
 * Registers the item pane section with Zotero's ItemPaneManager
 */

import { getLocaleID } from "../../../utils/locale";
import { renderCneSection } from "./renderer";

/**
 * Register the non-English citation section with ItemPaneManager
 * This creates the section with the "字" icon in the sidebar
 */
export function registerCneSection(): void {
  try {
    Zotero.ItemPaneManager.registerSection({
      paneID: "cne",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("section-header"),
        icon: `chrome://${addon.data.config.addonRef}/content/icons/cne-16.svg`,
      },
      sidenav: {
        l10nID: getLocaleID("section-sidenav-tooltip"),
        icon: `chrome://${addon.data.config.addonRef}/content/icons/cne-20.svg`,
      },
      onRender: renderCneSection,
      // TODO: Add onItemChange handler after testing
    });

    ztoolkit.log("non-English section registered successfully");
  } catch (error) {
    ztoolkit.log("Error registering non-English section:", error);
    throw error;
  }
}
