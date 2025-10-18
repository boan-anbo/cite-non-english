/**
 * Author field binding for CNE section
 * Handles data binding for author fields with special logic
 */

import type { CneMetadata } from "../../model/CneMetadata";
import { updateLivePreview, updateFieldCounter } from "../updaters/uiUpdaters";
import { debouncedSave } from "../handlers/saveHandler";

/**
 * Set up binding for author fields
 * Handles patterns like "author-0.lastOriginal" or "author-1.optionsSpacing"
 *
 * @param element - DOM element to bind
 * @param bindKey - Binding key in format "author-N.fieldName"
 * @param prop - Property to bind to (usually "value" or "checked")
 * @param metadata - CneMetadata instance
 * @param container - Container element for UI updates
 */
export function setupAuthorFieldBinding(
  element: Element,
  bindKey: string,
  prop: string,
  metadata: CneMetadata,
  container: HTMLElement,
): void {
  // Parse: "author-0.lastOriginal" => ["author-0", "lastOriginal"]
  // Or: "author-0.optionsSpacing" => ["author-0", "optionsSpacing"]
  const keys = bindKey.split(".");
  if (keys.length !== 2) {
    ztoolkit.log(`Invalid author bind key format: ${bindKey}`);
    return;
  }

  // Extract author index from "author-0"
  const indexMatch = keys[0].match(/^author-(\d+)$/);
  if (!indexMatch) {
    ztoolkit.log(`Invalid author index format: ${keys[0]}`);
    return;
  }

  const authorIndex = parseInt(indexMatch[1], 10);

  // Initialize authors array if needed
  if (!metadata.data.authors) {
    metadata.data.authors = [];
  }
  if (!metadata.data.authors[authorIndex]) {
    metadata.data.authors[authorIndex] = {};
  }

  const author = metadata.data.authors[authorIndex];
  const fieldKey = keys[1]; // e.g., "lastOriginal", "optionsSpacing"

  // Get initial value
  let initialValue = (author as any)[fieldKey] || "";

  // Set initial value
  // Use duck typing instead of instanceof (HTMLInputElement not available in Zotero context)
  const isCheckbox = (element as any).type === "checkbox";
  if (isCheckbox) {
    // For boolean checkbox options
    (element as any).checked = !!initialValue;
  } else {
    (element as any)[prop] = initialValue;
  }

  // Define the update handler
  const updateHandler = () => {
    let newValue;

    const isCheckbox = (element as any).type === "checkbox";
    if (isCheckbox) {
      // Store boolean value directly
      newValue = (element as any).checked;
    } else {
      newValue = (element as any)[prop];
    }

    // Update the author data
    (author as any)[fieldKey] = newValue;

    // Update UI
    updateLivePreview(container, metadata);
    updateFieldCounter(container, metadata);

    // Auto-save with debouncing
    debouncedSave(metadata);
  };

  // Listen for changes - use both "input" (for text inputs) and "change" (for checkbox)
  element.addEventListener("input", updateHandler);
  element.addEventListener("change", updateHandler);
}
