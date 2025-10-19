/**
 * CNE Preview Factory
 * Citation preview functionality for CNE plugin using Zotero's internal CSL engine
 * Based on Zotero Style Editor (csledit.js) patterns
 */

import { getString } from "../../utils/locale";
import {
  extractCNEConfigFromStyle,
  configureCiteprocForCNE,
  getDefaultCNEConfig,
} from './config';

/**
 * Decorator for example functions
 */
function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling CNE preview ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(
        `Error in CNE preview ${target.name}.${String(propertyKey)}`,
        e,
      );
      throw e;
    }
  };
  return descriptor;
}

export class CnePreviewFactory {
  /**
   * Register right-click menu item for citation preview
   */
  @example
  static registerPreviewMenuItem() {
    const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/cite-cjk-16.svg`;

    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-cne-preview-citation",
      label: getString("menuitem-preview-citation"),
      commandListener: (ev) => addon.hooks.onDialogEvents("cnePreview"),
      icon: menuIcon,
    });
  }

  /**
   * Show citation preview dialog
   * Uses Zotero's internal CSL engine (no external server needed)
   */
  @example
  static async showPreviewDialog() {
    // Get selected items
    const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();

    if (!items || items.length === 0) {
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: "No items selected",
          type: "fail",
          progress: 100,
        })
        .show();
      return;
    }

    ztoolkit.log(`Previewing citation for ${items.length} item(s)`);

    // Get available styles and default to first available, or Chicago
    const availableStyles = Zotero.Styles.getVisible();
    let defaultStyleId = "http://www.zotero.org/styles/chicago-note-bibliography";

    // Try to find CNE test style first, otherwise use Chicago
    const cneTestStyle = availableStyles.find((s: any) =>
      s.styleID.includes("cne-test") || s.title.includes("CNE")
    );

    if (cneTestStyle) {
      defaultStyleId = cneTestStyle.styleID;
    } else if (availableStyles.length > 0) {
      defaultStyleId = availableStyles[0].styleID;
    }

    const defaultLocale = "en-US";
    ztoolkit.log(`Using default style: ${defaultStyleId}`);

    // Dialog data
    const dialogData: { [key: string | number]: any } = {
      selectedStyleId: defaultStyleId,
      selectedLocale: defaultLocale,
      citationHTML: "",
      bibliographyHTML: "",
      items: items,
      citationsDiv: null,
      bibliographyDiv: null,
      loadCallback: () => {
        ztoolkit.log("CNE Preview Dialog opened");
      },
      unloadCallback: () => {
        ztoolkit.log("CNE Preview Dialog closed");
      },
    };

    // Get available styles for dropdown
    const styles = Zotero.Styles.getVisible();
    const styleOptions = styles.map((style: any) => ({
      label: style.title,
      value: style.styleID,
    }));

    // Create dialog
    const dialogHelper = new ztoolkit.Dialog(8, 2)
      .addCell(0, 0, {
        tag: "h2",
        properties: { innerHTML: getString("dialog-preview-title") },
        styles: {
          marginBottom: "10px",
        },
      })
      .addCell(1, 0, {
        tag: "label",
        properties: { innerHTML: getString("dialog-preview-style-label") },
        styles: {
          marginBottom: "5px",
        },
      })
      .addCell(
        1,
        1,
        {
          tag: "select",
          namespace: "html",
          id: "cne-style-selector",
          attributes: {
            "data-bind": "selectedStyleId",
            "data-prop": "value",
          },
          styles: {
            width: "300px",
            marginBottom: "10px",
          },
          children: styleOptions.map((opt: any) => ({
            tag: "option",
            properties: {
              value: opt.value,
              innerHTML: opt.label,
              selected: opt.value === defaultStyleId,
            },
          })),
          listeners: [
            {
              type: "change",
              listener: async (e: Event) => {
                const select = e.target as HTMLSelectElement;
                dialogData.selectedStyleId = select.value;
                ztoolkit.log(`Style changed to: ${select.value}`);
                // Wait a tick to ensure dialogHelper is set
                await Zotero.Promise.delay(10);
                await CnePreviewFactory.updatePreview(dialogData);
              },
            },
          ],
        },
        false,
      )
      .addCell(
        2,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: async (e: Event) => {
                ztoolkit.log("Refresh button clicked");
                await CnePreviewFactory.updatePreview(dialogData);
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "5px 15px",
              },
              properties: {
                innerHTML: getString("dialog-preview-refresh-button"),
              },
            },
          ],
        },
        false,
      )
      .addCell(3, 0, {
        tag: "h3",
        properties: { innerHTML: getString("dialog-preview-citations-label") },
        styles: {
          marginTop: "10px",
          marginBottom: "5px",
        },
      })
      .addCell(
        4,
        0,
        {
          tag: "div",
          namespace: "html",
          id: "cne-citations-preview",
          styles: {
            width: "700px",
            height: "150px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
            overflow: "auto",
            fontFamily: "serif",
            fontSize: "14px",
          },
          properties: {
            innerHTML: "<p>Loading citations...</p>",
          },
        },
        false,
      )
      .addCell(5, 0, {
        tag: "h3",
        properties: {
          innerHTML: getString("dialog-preview-bibliography-label"),
        },
        styles: {
          marginTop: "10px",
          marginBottom: "5px",
        },
      })
      .addCell(
        6,
        0,
        {
          tag: "div",
          namespace: "html",
          id: "cne-bibliography-preview",
          styles: {
            width: "700px",
            height: "200px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
            overflow: "auto",
            fontFamily: "serif",
            fontSize: "14px",
          },
          properties: {
            innerHTML: "<p>Loading bibliography...</p>",
          },
        },
        false,
      )
      .addCell(
        7,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                // Copy HTML to clipboard
                const citationHTML = dialogData.citationHTML || "";
                const biblioHTML = dialogData.bibliographyHTML || "";
                const combined = `${citationHTML}\n\n${biblioHTML}`;

                new ztoolkit.Clipboard()
                  .addText(combined, "text/html")
                  .addText(combined, "text/unicode")
                  .copy();

                new ztoolkit.ProgressWindow(addon.data.config.addonName)
                  .createLine({
                    text: "Preview HTML copied to clipboard!",
                    type: "success",
                    progress: 100,
                  })
                  .show();
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "8px 20px",
              },
              properties: {
                innerHTML: getString("dialog-preview-copy-button"),
              },
            },
          ],
        },
        false,
      )
      .addButton("Close", "close")
      .setDialogData(dialogData);

    // Save dialog helper reference
    dialogData.dialogHelper = dialogHelper;

    // Open dialog
    dialogHelper.open("CNE Citation Preview");

    // Generate initial preview after dialog is open
    setTimeout(() => {
      this.updatePreview(dialogData);
    }, 100);

    await dialogData.unloadLock.promise;
  }

  /**
   * Update preview using Zotero's CSL engine
   * This is the core function that generates citations and bibliography
   */
  @example
  static async updatePreview(dialogData: any) {
    try {
      const items = dialogData.items;
      const styleId = dialogData.selectedStyleId;
      const locale = dialogData.selectedLocale || "en-US";

      ztoolkit.log(`Generating preview with style: ${styleId}, locale: ${locale}`);

      // Get citation and bibliography HTML
      const result = await this.generateCitationPreview(items, styleId, locale);

      // Update dialog data
      dialogData.citationHTML = result.citationHTML;
      dialogData.bibliographyHTML = result.bibliographyHTML;

      // Update UI - use dialog window's document
      const dialogDoc = dialogData.dialogHelper?.window?.document;
      if (!dialogDoc) {
        ztoolkit.log("Dialog document not available");
        return;
      }

      const citationsDiv = dialogDoc.getElementById("cne-citations-preview");
      const bibliographyDiv = dialogDoc.getElementById("cne-bibliography-preview");

      if (citationsDiv) {
        citationsDiv.innerHTML = result.citationHTML;
      }

      if (bibliographyDiv) {
        bibliographyDiv.innerHTML = result.bibliographyHTML;
      }

      ztoolkit.log("Preview updated successfully");
    } catch (error) {
      ztoolkit.log("Error updating preview:", error);

      const dialogDoc = dialogData.dialogHelper?.window?.document;
      if (!dialogDoc) {
        return;
      }

      const citationsDiv = dialogDoc.getElementById("cne-citations-preview");
      const bibliographyDiv = dialogDoc.getElementById("cne-bibliography-preview");

      const errorMsg = `<p style="color: red;">Error generating preview: ${error}</p>`;

      if (citationsDiv) {
        citationsDiv.innerHTML = errorMsg;
      }
      if (bibliographyDiv) {
        bibliographyDiv.innerHTML = errorMsg;
      }
    }
  }

  /**
   * Generate citation preview using Zotero's internal CSL engine
   * Based on Zotero Style Editor (csledit.js) implementation
   */
  @example
  static async generateCitationPreview(
    items: Zotero.Item[],
    styleId: string,
    locale: string,
  ): Promise<{ citationHTML: string; bibliographyHTML: string }> {
    try {
      // Get style object
      const style = Zotero.Styles.get(styleId);
      if (!style) {
        throw new Error(`Style not found: ${styleId}`);
      }

      // Get CSL engine (citeproc-js)
      // This is the same engine Zotero uses for citations
      const cslEngine = style.getCiteProc(locale, "html");

      // Configure engine for CNE multi-slot rendering
      // Extract CNE-CONFIG from style metadata and apply to engine
      const cneConfig = extractCNEConfigFromStyle(style);
      if (cneConfig) {
        console.log('[CNE Preview] Found CNE-CONFIG, applying to engine:', cneConfig);
        configureCiteprocForCNE(cslEngine, cneConfig);
      } else {
        console.log('[CNE Preview] No CNE-CONFIG found, using default configuration');
        configureCiteprocForCNE(cslEngine, getDefaultCNEConfig());
      }

      // Prepare item IDs
      const itemIds = items.map((item) => item.id);

      // Update engine with items
      // This loads the items into the CSL engine
      cslEngine.updateItems(itemIds);

      // Generate citations
      // Try multiple methods to handle different citation styles
      let citationHTML = "";

      // Method 1: Try previewCitationCluster (works for most styles)
      const citation = {
        citationItems: itemIds.map((id) => ({ id })),
        properties: { noteIndex: 0 },
      };

      try {
        const citationResult = cslEngine.previewCitationCluster(
          citation,
          [],
          [],
          "html"
        );
        ztoolkit.log("Preview citation generated:", citationResult);

        // Check if we got a valid result
        if (
          citationResult &&
          citationResult !== "[NO_PRINTED_FORM]" &&
          citationResult.trim().length > 0
        ) {
          citationHTML = citationResult;
        } else {
          // Method 2: Generate individual citations for each item
          ztoolkit.log("Preview failed, trying individual citations");
          const individualCitations: string[] = [];

          for (let i = 0; i < itemIds.length; i++) {
            const singleCitation = {
              citationItems: [{ id: itemIds[i] }],
              properties: { noteIndex: i + 1 },
            };

            try {
              const result = cslEngine.previewCitationCluster(
                singleCitation,
                [],
                [],
                "html"
              );

              if (result && result !== "[NO_PRINTED_FORM]") {
                individualCitations.push(`<p>${result}</p>`);
              }
            } catch (err) {
              ztoolkit.log(`Error generating citation for item ${itemIds[i]}:`, err);
            }
          }

          if (individualCitations.length > 0) {
            citationHTML = individualCitations.join("\n");
          } else {
            citationHTML =
              '<p style="color: #666; font-style: italic;">This citation style does not support note-based citations. See the bibliography below.</p>';
          }
        }
      } catch (err) {
        ztoolkit.log("Error generating preview citation:", err);
        citationHTML =
          '<p style="color: #666; font-style: italic;">Citation preview not available for this style. See the bibliography below.</p>';
      }

      // Generate bibliography
      // This will automatically use CNE fields from Extra field
      const bibliographyHTML = Zotero.Cite.makeFormattedBibliography(
        cslEngine,
        "html",
      );
      ztoolkit.log("Bibliography generated");

      return {
        citationHTML: citationHTML || "<p>No citation generated</p>",
        bibliographyHTML: bibliographyHTML || "<p>No bibliography generated</p>",
      };
    } catch (error) {
      ztoolkit.log("Error in generateCitationPreview:", error);
      throw error;
    }
  }
}
