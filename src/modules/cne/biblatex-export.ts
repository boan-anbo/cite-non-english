/**
 * BibLaTeX Export Integration
 *
 * Automatically enriches Zotero items with CNE metadata for Better BibTeX export.
 *
 * This module intercepts the `itemToExportFormat` process and injects BibLaTeX-compatible
 * fields from CNE metadata. The injection happens transparently - the original item's
 * Extra field is not modified, only the export copy.
 *
 * How it works:
 * 1. Intercept Zotero.Utilities.Internal.itemToExportFormat()
 * 2. Parse CNE metadata from item's Extra field
 * 3. Map CNE fields to BibLaTeX tex.* format
 * 4. Inject biblatex.* fields into export item's Extra field
 * 5. Enrich item.creators with romanized names
 * 6. Return modified item (original unchanged)
 *
 * Better BibTeX will automatically:
 * - Recognize biblatex.* fields in Extra
 * - Export them as native BibLaTeX fields
 * - Handle LaTeX escaping appropriately
 *
 * See: reference/biblatex-chicago-cjk-example.bib for expected output
 */

import { parseCNEMetadata, stripCneMetadata } from "./metadata-parser";
import { mapCNEtoBibLaTeX, hasBibLaTeXData } from "./biblatex-mapper";
import type { CneMetadataData, CneAuthorData } from "./types";

/**
 * BibLaTeX Export Interceptor
 * Manages the interception lifecycle with proper cleanup
 */
class BibLaTeXExportInterceptor {
  private static intercepted = false;
  private static originalFunction: any = null;

  /**
   * Initialize BibLaTeX export integration
   *
   * Sets up interception of itemToExportFormat to automatically inject
   * CNE metadata into export items for Better BibTeX.
   */
  static intercept() {
    if (this.intercepted) {
      ztoolkit.log("[CNE] BibLaTeX export already intercepted");
      return;
    }

    // Check if function is already wrapped (safety check for reload scenarios)
    const currentFunction = Zotero.Utilities.Internal.itemToExportFormat as any;
    if (currentFunction._cneBibLaTeXIntercepted) {
      ztoolkit.log(
        "[CNE] WARNING: itemToExportFormat already has CNE marker, skipping to prevent wrapper stacking",
        "warning",
      );
      this.intercepted = true;
      return;
    }

    ztoolkit.log("[CNE] Initializing BibLaTeX export integration");

    // Save original function
    this.originalFunction = Zotero.Utilities.Internal.itemToExportFormat;

    // Create wrapper function
    const interceptorWrapper = function (
      this: any,
      zoteroItem: any,
      options?: any,
    ) {
      // Call original to get the export item
      const item = BibLaTeXExportInterceptor.originalFunction.call(
        this,
        zoteroItem,
        options,
      );

      try {
        // Parse CNE metadata from Extra field
        const extraContent = item.extra || "";
        const cneMetadata = parseCNEMetadata(extraContent);

        // Skip if no CNE data
        if (!hasBibLaTeXData(cneMetadata)) {
          return item;
        }

        ztoolkit.log("[CNE] Enriching item for BibLaTeX export", {
          itemID: item.itemID,
          hasTitle: !!cneMetadata.title,
          hasAuthors: !!cneMetadata.authors?.length,
        });

        // 1. Enrich authors with romanized names
        enrichAuthorsForBibLaTeX(item, cneMetadata);

        // 2. Map CNE fields to BibLaTeX tex.* fields
        const biblatexFields = mapCNEtoBibLaTeX(cneMetadata);

        // 3. Inject biblatex.* fields into Extra
        if (Object.keys(biblatexFields).length > 0) {
          item.extra = injectBibLaTeXFields(extraContent, biblatexFields);

          ztoolkit.log("[CNE] Injected BibLaTeX fields:", {
            fields: Object.keys(biblatexFields),
          });
        }
      } catch (error) {
        ztoolkit.log("[CNE] Error enriching item for BibLaTeX export:", error);
        // Return item unchanged on error - don't break export
      }

      return item;
    };

    // Mark wrapper to detect if we try to wrap it again
    (interceptorWrapper as any)._cneBibLaTeXIntercepted = true;

    // Replace with our enriched version
    Zotero.Utilities.Internal.itemToExportFormat = interceptorWrapper;

    this.intercepted = true;
    ztoolkit.log("[CNE] BibLaTeX export integration initialized");
  }

  /**
   * Remove the interceptor (for cleanup)
   */
  static remove() {
    if (!this.intercepted || !this.originalFunction) {
      ztoolkit.log("[CNE] BibLaTeX interceptor not active, nothing to remove");
      return;
    }

    Zotero.Utilities.Internal.itemToExportFormat = this.originalFunction;
    this.intercepted = false;
    ztoolkit.log("[CNE] BibLaTeX export interceptor removed");
  }
}

/**
 * Initialize BibLaTeX export integration
 * Public API - delegates to the interceptor class
 */
export function initializeBibLaTeXIntegration() {
  BibLaTeXExportInterceptor.intercept();
}

/**
 * Remove BibLaTeX export integration
 * Public API for cleanup
 */
export function removeBibLaTeXIntegration() {
  BibLaTeXExportInterceptor.remove();
}

/**
 * Enrich item creators with CNE romanized names
 *
 * TODO: This function is currently disabled. Author names will be handled
 * through the custom CNE fields in the item section UI, not through
 * modifying item.creators during export.
 *
 * Future implementation should:
 * - Read author metadata from CNE custom fields (not item.creators)
 * - Inject into BibLaTeX using proper format:
 *   author = {family=Hao, given=Chunwen, cjk=\textzh{郝春文}}
 * - May require Better BibTeX postscript or custom handling
 *
 * @param item - Export item to modify
 * @param metadata - CNE metadata with author data
 */
function enrichAuthorsForBibLaTeX(item: any, metadata: CneMetadataData): void {
  // Currently disabled - will be implemented using custom CNE fields
  // Do not modify item.creators directly

  if (!metadata.authors?.length) {
    return;
  }

  ztoolkit.log(
    `[CNE] Author enrichment deferred - will use custom CNE fields (${metadata.authors.length} author(s))`,
  );
}

/**
 * Inject BibLaTeX fields into Extra field content
 *
 * Strips CNE metadata lines and appends biblatex.* field lines to the remaining
 * Extra content. This prevents CNE metadata from appearing in the annotation field.
 * Uses `=` delimiter to indicate raw LaTeX (no escaping needed).
 *
 * Format: biblatex.fieldname= raw_latex_value
 *
 * Better BibTeX will automatically:
 * - Strip the biblatex. prefix
 * - Export as native BibLaTeX field
 * - Not escape the value (because of = delimiter)
 *
 * @param originalExtra - Original Extra field content
 * @param fields - BibLaTeX fields to inject
 * @returns Modified Extra field content
 *
 * @example
 * Input:
 *   originalExtra = "OCLC: 123456\ncne-title-original: 清代以來..."
 *   fields = { titleaddon: "\\textzh{清代以來...}" }
 *
 * Output:
 *   "OCLC: 123456\nbiblatex.titleaddon= \\textzh{清代以來...}"
 *   (CNE metadata line is stripped to prevent annotation pollution)
 */
function injectBibLaTeXFields(
  originalExtra: string,
  fields: Record<string, string>,
): string {
  const lines: string[] = [];

  // Strip CNE metadata lines, keep only non-CNE content (like OCLC, DOI, etc.)
  // This prevents CNE lines from appearing in BibTeX annotation field
  const cleanedExtra = stripCneMetadata(originalExtra);
  if (cleanedExtra && cleanedExtra.trim() !== "") {
    lines.push(cleanedExtra);
  }

  // Add biblatex.* fields
  for (const [fieldName, value] of Object.entries(fields)) {
    // Use = delimiter for raw LaTeX (no escaping)
    // biblatex. prefix tells Better BibTeX this is BibLaTeX-specific
    lines.push(`biblatex.${fieldName}= ${value}`);
  }

  return lines.join("\n");
}

/**
 * Check if Better BibTeX is installed
 *
 * Useful for conditional features or user warnings.
 *
 * @returns true if Better BibTeX is available
 */
export function isBetterBibTeXAvailable(): boolean {
  return typeof (Zotero as any).BetterBibTeX !== "undefined";
}

/**
 * Get Better BibTeX version
 *
 * @returns Version string or null if not installed
 */
export function getBetterBibTeXVersion(): string | null {
  if (!isBetterBibTeXAvailable()) {
    return null;
  }

  try {
    return (Zotero as any).BetterBibTeX.version || null;
  } catch {
    return null;
  }
}
