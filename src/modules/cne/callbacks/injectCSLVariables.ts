/**
 * Callback for injecting CNE metadata as CSL variables
 *
 * This callback addresses a critical issue with Zotero's built-in Extra field parser:
 * Zotero's parser fails to read CNE title fields when they appear AFTER author fields
 * in the Extra field. This is a field ordering dependency bug in Zotero's native parser.
 *
 * ## Problem
 *
 * Our CSL style (chicago-notes-bibliography-cne.csl) references CSL variables like:
 * - cne-title-romanized
 * - cne-title-original
 * - cne-title-english
 * - cne-journal-romanized
 * - cne-journal-original
 * - etc.
 *
 * These variables are supposed to be populated by Zotero's built-in Extra field parser.
 * However, Zotero's parser has an ordering bug where it fails to parse title fields
 * if they appear after author fields in the Extra field.
 *
 * ## Solution
 *
 * This callback works around Zotero's buggy parser by:
 * 1. Using our own robust `parseCNEMetadata()` function (which doesn't have ordering bugs)
 * 2. Directly injecting CNE metadata as CSL variables into the CSL-JSON object
 * 3. This happens AFTER Zotero's conversion but BEFORE the CSL style processes it
 *
 * The CSL style can then access these variables and format them according to Chicago style.
 *
 * ## Injected Variables
 *
 * For each field (title, journal, publisher, series, container-title), we inject:
 * - cne-{field}-romanized: Romanized version
 * - cne-{field}-romanized-short: Short romanized version
 * - cne-{field}-original: Original script version
 * - cne-{field}-english: English translation
 *
 * @module injectCSLVariables
 */

import { parseCNEMetadata } from "../metadata-parser";
import type { CneFieldData, CneFieldName } from "../types";

/**
 * Inject CNE field variants as CSL variables
 *
 * Takes a CNE field (e.g., 'title') and its metadata, and injects all variants
 * as CSL variables with the correct naming convention.
 *
 * Example:
 * ```
 * metadata.title = {
 *   romanized: "Qingdai yilai...",
 *   original: "清代以来...",
 *   english: "A preliminary study..."
 * }
 * ```
 *
 * Results in CSL variables:
 * ```
 * cslItem['cne-title-romanized'] = "Qingdai yilai..."
 * cslItem['cne-title-original'] = "清代以来..."
 * cslItem['cne-title-english'] = "A preliminary study..."
 * ```
 *
 * @param cslItem - CSL-JSON object to modify
 * @param fieldName - Name of the CNE field (title, journal, etc.)
 * @param fieldData - CNE metadata for this field
 */
function injectFieldVariants(
  cslItem: any,
  fieldName: CneFieldName,
  fieldData: CneFieldData
) {
  // Inject romanized version
  if (fieldData.romanized) {
    cslItem[`cne-${fieldName}-romanized`] = fieldData.romanized;
  }

  // Inject short romanized version
  if (fieldData.romanizedShort) {
    cslItem[`cne-${fieldName}-romanized-short`] = fieldData.romanizedShort;
  }

  // Inject original script version
  if (fieldData.original) {
    cslItem[`cne-${fieldName}-original`] = fieldData.original;
  }

  // Inject English translation
  if (fieldData.english) {
    cslItem[`cne-${fieldName}-english`] = fieldData.english;
  }
}

/**
 * Inject CNE metadata as CSL variables
 *
 * This callback runs in the itemToCSLJSON interception pipeline:
 * 1. Zotero converts item to CSL-JSON (may have ordering bugs in Extra field parsing)
 * 2. **This callback runs** → injects correct CNE variables
 * 3. CSL style processes the CSL-JSON with correct variables
 *
 * Always enabled (no preference check needed) because it fixes a Zotero bug.
 *
 * @param zoteroItem - Original Zotero item
 * @param cslItem - CSL-JSON object to enhance with CNE variables
 */
export function injectCSLVariables(zoteroItem: any, cslItem: any) {
  // Get Extra field content
  // Note: zoteroItem in callback context may not have getField() method
  // Try multiple access patterns
  let extraContent: string | undefined;

  if (typeof zoteroItem.getField === 'function') {
    extraContent = zoteroItem.getField("extra");
  } else if (zoteroItem.extra) {
    extraContent = zoteroItem.extra;
  } else if (cslItem.note) {
    // CSL-JSON sometimes puts Extra in note field
    extraContent = cslItem.note;
  }

  if (!extraContent) {
    return;
  }

  // Parse CNE metadata using our robust parser
  const metadata = parseCNEMetadata(extraContent);

  // Inject title variants
  if (metadata.title) {
    injectFieldVariants(cslItem, 'title', metadata.title);
  }

  // Inject journal variants
  if (metadata.journal) {
    injectFieldVariants(cslItem, 'journal', metadata.journal);
  }

  // Inject publisher variants
  if (metadata.publisher) {
    injectFieldVariants(cslItem, 'publisher', metadata.publisher);
  }

  // Inject series variants
  if (metadata.series) {
    injectFieldVariants(cslItem, 'series', metadata.series);
  }

  // Inject container-title variants (CSL-compliant hyphenated format)
  if (metadata["container-title"]) {
    injectFieldVariants(cslItem, 'container-title', metadata["container-title"]);
  }
}
