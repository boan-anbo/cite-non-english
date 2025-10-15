import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import {
  getPresetNames,
  addOrUpdatePreset,
  deletePreset,
  getPreset,
  type TitlePreset,
} from "./cne/presets";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: "title",
          label: getString("prefs-table-title"),
          fixedWidth: true,
          width: 100,
        },
        {
          dataKey: "detail",
          label: getString("prefs-table-detail"),
        },
      ],
      rows: [
        {
          title: "Orange",
          detail: "It's juicy",
        },
        {
          title: "Banana",
          detail: "It's sweet",
        },
        {
          title: "Apple",
          detail: "I mean the fruit APPLE",
        },
      ],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
  populatePresetDropdown();
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          title: "no data",
          detail: "no data",
        },
    )
    // Show a progress window when selection changes
    .setProp("onSelectionChange", (selection) => {
      new ztoolkit.ProgressWindow(config.addonName)
        .createLine({
          text: `Selected line: ${addon.data.prefs?.rows
            .filter((v, i) => selection.isSelected(i))
            .map((row) => row.title)
            .join(",")}`,
          progress: 100,
        })
        .show();
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.data.prefs!.rows =
          addon.data.prefs?.rows.filter(
            (v, i) => !tableHelper.treeInstance.selection.isSelected(i),
          ) || [];
        tableHelper.render();
        return false;
      }
      return true;
    })
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].title || "",
    )
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-enable`,
    )
    ?.addEventListener("command", (e: Event) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`,
      );
    });

  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-input`,
    )
    ?.addEventListener("change", (e: Event) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as HTMLInputElement).value}!`,
      );
    });

  // Bind preset management buttons
  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-addPreset`,
    )
    ?.addEventListener("command", () => {
      showPresetDialog();
    });

  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-editPreset`,
    )
    ?.addEventListener("command", () => {
      const currentPreset = getPref("hardcodedTitleStyle") as string;
      showPresetDialog(currentPreset);
    });

  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-deletePreset`,
    )
    ?.addEventListener("command", () => {
      deleteCurrentPreset();
    });
}

/**
 * Populate the preset dropdown from preferences
 */
function populatePresetDropdown() {
  const popup = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-hardcodedTitleStyle-popup`,
  );

  if (!popup) return;

  // Clear existing items
  while (popup.firstChild) {
    popup.removeChild(popup.firstChild);
  }

  // Get all preset names
  const presetNames = getPresetNames();
  const currentPreset = getPref("hardcodedTitleStyle") as string;

  // Add menuitem for each preset
  presetNames.forEach((name) => {
    const menuitem = addon.data.prefs!.window.document.createXULElement("menuitem");
    menuitem.setAttribute("label", name);
    menuitem.setAttribute("value", name);
    if (name === currentPreset) {
      menuitem.setAttribute("selected", "true");
    }
    popup.appendChild(menuitem);
  });

  ztoolkit.log(`[CNE] Populated preset dropdown with ${presetNames.length} presets`);
}

/**
 * Show dialog to add or edit a preset
 */
function showPresetDialog(existingPresetName?: string) {
  const isEdit = !!existingPresetName;
  const preset = isEdit ? getPreset(existingPresetName) : null;

  // Get preset name
  const name = addon.data.prefs!.window.prompt(
    isEdit ? "Edit Preset Name:" : "New Preset Name:",
    existingPresetName || ""
  );

  if (!name || name.trim() === "") {
    return; // User cancelled
  }

  // Get order (comma-separated)
  const defaultOrder = preset?.order.join(", ") || "romanized, original, english";
  const orderStr = addon.data.prefs!.window.prompt(
    "Title variant order (comma-separated):\nOptions: romanized, original, english",
    defaultOrder
  );

  if (!orderStr) return;

  // Parse order
  const order = orderStr
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0) as ("romanized" | "original" | "english")[];

  // Get italicize options
  const italicizeRomanized = addon.data.prefs!.window.confirm(
    "Italicize romanized variant?\n(Usually: No for Chicago/MLA/APA)"
  );
  const italicizeOriginal = addon.data.prefs!.window.confirm(
    "Italicize original variant?\n(Usually: Yes for Chicago/MLA, No for APA)"
  );
  const italicizeEnglish = addon.data.prefs!.window.confirm(
    "Italicize English translation?\n(Usually: Yes for Chicago/MLA, No for APA)"
  );

  // Create preset
  const newPreset: TitlePreset = {
    order,
    italicize: {
      romanized: italicizeRomanized,
      original: italicizeOriginal,
      english: italicizeEnglish,
    },
  };

  // Save preset
  if (addOrUpdatePreset(name, newPreset)) {
    addon.data.prefs!.window.alert(`Preset "${name}" ${isEdit ? "updated" : "added"} successfully!`);
    populatePresetDropdown();

    // If new preset, select it
    if (!isEdit) {
      setPref("hardcodedTitleStyle", name);
    }
  } else {
    addon.data.prefs!.window.alert(`Failed to ${isEdit ? "update" : "add"} preset "${name}".`);
  }
}

/**
 * Delete the currently selected preset
 */
function deleteCurrentPreset() {
  const currentPreset = getPref("hardcodedTitleStyle") as string;

  if (!currentPreset) {
    addon.data.prefs!.window.alert("No preset selected.");
    return;
  }

  const confirmed = addon.data.prefs!.window.confirm(
    `Delete preset "${currentPreset}"?\n\nThis cannot be undone.`
  );

  if (!confirmed) return;

  if (deletePreset(currentPreset)) {
    addon.data.prefs!.window.alert(`Preset "${currentPreset}" deleted successfully!`);
    populatePresetDropdown();
  } else {
    addon.data.prefs!.window.alert(`Failed to delete preset "${currentPreset}".`);
  }
}
