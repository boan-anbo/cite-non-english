/**
 * Language selector component for CNE (Cite Non-English)
 * Provides a dropdown to select language with bidirectional sync to Zotero's language field
 */

import type { CneMetadata } from "../model/CneMetadata";
import {
  getAllLanguageCodes,
  formatLanguageOption,
  isKnownLanguage,
} from "../constants/languageCodes";
import { getPref } from "../../../utils/prefs";

/**
 * Create a warning icon element
 * Shows when language is unknown but CNE data exists
 *
 * @param visible - Whether to show the warning icon initially
 * @returns Element configuration for warning icon
 */
export function createWarningIcon(visible: boolean = false): any {
  return {
    tag: "span",
    namespace: "html",
    id: "cne-language-warning",
    styles: {
      marginLeft: "6px",
      color: "#d32f2f",
      fontSize: "14px",
      cursor: "help",
      display: visible ? "inline" : "none",
    },
    attributes: {
      title: "Unknown language code. Please select a known language from the dropdown.",
    },
    properties: {
      innerHTML: "⚠",
    },
  };
}

/**
 * Create language dropdown selector with label
 *
 * Creates a dropdown that syncs with Zotero's language field.
 * Shows warning icon when language is unknown and CNE data exists.
 *
 * @param item - Zotero item (to read/write language field)
 * @param metadata - CNE metadata instance (to check if data exists)
 * @returns Element configuration for language selector row
 */
export function createLanguageSelector(
  item: Zotero.Item,
  metadata: CneMetadata,
): any {
  // Get current language from Zotero
  let currentLanguage = "";
  try {
    currentLanguage = item.getField("language") || "";
  } catch (e) {
    ztoolkit.log("[CNE] Error reading language field:", e);
  }

  const isKnown = !currentLanguage || isKnownLanguage(currentLanguage);
  const hasData = metadata.hasData();
  const showWarning = !isKnown && hasData;

  // Build dropdown options
  const options: any[] = [];

  // Option 1: "Unspecified" (when language is empty)
  options.push({
    tag: "option",
    namespace: "html",
    attributes: {
      value: "",
      ...(currentLanguage === "" ? { selected: "selected" } : {}),
    },
    properties: {
      innerHTML: "Unspecified",
    },
  });

  // Option 2: "Unknown: [code]" (when code doesn't map to known language)
  if (currentLanguage && !isKnownLanguage(currentLanguage)) {
    options.push({
      tag: "option",
      namespace: "html",
      attributes: {
        value: currentLanguage,
        selected: "selected",
      },
      styles: {
        color: "#d32f2f",
        fontWeight: "bold",
      },
      properties: {
        innerHTML: `Unknown: ${currentLanguage}`,
      },
    });
  }

  // Option 3: All known languages
  const languageCodes = getAllLanguageCodes();
  languageCodes.forEach((code) => {
    options.push({
      tag: "option",
      namespace: "html",
      attributes: {
        value: code,
        ...(code === currentLanguage ? { selected: "selected" } : {}),
      },
      properties: {
        innerHTML: formatLanguageOption(code),
      },
    });
  });

  // Create dropdown element
  const dropdown = {
    tag: "select",
    namespace: "html",
    id: "cne-language-dropdown",
    attributes: {
      "data-bind": "language",
    },
    styles: {
      width: "100%",
      padding: "4px 8px",
      border: "1px solid #ccc",
      borderRadius: "3px",
      fontSize: "13px",
      backgroundColor: "#fff",
      cursor: "pointer",
    },
    children: options,
  };

  // Create clear button
  const clearButton = {
    tag: "button",
    namespace: "html",
    id: "cne-language-clear-btn",
    classList: ["cne-clear-button"],
    attributes: {
      type: "button",
      title: "Clear language",
      "data-clear-language": "true",
    },
    styles: {
      marginLeft: "4px",
    },
    properties: {
      innerHTML: "×",
    },
  };

  // Return complete selector row with label + warning icon + dropdown + clear button
  return {
    tag: "div",
    namespace: "html",
    styles: {
      display: "grid",
      gridTemplateColumns: "100px 1fr",
      gap: "6px",
      alignItems: "center",
      marginBottom: "8px",
    },
    children: [
      // Label with warning icon
      {
        tag: "div",
        namespace: "html",
        styles: {
          display: "flex",
          alignItems: "center",
        },
        children: [
          {
            tag: "label",
            namespace: "html",
            attributes: {
              for: "cne-language-dropdown",
            },
            styles: {
              color: "#666",
              fontSize: "13px",
              fontWeight: "600",
            },
            properties: {
              innerHTML: currentLanguage || "Language",
            },
          },
          createWarningIcon(showWarning),
        ],
      },
      // Dropdown + clear button wrapper
      {
        tag: "div",
        namespace: "html",
        classList: ["cne-input-wrapper"],
        styles: {
          display: "flex",
          alignItems: "center",
        },
        children: [dropdown, clearButton],
      },
    ],
  };
}

/**
 * Update warning icon visibility based on language state
 *
 * @param container - Container element with the warning icon
 * @param languageCode - Current language code
 * @param hasData - Whether CNE data exists
 */
export function updateWarningIcon(
  container: HTMLElement,
  languageCode: string,
  hasData: boolean,
): void {
  const warningIcon = container.querySelector("#cne-language-warning");
  if (warningIcon) {
    const isKnown = !languageCode || isKnownLanguage(languageCode);
    const showWarning = !isKnown && hasData;
    (warningIcon as HTMLElement).style.display = showWarning ? "inline" : "none";
  }
}

/**
 * Update dropdown options to reflect current language code
 * Handles adding/removing "Unknown: [code]" option dynamically
 *
 * @param dropdown - Dropdown element
 * @param languageCode - Current language code
 */
export function updateDropdownOptions(
  dropdown: HTMLSelectElement,
  languageCode: string,
): void {
  // Check if "Unknown" option exists
  const unknownOption = Array.from(dropdown.options).find((opt) =>
    opt.textContent?.startsWith("Unknown:"),
  );

  if (languageCode && !isKnownLanguage(languageCode)) {
    // Need "Unknown" option
    if (!unknownOption) {
      // Add it after "Unspecified"
      const doc = dropdown.ownerDocument;
      if (!doc) return;
      const newOption = doc.createElement("option") as HTMLOptionElement;
      newOption.value = languageCode;
      newOption.textContent = `Unknown: ${languageCode}`;
      newOption.style.color = "#d32f2f";
      newOption.style.fontWeight = "bold";
      newOption.selected = true;
      dropdown.insertBefore(newOption, dropdown.options[1]);
    } else {
      // Update existing unknown option
      (unknownOption as HTMLOptionElement).value = languageCode;
      unknownOption.textContent = `Unknown: ${languageCode}`;
      (unknownOption as HTMLOptionElement).selected = true;
    }
  } else {
    // Don't need "Unknown" option
    if (unknownOption) {
      dropdown.removeChild(unknownOption);
    }

    // Select appropriate option
    if (languageCode) {
      // Select known language
      for (let i = 0; i < dropdown.options.length; i++) {
        if ((dropdown.options[i] as HTMLOptionElement).value === languageCode) {
          dropdown.selectedIndex = i;
          break;
        }
      }
    } else {
      // Select "Unspecified"
      dropdown.selectedIndex = 0;
    }
  }
}

/**
 * Create quick action language buttons
 * Provides one-click language selection for frequently used languages
 *
 * @param item - Zotero item (to get current language)
 * @param metadata - CNE metadata instance
 * @returns Element configuration for button row
 */
export function createQuickLanguageButtons(
  item: Zotero.Item,
  metadata: CneMetadata,
): any {
  // Load language codes from preferences
  const quickLanguagesStr = getPref("quickLanguages") as string;

  // Parse comma-separated list
  const languageCodes = quickLanguagesStr
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

  // Get current language for highlighting
  let currentLanguage = "";
  try {
    currentLanguage = item.getField("language") || "";
  } catch (e) {
    ztoolkit.log("[CNE] Error reading language field:", e);
  }

  // Validate and create buttons
  const buttons: any[] = [];
  languageCodes.forEach((code) => {
    // Validate language code
    if (!isKnownLanguage(code)) {
      ztoolkit.log(`[CNE] Warning: Unknown language code in quick languages: ${code}`);
      return; // Skip invalid codes
    }

    const isActive = code === currentLanguage;

    buttons.push({
      tag: "button",
      namespace: "html",
      classList: isActive ? ["cne-quick-btn", "active"] : ["cne-quick-btn"],
      attributes: {
        "data-language-code": code,
        type: "button",
      },
      properties: {
        textContent: code,
      },
    });
  });

  // If no valid buttons, return empty container
  if (buttons.length === 0) {
    return {
      tag: "div",
      namespace: "html",
      styles: { display: "none" },
    };
  }

  // Return button row container
  return {
    tag: "div",
    namespace: "html",
    classList: ["cne-quick-language-buttons"],
    children: buttons,
  };
}
