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

import { parseCNEMetadata } from "./metadata-parser";
import { mapCNEtoBibLaTeX, hasBibLaTeXData } from "./biblatex-mapper";
import type { CneMetadataData, CneAuthorData } from "./types";
import { createInterceptor, type Interceptor } from "./interceptors";

/**
 * BibLaTeX Export Interceptor instance
 * Uses the reusable InterceptorFactory for future-proof parameter handling
 */
let biblatexInterceptor: Interceptor | null = null;

/**
 * Initialize BibLaTeX export integration
 * Public API - creates and installs the interceptor using the factory
 */
export function initializeBibLaTeXIntegration() {
  if (biblatexInterceptor) {
    ztoolkit.log("[CNE] BibLaTeX interceptor already initialized");
    return;
  }

  // Create interceptor using the reusable factory
  // This automatically handles rest parameters for future-proofing
  biblatexInterceptor = createInterceptor({
    targetPath: 'Zotero.Utilities.Internal.itemToExportFormat',
    wrapperMarker: '_cneBibLaTeXIntercepted',
    logPrefix: '[CNE BibLaTeX]',

    // afterCall receives the export item and can modify it before returning
    afterCall: (exportItem: any, zoteroItem: any, ...args: any[]) => {
      try {
        // Parse CNE metadata from Extra field
        const extraContent = exportItem.extra || "";
        const cneMetadata = parseCNEMetadata(extraContent);

        // Skip if no CNE data
        if (!hasBibLaTeXData(cneMetadata)) {
          return exportItem;
        }

        ztoolkit.log("[CNE] Enriching item for BibLaTeX export", {
          itemID: exportItem.itemID,
          hasTitle: !!cneMetadata.title,
          hasAuthors: !!cneMetadata.authors?.length,
        });

        // 1. Enrich authors with romanized names
        enrichAuthorsForBibLaTeX(exportItem, cneMetadata);

        // 2. Map CNE fields to BibLaTeX tex.* fields
        const biblatexFields = mapCNEtoBibLaTeX(cneMetadata);

        // 3. Inject biblatex.* fields into Extra
        if (Object.keys(biblatexFields).length > 0) {
          exportItem.extra = injectBibLaTeXFields(extraContent, biblatexFields);

          ztoolkit.log("[CNE] Injected BibLaTeX fields:", {
            fields: Object.keys(biblatexFields),
          });
        }
      } catch (error) {
        ztoolkit.log("[CNE] Error enriching item for BibLaTeX export:", error);
        // Return item unchanged on error - don't break export
      }

      return exportItem;
    },
  });

  // Install the interceptor
  biblatexInterceptor.install();
  ztoolkit.log("[CNE] BibLaTeX export integration initialized");
}

/**
 * Remove BibLaTeX export integration
 * Public API for cleanup
 */
export function removeBibLaTeXIntegration() {
  if (!biblatexInterceptor) {
    ztoolkit.log("[CNE] BibLaTeX interceptor not initialized, nothing to remove");
    return;
  }

  biblatexInterceptor.remove();
  biblatexInterceptor = null;
  ztoolkit.log("[CNE] BibLaTeX export integration removed");
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
 * Appends biblatex.* field lines to the Extra content while preserving all
 * original content including CNE metadata fields.
 *
 * IMPORTANT USER PRECEDENCE:
 * - If user has already provided biblatex.{field}= in Extra, we respect it
 * - CNE-generated fields are only injected if user hasn't provided them
 * - This allows users to override CNE's automatic values when needed
 *
 * IMPORTANT: We do NOT strip CNE metadata because:
 * - CSL processing needs these fields (cne-title-romanized, cne-title-original, etc.)
 * - Stripping them would break CSL styles that depend on these variables
 * - BibTeX annotation will include them, but that's an acceptable tradeoff
 *
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
 * @param fields - CNE-generated BibLaTeX fields to inject
 * @returns Modified Extra field content with biblatex.* fields appended
 *
 * @example
 * Input (no user fields):
 *   originalExtra = "OCLC: 123456\ncne-title-original: 清代以來..."
 *   fields = { titleaddon: "\\textzh{清代以來...}" }
 * Output:
 *   "OCLC: 123456\ncne-title-original: 清代以來...\nbiblatex.titleaddon= \\textzh{清代以來...}"
 *
 * @example
 * Input (user provided titleaddon):
 *   originalExtra = "biblatex.titleaddon= My custom title\ncne-title-original: 清代以來..."
 *   fields = { titleaddon: "\\textzh{清代以來...}", usere: "English translation" }
 * Output:
 *   "biblatex.titleaddon= My custom title\ncne-title-original: 清代以來...\nbiblatex.usere= English translation"
 *   (User's titleaddon kept, CNE's usere added)
 */
function injectBibLaTeXFields(
  originalExtra: string,
  fields: Record<string, string>,
): string {
  // Parse existing biblatex.* fields provided by user
  const userBibLaTeXFields = new Set<string>();
  const extraLines = originalExtra.split('\n');

  for (const line of extraLines) {
    // Match biblatex.fieldname= or biblatex.fieldname: (both formats supported by BBT)
    const match = line.match(/^biblatex\.([a-zA-Z]+)[=:]/);
    if (match) {
      userBibLaTeXFields.add(match[1]);
    }
  }

  const lines: string[] = [];

  // Keep original Extra content (including CNE metadata and user's biblatex fields)
  // This is important because:
  // 1. CSL processing needs CNE fields (cne-title-romanized, etc.)
  // 2. Stripping them here would break CSL styles that depend on these variables
  // 3. BibTeX annotation field will include them, but that's acceptable
  // 4. User's biblatex.* fields must be preserved (they take precedence)
  if (originalExtra && originalExtra.trim() !== "") {
    lines.push(originalExtra);
  }

  // Add CNE-generated biblatex.* fields only if user hasn't provided them
  for (const [fieldName, value] of Object.entries(fields)) {
    if (userBibLaTeXFields.has(fieldName)) {
      ztoolkit.log(
        `[CNE] User provided biblatex.${fieldName}, respecting user value (skipping CNE value)`,
      );
    } else {
      // Use = delimiter for raw LaTeX (no escaping)
      // biblatex. prefix tells Better BibTeX this is BibLaTeX-specific
      lines.push(`biblatex.${fieldName}= ${value}`);
    }
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
