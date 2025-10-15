/**
 * Static field binding for CNE section
 * Handles data binding for static fields (title, publisher, journal, etc.)
 */

import type { CneMetadata } from "../../model/CneMetadata";
import type { CneFieldName, FieldVariant } from "../../types";
import { updateLivePreview, updateFieldCounter } from "../updaters/uiUpdaters";
import { debouncedSave } from "../handlers/saveHandler";

/**
 * Set up binding for static fields (title, publisher, etc.)
 *
 * @param element - DOM element to bind
 * @param bindKey - Binding key in format "fieldName.variant"
 * @param prop - Property to bind to (usually "value")
 * @param metadata - CneMetadata instance
 * @param container - Container element for UI updates
 */
export function setupStaticFieldBinding(
  element: Element,
  bindKey: string,
  prop: string,
  metadata: CneMetadata,
  container: HTMLElement,
): void {
  // Parse the bind key (e.g., "title.original" => ["title", "original"])
  const keys = bindKey.split(".");

  if (keys.length !== 2) {
    ztoolkit.log(`Invalid bind key format: ${bindKey}`);
    return;
  }

  const fieldName = keys[0] as CneFieldName;
  const variant = keys[1] as FieldVariant;

  // Set initial value from metadata model
  const initialValue = metadata.getFieldVariant(fieldName, variant) || "";
  (element as any)[prop] = initialValue;

  // Listen for changes and update metadata using model methods
  element.addEventListener("input", () => {
    const newValue = (element as any)[prop];

    // Update model
    metadata.setFieldVariant(fieldName, variant, newValue);

    // Update UI
    updateLivePreview(container, metadata);
    updateFieldCounter(container, metadata);

    // Auto-save with debouncing
    debouncedSave(metadata);

    ztoolkit.log(`Data binding updated: ${bindKey} = ${newValue}`);
  });

  ztoolkit.log(`Data binding set up for: ${bindKey}`);
}
