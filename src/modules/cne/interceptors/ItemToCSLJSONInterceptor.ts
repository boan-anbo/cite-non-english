/**
 * Interceptor for Zotero's itemToCSLJSON conversion
 *
 * This module provides a callback-based interceptor mechanism that allows multiple
 * functions to modify CSL-JSON output after Zotero's core conversion but
 * before the data is used by citeproc-js or exported.
 *
 * ## Critical Architecture Notes
 *
 * Zotero has TWO separate code paths for CSL-JSON conversion that must BOTH be intercepted:
 *
 * ### Path 1: Direct Usage (Zotero.Utilities.Item.itemToCSLJSON)
 * - **Used by**: Citation preview, bibliography generation, Word/LibreOffice integration, note editor
 * - **Location**: chrome/content/zotero/xpcom/utilities/utilities_item.js
 * - **Call sites**: cite.js:660, editorInstance.js:355,635,689,1154,1489
 * - **Behavior**: Called directly by Zotero core code
 *
 * ### Path 2: Translator Sandbox (Zotero.Utilities.Translate.prototype.itemToCSLJSON)
 * - **Used by**: Export translators (CSL JSON, Better BibTeX, etc.)
 * - **Location**: chrome/content/zotero/xpcom/translate/src/utilities_translate.js:58
 * - **Call sites**: Translator sandboxes via `ZU.itemToCSLJSON()`
 * - **Behavior**: Assigned ONCE at Zotero startup from Zotero.Utilities.Item.itemToCSLJSON
 *   - Each translator gets a fresh Zotero.Utilities.Translate instance
 *   - The prototype method is shared across all translators
 *   - CRITICAL: Patching Item.itemToCSLJSON AFTER startup does NOT affect translators!
 *
 * ### Why Both Must Be Patched
 *
 * Translators use `Zotero.Utilities.Translate` which copies itemToCSLJSON to its prototype:
 * ```javascript
 * // In utilities_translate.js:58
 * Zotero.Utilities.Translate.prototype.itemToCSLJSON = Zotero.Utilities.Item.itemToCSLJSON;
 * ```
 *
 * This assignment happens at Zotero startup. When we patch Item.itemToCSLJSON later:
 * - ✅ Path 1 (direct usage) sees the patched version
 * - ❌ Path 2 (translators) still uses the OLD reference stored in prototype
 *
 * Therefore, we must patch BOTH locations to intercept all CSL-JSON conversions.
 *
 * ## Testing Coverage
 *
 * After interception, test these scenarios to verify both paths work:
 * 1. Right-click item → "Create Bibliography from Item" (Path 1)
 * 2. Right-click item → "Export Item..." → CSL JSON (Path 2)
 * 3. Word processor citation insertion (Path 1)
 * 4. Preview pane citation preview (Path 1)
 *
 * ## Implementation Details
 *
 * - Multiple callbacks can be registered
 * - Each callback receives (zoteroItem, cslItem) and can modify cslItem in-place
 * - Callbacks execute in registration order
 * - Each callback is wrapped in try-catch to prevent one from breaking others
 */

type CSLJSONCallback = (zoteroItem: any, cslItem: any) => void;
type PreConversionCallback = (zoteroItem: any) => void;

export class ItemToCSLJSONInterceptor {
  private static callbacks: CSLJSONCallback[] = [];
  private static preConversionCallbacks: PreConversionCallback[] = [];
  private static intercepted = false;
  private static originalFunction: any = null;

  /**
   * Intercept the itemToCSLJSON function (should be called once at plugin startup)
   *
   * IMPORTANT: This MUST intercept BOTH code paths to work correctly:
   * 1. Zotero.Utilities.Item.itemToCSLJSON - for direct usage
   * 2. Zotero.Utilities.Translate.prototype.itemToCSLJSON - for translator sandboxes
   *
   * See class documentation above for detailed explanation of why both are needed.
   */
  static intercept() {
    if (this.intercepted) {
      ztoolkit.log("[CNE] ItemToCSLJSON already intercepted");
      return;
    }

    // Check if the function is already wrapped (safety check for reload scenarios)
    const currentFunction = Zotero.Utilities.Item.itemToCSLJSON as any;
    if (currentFunction._cneIntercepted) {
      ztoolkit.log(
        "[CNE] WARNING: itemToCSLJSON already has CNE marker, skipping to prevent wrapper stacking",
        "warning",
      );
      this.intercepted = true; // Mark as intercepted to prevent further attempts
      return;
    }

    // Store reference to original function before any patching
    this.originalFunction = Zotero.Utilities.Item.itemToCSLJSON;

    // Create wrapper function that applies all registered callbacks
    // IMPORTANT: Use rest parameters to future-proof against API changes.
    // This captures ALL arguments and passes them through unchanged.
    const interceptorWrapper = function (this: any, zoteroItem: any, ...args: any[]) {
      // EXPERIMENTAL: Apply pre-conversion callbacks to modify Zotero item
      // This allows us to populate multi structures before CSL conversion
      ItemToCSLJSONInterceptor.applyPreConversionCallbacks(zoteroItem);

      // Call original Zotero function to get base CSL-JSON
      // Pass through all arguments - future-proof!
      const cslItem = ItemToCSLJSONInterceptor.originalFunction.call(
        this,
        zoteroItem,
        ...args,
      );

      // Apply all registered callbacks to modify cslItem in-place
      ItemToCSLJSONInterceptor.applyCallbacks(zoteroItem, cslItem);

      return cslItem;
    };

    // Mark wrapper to detect if we try to wrap it again
    (interceptorWrapper as any)._cneIntercepted = true;

    // ============================================================
    // CRITICAL: Patch BOTH code paths
    // ============================================================

    // Path 1: Direct usage by Zotero core
    // Used by: cite.js, editorInstance.js, integration.js
    Zotero.Utilities.Item.itemToCSLJSON = interceptorWrapper;
    ztoolkit.log("[CNE] Intercepted Zotero.Utilities.Item.itemToCSLJSON");

    // Path 2: Translator sandbox prototype
    // Used by: All export translators (CSL JSON, Better BibTeX, etc.)
    // MUST be patched separately because it was copied at Zotero startup
    const ZoteroUtilities = Zotero.Utilities as any;
    if (ZoteroUtilities.Translate) {
      ZoteroUtilities.Translate.prototype.itemToCSLJSON = interceptorWrapper;
      ztoolkit.log(
        "[CNE] Intercepted Zotero.Utilities.Translate.prototype.itemToCSLJSON",
      );
    } else {
      ztoolkit.log(
        "[CNE] Warning: Zotero.Utilities.Translate not found, translator path not intercepted",
        "warning",
      );
    }

    this.intercepted = true;
    ztoolkit.log("[CNE] ItemToCSLJSON interceptor installed successfully");
  }

  /**
   * Register a callback function
   *
   * Callbacks are executed in registration order and receive:
   * @param zoteroItem - Original Zotero item object
   * @param cslItem - CSL-JSON object (can be modified in-place)
   */
  static register(callback: CSLJSONCallback) {
    this.callbacks.push(callback);
    ztoolkit.log(`[CNE] Registered callback, total: ${this.callbacks.length}`);
  }

  /**
   * Register a pre-conversion callback function
   *
   * EXPERIMENTAL: These callbacks run BEFORE itemToCSLJSON conversion
   * and can modify the Zotero item (e.g., populate multi structures).
   *
   * @param callback - Function that modifies the Zotero item before conversion
   */
  static registerPreConversion(callback: PreConversionCallback) {
    this.preConversionCallbacks.push(callback);
    ztoolkit.log(`[CNE-JURIS-M] Registered pre-conversion callback, total: ${this.preConversionCallbacks.length}`);
  }

  /**
   * Execute all registered callbacks
   *
   * Each callback is wrapped in try-catch to prevent one callback from
   * breaking others
   */
  private static applyCallbacks(zoteroItem: any, cslItem: any) {
    for (let i = 0; i < this.callbacks.length; i++) {
      try {
        this.callbacks[i](zoteroItem, cslItem);
      } catch (e) {
        ztoolkit.log(`[CNE] Callback ${i} error: ${e}`, "error");
      }
    }
  }

  /**
   * Execute all registered pre-conversion callbacks
   *
   * EXPERIMENTAL: These callbacks modify the Zotero item before CSL conversion.
   * Each callback is wrapped in try-catch to prevent one callback from breaking others.
   */
  private static applyPreConversionCallbacks(zoteroItem: any) {
    for (let i = 0; i < this.preConversionCallbacks.length; i++) {
      try {
        this.preConversionCallbacks[i](zoteroItem);
      } catch (e) {
        ztoolkit.log(`[CNE-JURIS-M] Pre-conversion callback ${i} error: ${e}`, "error");
      }
    }
  }

  /**
   * Remove the interceptor (for cleanup or testing)
   * IMPORTANT: Restores BOTH code paths that were intercepted
   */
  static remove() {
    if (!this.intercepted || !this.originalFunction) {
      ztoolkit.log("[CNE] Interceptor not active, nothing to remove");
      return;
    }

    // Restore Path 1: Direct usage
    Zotero.Utilities.Item.itemToCSLJSON = this.originalFunction;
    ztoolkit.log("[CNE] Restored Zotero.Utilities.Item.itemToCSLJSON");

    // Restore Path 2: Translator sandbox prototype
    const ZoteroUtilities = Zotero.Utilities as any;
    if (ZoteroUtilities.Translate) {
      ZoteroUtilities.Translate.prototype.itemToCSLJSON = this.originalFunction;
      ztoolkit.log(
        "[CNE] Restored Zotero.Utilities.Translate.prototype.itemToCSLJSON",
      );
    }

    this.intercepted = false;
    ztoolkit.log("[CNE] ItemToCSLJSON interceptor removed successfully");
  }

  /**
   * Clear all registered callbacks (for testing)
   */
  static clearCallbacks() {
    this.callbacks = [];
    this.preConversionCallbacks = [];
    ztoolkit.log("[CNE] Cleared all callbacks and pre-conversion callbacks");
  }

  /**
   * Get current interceptor status (for debugging)
   */
  static getStatus() {
    return {
      intercepted: this.intercepted,
      callbackCount: this.callbacks.length,
      preConversionCallbackCount: this.preConversionCallbacks.length,
    };
  }
}
