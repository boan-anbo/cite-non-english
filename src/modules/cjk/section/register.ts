/**
 * Section registration for CJK Citation Manager
 * Registers the item pane section with Zotero's ItemPaneManager
 */

import { getLocaleID } from "../../../utils/locale";
import { renderCjkSection } from "./renderer";

/**
 * Register the CJK citation section with ItemPaneManager
 * This creates the section with the "字" icon in the sidebar
 */
export function registerCjkSection(): void {
  try {
    Zotero.ItemPaneManager.registerSection({
      paneID: "citecjk",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("section-header"),
        icon: `chrome://${addon.data.config.addonRef}/content/icons/cite-cjk-16.svg`,
      },
      sidenav: {
        l10nID: getLocaleID("section-sidenav-tooltip"),
        icon: `chrome://${addon.data.config.addonRef}/content/icons/cite-cjk-20.svg`,
      },
      onRender: renderCjkSection,
    });

    ztoolkit.log("CJK section registered successfully");
  } catch (error) {
    ztoolkit.log("Error registering CJK section:", error);
    throw error;
  }
}
