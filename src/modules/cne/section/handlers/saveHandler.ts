/**
 * Save handler for CNE metadata
 * Implements debounced auto-save to prevent excessive saves
 */

import type { CneMetadata } from "../../model/CneMetadata";

/**
 * Debounce timer for auto-save
 */
let saveDebounceTimer: number | undefined;

/**
 * Debounced save function
 * Delays saving until user stops typing for 500ms
 * This prevents excessive saves while maintaining real-time feel
 *
 * @param metadata - CneMetadata instance to save
 */
export function debouncedSave(metadata: CneMetadata): void {
  // Clear existing timer
  if (saveDebounceTimer !== undefined) {
    clearTimeout(saveDebounceTimer);
  }

  // Set new timer
  saveDebounceTimer = setTimeout(async () => {
    try {
      await metadata.save();
      ztoolkit.log("non-English metadata auto-saved successfully");
    } catch (error) {
      ztoolkit.log("Error auto-saving non-English metadata:", error);
    }
  }, 500) as unknown as number; // 500ms debounce delay
}
