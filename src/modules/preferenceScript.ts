import { config } from "../../package.json";
import { getPref, setPref } from "../utils/prefs";
import {
  getPresetNames,
  addOrUpdatePreset,
  deletePreset,
  getPreset,
  type TitlePreset,
  type TitleVariant,
} from "./cne/presets";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
    };
  } else {
    addon.data.prefs.window = _window;
  }
  bindPrefEvents();
  populatePresetDropdown();
  loadPresetToForm();
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
      `#zotero-prefpane-${config.addonRef}-savePreset`,
    )
    ?.addEventListener("command", () => {
      savePresetFromForm();
    });

  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-deletePreset`,
    )
    ?.addEventListener("command", () => {
      deleteCurrentPreset();
    });

  // Load preset to form when selection changes
  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-hardcodedTitleStyle`,
    )
    ?.addEventListener("command", () => {
      loadPresetToForm();
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
 * Load the selected preset into the form fields
 */
function loadPresetToForm() {
  const nameInput = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-presetName`,
  ) as HTMLInputElement;

  const configInput = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-presetConfig`,
  ) as HTMLInputElement;

  if (!nameInput || !configInput) return;

  const currentPresetName = getPref("hardcodedTitleStyle") as string;
  const preset = getPreset(currentPresetName);

  if (preset && currentPresetName) {
    nameInput.value = currentPresetName;
    configInput.value = presetToString(preset);
  } else {
    nameInput.value = "";
    configInput.value = "";
  }
}

/**
 * Convert preset to string format
 * Format: "r*, o, e" where r=romanized, o=original, e=english, * means should appear italic
 * Note: Internal italicize flags are inverted (double-italics cancellation trick)
 */
function presetToString(preset: TitlePreset): string {
  const shortNames: Record<TitleVariant, string> = {
    romanized: "r",
    original: "o",
    english: "e",
  };

  return preset.order
    .map((variant) => {
      const short = shortNames[variant];
      // Invert: if italicize=false, user wants it italic, so show *
      // if italicize=true, user wants it normal (double-italics cancel), so no *
      const showAsterisk = !preset.italicize[variant];
      return showAsterisk ? `${short}*` : short;
    })
    .join(", ");
}

/**
 * Parse preset string format
 * Format: "r*, o, e" where r=romanized, o=original, e=english
 * * means user wants this part to appear italic (final visual effect)
 * Note: We invert the italicize flag internally for double-italics cancellation
 */
function parsePresetString(str: string): TitlePreset | null {
  try {
    const parts = str.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

    const order: TitleVariant[] = [];
    const italicize = {
      romanized: false,
      original: false,
      english: false,
    };

    // Map short names to full names (case-insensitive)
    const shortToFull: Record<string, TitleVariant> = {
      r: "romanized",
      o: "original",
      e: "english",
      // Also support full names for backward compatibility
      romanized: "romanized",
      original: "original",
      english: "english",
    };

    for (const part of parts) {
      const hasAsterisk = part.endsWith("*");
      const shortName = (hasAsterisk ? part.slice(0, -1) : part).toLowerCase();
      const variant = shortToFull[shortName];

      if (!variant) {
        return null; // Invalid variant
      }

      order.push(variant);
      // Invert: * means user wants italic → set italicize=false (no <i> tag)
      // no * means user wants normal → set italicize=true (add <i> for cancellation)
      italicize[variant] = !hasAsterisk;
    }

    return { order, italicize };
  } catch (e) {
    ztoolkit.log("[CNE] Error parsing preset string:", e);
    return null;
  }
}

/**
 * Save preset from form fields
 */
function savePresetFromForm() {
  const nameInput = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-presetName`,
  ) as HTMLInputElement;

  const configInput = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-presetConfig`,
  ) as HTMLInputElement;

  if (!nameInput || !configInput) return;

  const name = nameInput.value.trim();
  const configStr = configInput.value.trim();

  if (!name) {
    addon.data.prefs!.window.alert("Preset name cannot be empty!");
    return;
  }

  if (!configStr) {
    addon.data.prefs!.window.alert("Configuration cannot be empty!");
    return;
  }

  // Parse configuration
  const newPreset = parsePresetString(configStr);

  if (!newPreset) {
    addon.data.prefs!.window.alert(
      `Invalid configuration format!\n\n` +
      `Expected format: r*, o, e\n` +
      `Valid variants: r (romanized), o (original), e (english)\n` +
      `Use * to mark variants that should appear italic`
    );
    return;
  }

  // Check if we're renaming
  const currentPresetName = getPref("hardcodedTitleStyle") as string;
  const isRename = currentPresetName && currentPresetName !== name;

  // If renaming, delete old preset
  if (isRename) {
    deletePreset(currentPresetName);
  }

  // Save preset
  if (addOrUpdatePreset(name, newPreset)) {
    ztoolkit.log(`[CNE] Saved preset: ${name} = ${presetToString(newPreset)}`);
    populatePresetDropdown();

    // Select the preset
    setPref("hardcodedTitleStyle", name);

    // Reload form (will show the saved preset)
    loadPresetToForm();
  } else {
    addon.data.prefs!.window.alert(`Failed to save preset "${name}".`);
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
    loadPresetToForm();
  } else {
    addon.data.prefs!.window.alert(`Failed to delete preset "${currentPreset}".`);
  }
}
