/**
 * UI update functions for CNE section
 * Handles updates to various UI elements based on metadata changes
 */

import type { CneMetadata } from "../../model/CneMetadata";

/**
 * Update the live preview display with current metadata state
 *
 * @param container - Container element
 * @param metadata - CneMetadata instance
 */
export function updateLivePreview(container: HTMLElement, metadata: CneMetadata): void {
  const previewElement = container.querySelector("#cjk-data-preview");
  if (previewElement) {
    previewElement.innerHTML = JSON.stringify(metadata.toJSON(), null, 2);
  }
}

/**
 * Update the field counter display
 *
 * @param container - Container element
 * @param metadata - CneMetadata instance
 */
export function updateFieldCounter(container: HTMLElement, metadata: CneMetadata): void {
  const counterElement = container.querySelector("#cjk-field-counter");
  if (counterElement) {
    const count = metadata.getFilledFieldCount();
    const total = 5; // Total supported fields
    counterElement.innerHTML = `${count} of ${total} fields have data`;
  }
}

/**
 * Update all UI elements at once
 * Convenient function to update multiple UI elements
 *
 * @param container - Container element
 * @param metadata - CneMetadata instance
 */
export function updateAllUI(container: HTMLElement, metadata: CneMetadata): void {
  updateLivePreview(container, metadata);
  updateFieldCounter(container, metadata);
}
