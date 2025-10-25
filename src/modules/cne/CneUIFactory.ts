/**
 * CNE UI Factory
 * UI components and menu items for CNE plugin following template conventions
 */

import { getString } from "../../utils/locale";

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
      ztoolkit.log(`Calling CNE example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(
        `Error in CNE example ${target.name}.${String(propertyKey)}`,
        e,
      );
      throw e;
    }
  };
  return descriptor;
}

export class CneUIFactory {
  /**
   * Register right-click menu item for clearing CNE metadata
   */
  @example
  static registerClearMetadataMenuItem() {
    // Add separator before CNE menu items
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
      id: "zotero-itemmenu-cne-separator",
    });

    // Register the clear metadata menu item
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-cne-clear-metadata",
      label: getString("menuitem-clear-metadata"),
      commandListener: (ev) => addon.hooks.onDialogEvents("clearCNEMetadata"),
    });
  }

  /**
   * Clear all CNE metadata from selected items
   * Shows confirmation dialog before proceeding
   */
  @example
  static async clearCNEMetadata() {
    // Get selected items
    const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();

    if (!items || items.length === 0) {
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: getString("no-items-selected"),
          type: "fail",
          progress: 100,
        })
        .show();
      return;
    }

    // Show confirmation dialog
    const window = ztoolkit.getGlobal("window");
    const confirmed = Services.prompt.confirm(
      window,
      getString("clear-metadata-confirm-title"),
      getString("clear-metadata-confirm-message", {
        args: { count: items.length.toString() },
      })
    );

    if (!confirmed) {
      return;
    }

    let clearedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const extra = item.getField("extra") as string;
        if (!extra) {
          continue;
        }

        // Remove all lines starting with "cne-"
        const lines = extra.split("\n");
        const filteredLines = lines.filter(
          (line) => !line.trim().toLowerCase().startsWith("cne-")
        );

        // Only update if something was removed
        if (filteredLines.length < lines.length) {
          const newExtra = filteredLines.join("\n").trim();
          item.setField("extra", newExtra);
          await item.saveTx();
          clearedCount++;
        }
      } catch (error) {
        ztoolkit.log(`Error clearing metadata for item ${item.id}:`, error);
        errorCount++;
      }
    }

    // Show result
    if (errorCount > 0) {
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: getString("clear-metadata-partial", {
            args: {
              cleared: clearedCount.toString(),
              errors: errorCount.toString(),
            },
          }),
          type: "default",
          progress: 100,
        })
        .show();
    } else if (clearedCount > 0) {
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: getString("clear-metadata-success", {
            args: { count: clearedCount.toString() },
          }),
          type: "success",
          progress: 100,
        })
        .show();
    } else {
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: getString("clear-metadata-none"),
          type: "default",
          progress: 100,
        })
        .show();
    }
  }

  /**
   * Register right-click menu item for exporting CSL-JSON
   * This is useful for creating test fixtures from real Zotero items
   */
  @example
  static registerCSLExportMenuItem() {
    const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/cite-cjk-16.svg`;

    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-cne-export-csljson",
      label: getString("menuitem-export-csljson"),
      commandListener: (ev) => addon.hooks.onDialogEvents("cslJsonExport"),
      icon: menuIcon,
    });
  }

  /**
   * Show dialog with CSL-JSON output for selected items
   * Uses Zotero's built-in itemToCSLJSON() API
   */
  @example
  static async cslJsonExportDialog() {
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

    ztoolkit.log(`Exporting CSL-JSON for ${items.length} item(s)`);

    // Use Zotero's Translation API to export as CSL JSON
    const translation = new Zotero.Translate.Export();
    translation.setItems(items);
    // Set translator to CSL JSON (translator ID)
    translation.setTranslator("bc03b4fe-436d-4a1f-ba59-de4d2d7a63f7");

    let jsonOutput = "";

    // Export with handler - translation API uses callbacks
    const exportPromise = new Promise<string>((resolve, reject) => {
      translation.setHandler("done", (obj: any, worked: boolean) => {
        if (worked) {
          ztoolkit.log("Translation successful, got string:", obj.string);
          resolve(obj.string || "");
        } else {
          ztoolkit.log("Translation failed");
          reject(new Error("Translation failed"));
        }
      });

      translation.setHandler("error", (error: any) => {
        ztoolkit.log("Translation error:", error);
        reject(error);
      });

      translation.translate();
    });

    try {
      jsonOutput = await exportPromise;

      // Parse and post-process to extract CNE fields from note
      if (jsonOutput) {
        try {
          const parsed = JSON.parse(jsonOutput);

          // Post-process each item to extract CNE fields from note
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.note) {
                // Extract CNE fields from note and add them as top-level properties
                const lines = item.note.split("\n");
                const remainingLines: string[] = [];

                lines.forEach((line: string) => {
                  // Match pattern: cne-field-name: value
                  const match = line.match(/^(cne-[a-z-]+):\s*(.+)$/);
                  if (match) {
                    const fieldName = match[1];
                    const fieldValue = match[2];
                    // Add as top-level CSL variable
                    item[fieldName] = fieldValue;
                    ztoolkit.log(`Extracted CNE field: ${fieldName} = ${fieldValue}`);
                  } else {
                    // Keep non-CNE lines in note
                    remainingLines.push(line);
                  }
                });

                // Update note with only non-CNE content
                if (remainingLines.length > 0) {
                  item.note = remainingLines.join("\n");
                } else {
                  delete item.note;
                }
              }
            });
          }

          jsonOutput = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // If parsing fails, use as-is
          ztoolkit.log("Could not parse JSON for formatting:", e);
        }
      }
    } catch (error) {
      ztoolkit.log("Error exporting CSL-JSON:", error);
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: `Error exporting: ${error}`,
          type: "fail",
          progress: 100,
        })
        .show();
      return;
    }

    ztoolkit.log("CSL-JSON generated:", jsonOutput);

    // Create dialog with textarea and buttons
    const dialogData: { [key: string | number]: any } = {
      jsonOutput: jsonOutput,
      loadCallback: () => {
        ztoolkit.log("CSL-JSON Dialog opened");
      },
      unloadCallback: () => {
        ztoolkit.log("CSL-JSON Dialog closed");
      },
    };

    const dialogHelper = new ztoolkit.Dialog(5, 2)
      .addCell(0, 0, {
        tag: "h2",
        properties: { innerHTML: getString("dialog-csljson-title") },
        styles: {
          marginBottom: "10px",
        },
      })
      .addCell(1, 0, {
        tag: "p",
        properties: {
          innerHTML: `${items.length} item(s) exported. Copy the JSON below to use in test fixtures.`,
        },
        styles: {
          marginBottom: "10px",
          color: "#666",
          fontSize: "12px",
        },
      })
      .addCell(
        2,
        0,
        {
          tag: "textarea",
          namespace: "html",
          id: "csl-json-output",
          attributes: {
            readonly: "true",
            "data-bind": "jsonOutput",
            "data-prop": "value",
          },
          styles: {
            width: "600px",
            height: "400px",
            fontFamily: "monospace",
            fontSize: "12px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
          },
        },
        false,
      )
      .addCell(
        3,
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
                // Copy to clipboard
                new ztoolkit.Clipboard()
                  .addText(jsonOutput, "text/unicode")
                  .copy();

                new ztoolkit.ProgressWindow(addon.data.config.addonName)
                  .createLine({
                    text: "CSL-JSON copied to clipboard!",
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
                innerHTML: getString("dialog-csljson-copy-button"),
              },
            },
          ],
        },
        false,
      )
      .addCell(
        4,
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
                // Save to file
                const filename = `csl-export-${new Date().getTime()}.json`;
                const path = await new ztoolkit.FilePicker(
                  "Save CSL-JSON",
                  "save",
                  [["JSON Files(*.json)", "*.json"]],
                  filename,
                ).open();

                if (path) {
                  try {
                    await Zotero.File.putContentsAsync(path, jsonOutput);
                    new ztoolkit.ProgressWindow(addon.data.config.addonName)
                      .createLine({
                        text: `Saved to ${path}`,
                        type: "success",
                        progress: 100,
                      })
                      .show();
                  } catch (error) {
                    ztoolkit.log("Error saving file:", error);
                    new ztoolkit.ProgressWindow(addon.data.config.addonName)
                      .createLine({
                        text: `Error saving file: ${error}`,
                        type: "fail",
                        progress: 100,
                      })
                      .show();
                  }
                }
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
                innerHTML: getString("dialog-csljson-save-button"),
              },
            },
          ],
        },
        false,
      )
      .addButton("Close", "close")
      .setDialogData(dialogData)
      .open("CSL-JSON Export");

    await dialogData.unloadLock.promise;
  }
}
