/**
 * Clear button handlers for CNE section
 * Handles clearing of input field values
 */

import type { CneMetadata } from "../../model/CneMetadata";
import type { CneFieldName, FieldVariant } from "../../types";
import { updateLivePreview, updateFieldCounter } from "../updaters/uiUpdaters";
import { debouncedSave } from "./saveHandler";

/**
 * Set up clear buttons for all input fields
 *
 * @param container - Container element
 * @param metadata - CneMetadata instance
 */
export function setupClearButtons(container: HTMLElement, metadata: CneMetadata): void {
  const clearButtons = container.querySelectorAll(".cne-clear-button");

  clearButtons.forEach((button: Element) => {
    button.addEventListener("click", () => {
      const inputId = button.getAttribute("data-clear-for");
      if (!inputId) return;

      const input = container.querySelector(`#${inputId}`) as HTMLInputElement;
      if (!input) return;

      // Get the bind key from the input
      const bindKey = input.getAttribute("data-bind");
      if (!bindKey) return;

      // Clear the input value
      input.value = "";

      // Check if this is an author field or static field
      if (bindKey.startsWith("author-")) {
        // Handle author field: "author-N.fieldName"
        const keys = bindKey.split(".");
        if (keys.length < 2) return;

        const indexMatch = keys[0].match(/^author-(\d+)$/);
        if (!indexMatch) return;

        const authorIndex = parseInt(indexMatch[1], 10);
        if (!metadata.data.authors || !metadata.data.authors[authorIndex]) return;

        const fieldKey = keys[1];
        (metadata.data.authors[authorIndex] as any)[fieldKey] = "";
      } else {
        // Handle static field: "fieldName.variant"
        const keys = bindKey.split(".");
        if (keys.length !== 2) return;

        const fieldName = keys[0] as CneFieldName;
        const variant = keys[1] as FieldVariant;

        metadata.setFieldVariant(fieldName, variant, "");
      }

      // Update UI
      updateLivePreview(container, metadata);
      updateFieldCounter(container, metadata);

      // Trigger auto-save
      debouncedSave(metadata);

      ztoolkit.log(`Cleared field: ${bindKey}`);
    });
  });
}
