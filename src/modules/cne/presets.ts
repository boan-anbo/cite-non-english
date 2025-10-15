/**
 * Title preset management for hard-coded title enrichment
 *
 * Presets define how title fields are formatted when using hard-coded
 * title enrichment (as opposed to specialized CSL styles).
 */

import { getPref, setPref } from "../../utils/prefs";

/**
 * Title variant type
 */
export type TitleVariant = "romanized" | "original" | "english";

/**
 * Title preset configuration
 */
export interface TitlePreset {
  /**
   * Order of variants to include
   * Only variants in this array will be included in output
   * Example: ["romanized", "original", "english"]
   */
  order: TitleVariant[];

  /**
   * Which variants should be wrapped in <i> tags
   * Used for double-italics cancellation trick with Chicago/MLA
   */
  italicize: {
    romanized: boolean;
    original: boolean;
    english: boolean;
  };
}

/**
 * Preset collection type
 */
export interface TitlePresets {
  [presetName: string]: TitlePreset;
}

/**
 * Get current active preset
 *
 * @returns Current preset configuration, or null if not found
 */
export function getCurrentPreset(): TitlePreset | null {
  try {
    const presetName = getPref("hardcodedTitleStyle") as string;
    const presetsJson = getPref("hardcodedTitlePresets") as string;
    const presets: TitlePresets = JSON.parse(presetsJson);
    return presets[presetName] || null;
  } catch (e) {
    ztoolkit.log("[CNE] Error getting current preset:", e);
    return null;
  }
}

/**
 * Get all available presets
 *
 * @returns All presets, or default presets if parsing fails
 */
export function getAllPresets(): TitlePresets {
  try {
    const presetsJson = getPref("hardcodedTitlePresets") as string;
    return JSON.parse(presetsJson);
  } catch (e) {
    ztoolkit.log("[CNE] Error parsing presets, using defaults:", e);
    return getDefaultPresets();
  }
}

/**
 * Get a specific preset by name
 *
 * @param name - Preset name
 * @returns Preset configuration, or null if not found
 */
export function getPreset(name: string): TitlePreset | null {
  const presets = getAllPresets();
  return presets[name] || null;
}

/**
 * Add or update a preset
 *
 * @param name - Preset name
 * @param preset - Preset configuration
 * @returns true if successful, false otherwise
 */
export function addOrUpdatePreset(name: string, preset: TitlePreset): boolean {
  // Validate preset
  if (!validatePreset(preset)) {
    ztoolkit.log(`[CNE] Invalid preset configuration for: ${name}`, "warning");
    return false;
  }

  try {
    const presets = getAllPresets();
    presets[name] = preset;
    setPref("hardcodedTitlePresets", JSON.stringify(presets));
    ztoolkit.log(`[CNE] Added/updated preset: ${name}`);
    return true;
  } catch (e) {
    ztoolkit.log("[CNE] Error adding/updating preset:", e);
    return false;
  }
}

/**
 * Get list of all preset names
 *
 * @returns Array of preset names
 */
export function getPresetNames(): string[] {
  const presets = getAllPresets();
  return Object.keys(presets);
}

/**
 * Delete a preset
 *
 * @param name - Preset name
 * @returns true if deleted, false if not found
 */
export function deletePreset(name: string): boolean {
  try {
    const presets = getAllPresets();
    if (!presets[name]) {
      ztoolkit.log(`[CNE] Preset not found: ${name}`, "warning");
      return false;
    }

    delete presets[name];
    setPref("hardcodedTitlePresets", JSON.stringify(presets));
    ztoolkit.log(`[CNE] Deleted preset: ${name}`);

    // If we deleted the active preset, switch to the first available preset
    const currentActive = getPref("hardcodedTitleStyle") as string;
    if (currentActive === name) {
      const remainingPresets = Object.keys(presets);
      if (remainingPresets.length > 0) {
        setActivePreset(remainingPresets[0]);
      }
    }

    return true;
  } catch (e) {
    ztoolkit.log("[CNE] Error deleting preset:", e);
    return false;
  }
}

/**
 * Set the active preset
 *
 * @param name - Preset name
 * @returns true if successful, false if preset doesn't exist
 */
export function setActivePreset(name: string): boolean {
  const preset = getPreset(name);
  if (!preset) {
    ztoolkit.log(`[CNE] Preset not found: ${name}`, "warning");
    return false;
  }

  setPref("hardcodedTitleStyle", name);
  ztoolkit.log(`[CNE] Set active preset to: ${name}`);
  return true;
}

/**
 * Get default presets
 *
 * @returns Default preset collection
 */
export function getDefaultPresets(): TitlePresets {
  return {
    chicago: {
      order: ["romanized", "original", "english"],
      italicize: {
        romanized: false, // CSL will italicize for books
        original: true, // Double-italics → cancels to normal
        english: true, // Double-italics → cancels to normal
      },
    },
    mla: {
      order: ["romanized", "original", "english"],
      italicize: {
        romanized: false,
        original: true,
        english: true,
      },
    },
    apa: {
      order: ["romanized"], // APA doesn't include original script
      italicize: {
        romanized: false,
        original: false,
        english: false,
      },
    },
  };
}

/**
 * Reset all presets to defaults
 */
export function resetToDefaults(): void {
  const defaults = getDefaultPresets();
  setPref("hardcodedTitlePresets", JSON.stringify(defaults));
  ztoolkit.log("[CNE] Reset presets to defaults");
}

/**
 * Validate a preset configuration
 *
 * @param preset - Preset to validate
 * @returns true if valid, false otherwise
 */
export function validatePreset(preset: any): preset is TitlePreset {
  if (!preset || typeof preset !== "object") {
    return false;
  }

  // Check order array
  if (!Array.isArray(preset.order)) {
    return false;
  }

  const validVariants: TitleVariant[] = ["romanized", "original", "english"];
  for (const variant of preset.order) {
    if (!validVariants.includes(variant as TitleVariant)) {
      return false;
    }
  }

  // Check italicize object
  if (!preset.italicize || typeof preset.italicize !== "object") {
    return false;
  }

  if (
    typeof preset.italicize.romanized !== "boolean" ||
    typeof preset.italicize.original !== "boolean" ||
    typeof preset.italicize.english !== "boolean"
  ) {
    return false;
  }

  return true;
}
