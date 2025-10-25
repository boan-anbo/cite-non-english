/**
 * Language binding for CNE section
 * Handles all language selector related bindings including:
 * - Language dropdown bidirectional sync with Zotero
 * - Quick language buttons
 * - Language clear button
 * - Zotero Notifier for external changes
 */

import type { CneMetadata } from "../../model/CneMetadata";
import {
  languageCodesMatch,
  updateDropdownOptions,
  updateWarningIcon,
} from "../../ui/languageSelector";
import { checkCreatorsChanged } from "./creatorChangeDetector";
import { refreshAuthorFields } from "../renderer";

// Debounce timeout for creator changes to avoid refreshing while user is typing
let creatorsRefreshTimeout: number | null = null;

/**
 * Helper function to update quick button active states
 *
 * @param container - Container element
 * @param languageCode - Current language code
 */
function updateQuickButtonStates(container: HTMLElement, languageCode: string): void {
  const quickButtons = container.querySelectorAll(".cne-quick-btn");
  quickButtons.forEach((btn: Element) => {
    const btnCode = btn.getAttribute("data-language-code");
    if (languageCodesMatch(btnCode, languageCode)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/**
 * Set up language dropdown binding
 * Provides bidirectional sync between dropdown and Zotero's language field
 *
 * @param container - Container element with the dropdown
 * @param item - Zotero item
 * @param metadata - CNE metadata instance
 */
export function setupLanguageBinding(
  container: HTMLElement,
  item: Zotero.Item,
  metadata: CneMetadata,
): void {
  const dropdown = container.querySelector(
    "#cne-language-dropdown",
  ) as HTMLSelectElement;
  if (!dropdown) {
    ztoolkit.log("[CNE] Language dropdown not found");
    return;
  }

  // Initialize button states based on current language
  try {
    const currentLanguage = item.getField("language") || "";
    updateQuickButtonStates(container, currentLanguage);
  } catch (e) {
    ztoolkit.log("[CNE] Error initializing button states:", e);
  }

  // Dropdown → Zotero sync
  dropdown.addEventListener("change", async () => {
    const selectedValue = dropdown.value;

    try {
      // Update Zotero's language field
      await item.setField("language", selectedValue);
      await item.saveTx();

      ztoolkit.log(`[CNE] Language updated to: ${selectedValue || "(empty)"}`);

      // Update warning icon
      updateWarningIcon(container, selectedValue, metadata.hasData());

      // Update label to show current language code
      const label = container.querySelector(
        'label[for="cne-language-dropdown"]',
      );
      if (label) {
        label.textContent = selectedValue || "Language";
      }

      // Update quick button active states
      updateQuickButtonStates(container, selectedValue);
    } catch (e) {
      ztoolkit.log("[CNE] Error updating language field:", e);
    }
  });

  // Monitor Zotero item changes to update dropdown (Zotero → Dropdown sync)
  // This handles external changes to the language field
  const notifierID = Zotero.Notifier.registerObserver(
    {
      notify: async (event: string, type: string, ids: string[] | number[]) => {
        // Convert ids to numbers for comparison
        const numericIds = ids.map((id) => typeof id === "string" ? parseInt(id, 10) : id);
        if (
          type === "item" &&
          event === "modify" &&
          numericIds.includes(item.id)
        ) {
          try {
            // ========== Language Field Synchronization ==========
            const newLanguage = item.getField("language") || "";
            const currentValue = dropdown.value;

            if (newLanguage !== currentValue) {
              // Update dropdown to reflect new language
              updateDropdownOptions(dropdown, newLanguage);

              // Update warning icon
              updateWarningIcon(container, newLanguage, metadata.hasData());

              // Update label
              const label = container.querySelector(
                'label[for="cne-language-dropdown"]',
              );
              if (label) {
                label.textContent = newLanguage || "Language";
              }

              // Update quick button active states
              updateQuickButtonStates(container, newLanguage);

              ztoolkit.log(
                `[CNE] Language dropdown synced to: ${newLanguage || "(empty)"}`,
              );
            }

            // ========== Creators Change Detection (with debounce) ==========
            if (checkCreatorsChanged(container, item)) {
              // Clear any pending refresh
              if (creatorsRefreshTimeout !== null) {
                clearTimeout(creatorsRefreshTimeout);
              }

              // Debounce: wait 300ms after last change before refreshing
              // This gives users time to finish typing creator names
              creatorsRefreshTimeout = setTimeout(async () => {
                ztoolkit.log("[CNE] Creators changed (debounced), refreshing author fields");
                await refreshAuthorFields(container, item, metadata);
                creatorsRefreshTimeout = null;
              }, 300) as any;
            }
          } catch (e) {
            ztoolkit.log("[CNE] Error in item change handler:", e);
          }
        }
      },
    },
    ["item"],
  );

  // Clean up notifier when section is destroyed
  // Store notifier ID on the container for cleanup
  (container as any)._languageNotifierID = notifierID;

  // Set up quick language button handlers with toggle behavior
  const quickButtons = container.querySelectorAll(".cne-quick-btn");
  quickButtons.forEach((button: Element) => {
    button.addEventListener("click", async () => {
      const languageCode = button.getAttribute("data-language-code");
      if (!languageCode) return;

      // Only treat as active if the stored language exactly matches the button code
      const isExactSelection = dropdown.value === languageCode;

      dropdown.value = isExactSelection ? "" : languageCode;

      // Trigger dropdown change event (reuses all sync logic including button states)
      // Use document.createEvent for Zotero compatibility
      const doc = dropdown.ownerDocument;
      if (!doc) return;
      const changeEvent = doc.createEvent("HTMLEvents");
      changeEvent.initEvent("change", true, false);
      dropdown.dispatchEvent(changeEvent);

      ztoolkit.log(
        `[CNE] Quick language button ${isExactSelection ? "deselected" : "selected"}: ${languageCode}`,
      );
    });
  });

  // Set up language clear button handler
  const clearButton = container.querySelector("#cne-language-clear-btn");
  if (clearButton) {
    clearButton.addEventListener("click", async () => {
      // Clear dropdown value
      dropdown.value = "";

      // Trigger dropdown change event
      const doc = dropdown.ownerDocument;
      if (!doc) return;
      const changeEvent = doc.createEvent("HTMLEvents");
      changeEvent.initEvent("change", true, false);
      dropdown.dispatchEvent(changeEvent);

      ztoolkit.log("[CNE] Language cleared via clear button");
    });
  }
}

/**
 * Clean up language binding notifier
 * Should be called when the section is destroyed
 *
 * @param container - Container element
 */
export function cleanupLanguageBinding(container: HTMLElement): void {
  // Clear any pending creator refresh timeout
  if (creatorsRefreshTimeout !== null) {
    clearTimeout(creatorsRefreshTimeout);
    creatorsRefreshTimeout = null;
  }

  // Unregister notifier
  const notifierID = (container as any)._languageNotifierID;
  if (notifierID) {
    Zotero.Notifier.unregisterObserver(notifierID);
    delete (container as any)._languageNotifierID;
  }
}
