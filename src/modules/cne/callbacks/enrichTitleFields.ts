/**
 * Callback for enriching title fields with CNE metadata using HTML formatting
 *
 * ⚠️ EXPERIMENTAL / DISABLED BY DEFAULT
 *
 * LIMITATION: This callback runs at itemToCSLJSON() level, BEFORE the CSL style
 * is selected. Therefore, we cannot conditionally format based on which style
 * will be used (Chicago, APA, MLA, etc.). The nested <i> tag approach works
 * with Chicago (which auto-italicizes book titles) but may produce incorrect
 * results with other styles.
 *
 * RECOMMENDATION: Use custom CSL styles for title formatting, or wait for a
 * later interception point with style awareness.
 *
 * This callback demonstrates an alternative approach to custom CSL styles:
 * Instead of modifying the CSL stylesheet, we inject HTML-formatted titles
 * directly into CSL-JSON that combine romanized (italicized) + original + translation.
 *
 * ## Approach
 *
 * Standard Chicago style expects title in italics for books. By pre-formatting
 * the title with HTML tags, we can:
 * - Use original Chicago style without modifications
 * - Show romanized (in italics) + original script + English translation
 * - Give users control over format via options
 *
 * ## Format Options
 *
 * Users can configure how titles are formatted:
 *
 * ### Format 1: Romanized (italics) + Original
 * `<i>Tang houqi wudai Songchu</i> 唐后期五代宋初`
 *
 * ### Format 2: Romanized (italics) + Original + Translation
 * `<i>Tang houqi wudai Songchu</i> 唐后期五代宋初 [The social existence...]`
 *
 * ### Format 3: Original + Romanized (italics)
 * `唐后期五代宋初 <i>Tang houqi wudai Songchu</i>`
 *
 * ### Format 4: Original + Romanized (italics) + Translation
 * `唐后期五代宋初 <i>Tang houqi wudai Songchu</i> [The social existence...]`
 *
 * ## CSL HTML Support
 *
 * CSL processors support basic HTML formatting:
 * - `<i>text</i>` - Italics
 * - `<b>text</b>` - Bold
 * - `<sup>text</sup>` - Superscript
 * - `<sub>text</sub>` - Subscript
 *
 * The Chicago style will preserve these HTML tags in output.
 *
 * ## Configuration
 *
 * Title formatting options can be stored in Extra field:
 * ```
 * cne-title-format: romanized-original-translation
 * cne-title-order: romanized-first
 * cne-title-translation-style: brackets
 * ```
 *
 * Or as a global preference in plugin settings.
 */

import { parseCNEMetadata } from "../metadata-parser";
import type { CneFieldData, CneFieldName } from "../types";
import { getCurrentPreset } from "../presets";
import { getPref } from "../../../utils/prefs";


/**
 * Format a single title field with CNE metadata using preset configuration
 *
 * IMPORTANT: Chicago/MLA auto-italicize book titles.
 * We use nested <i> tags for double-italics cancellation trick:
 *   1 layer = italic, 2 layers = normal, 3 layers = italic, etc.
 *
 * Strategy (configured by preset):
 * - Build parts in order specified by preset.order array
 * - Apply <i> tags based on preset.italicize settings
 *
 * Example outputs:
 * - Chicago/MLA: "Romanized <i>Original [English]</i>" → *Romanized* Original [English]
 * - APA: "Romanized" → *Romanized*
 *
 * @param fieldData - CNE field data with romanized, original, english
 * @returns Formatted HTML string, or empty string if no data
 */
function formatTitleField(fieldData: CneFieldData): string {
  // Get current preset
  const preset = getCurrentPreset();
  if (!preset) {
    ztoolkit.log("[CNE] No preset found for title formatting", "warning");
    return "";
  }

  const parts: string[] = [];

  // Build parts in order specified by preset
  preset.order.forEach((variant) => {
    let text = "";

    switch (variant) {
      case "romanized":
        text = fieldData.romanized || "";
        break;
      case "original":
        text = fieldData.original || "";
        break;
      case "english":
        // Wrap English translation in brackets
        text = fieldData.english ? `[${fieldData.english}]` : "";
        break;
    }

    if (!text) return; // Skip empty variants

    // Apply italicization based on preset
    if (preset.italicize[variant]) {
      text = `<i>${text}</i>`;
    }

    parts.push(text);
  });

  return parts.join(" ");
}

/**
 * Enrich title fields in CSL-JSON with CNE metadata
 *
 * This callback modifies title-related fields in cslItem in-place,
 * replacing them with HTML-formatted strings based on the current preset.
 *
 * Only runs if hard-coded title enrichment is enabled in preferences.
 *
 * Supported fields:
 * - title (main title)
 * - container-title (journal, booktitle)
 * - collection-title (series)
 * - publisher
 *
 * @param zoteroItem - Original Zotero item (used to read Extra field)
 * @param cslItem - CSL-JSON object to modify in-place
 */
export function enrichTitleFields(zoteroItem: any, cslItem: any) {
  // Check if hard-coded title enrichment is enabled
  if (!getPref("enableHardcodedTitles")) {
    return; // Feature disabled
  }

  // Get Extra field content
  const extraContent = zoteroItem.getField("extra");
  if (!extraContent) {
    return; // No Extra field, nothing to do
  }

  // Parse CNE metadata
  const metadata = parseCNEMetadata(extraContent);

  let enrichedCount = 0;

  // Enrich title field
  if (metadata.title && (metadata.title.romanized || metadata.title.original || metadata.title.english)) {
    const formatted = formatTitleField(metadata.title);
    if (formatted) {
      cslItem.title = formatted;
      enrichedCount++;
    }
  }

  // Enrich container-title (maps to journal or booktitle)
  if (metadata.journal && (metadata.journal.romanized || metadata.journal.original || metadata.journal.english)) {
    const formatted = formatTitleField(metadata.journal);
    if (formatted) {
      cslItem["container-title"] = formatted;
      enrichedCount++;
    }
  } else if (metadata.booktitle && (metadata.booktitle.romanized || metadata.booktitle.original || metadata.booktitle.english)) {
    const formatted = formatTitleField(metadata.booktitle);
    if (formatted) {
      cslItem["container-title"] = formatted;
      enrichedCount++;
    }
  }

  // Enrich collection-title (series)
  if (metadata.series && (metadata.series.romanized || metadata.series.original || metadata.series.english)) {
    const formatted = formatTitleField(metadata.series);
    if (formatted) {
      cslItem["collection-title"] = formatted;
      enrichedCount++;
    }
  }

  // Enrich publisher
  if (metadata.publisher && (metadata.publisher.romanized || metadata.publisher.original || metadata.publisher.english)) {
    const formatted = formatTitleField(metadata.publisher);
    if (formatted) {
      cslItem.publisher = formatted;
      enrichedCount++;
    }
  }

  if (enrichedCount > 0) {
    const presetName = getPref("hardcodedTitleStyle") as string;
    ztoolkit.log(
      `[CNE] Enriched ${enrichedCount} title field(s) with preset: ${presetName}`,
    );
  }
}

/**
 * Alternative: Format with romanized short form for subsequent citations
 *
 * Chicago style uses short titles for subsequent citations. We can use
 * the romanizedShort field if available.
 *
 * @param zoteroItem - Original Zotero item
 * @param cslItem - CSL-JSON object
 */
export function enrichTitleFieldsWithShortForm(
  zoteroItem: any,
  cslItem: any,
) {
  const extraContent = zoteroItem.getField("extra");
  if (!extraContent) return;

  const metadata = parseCNEMetadata(extraContent);

  // Use short form if available
  if (metadata.title?.romanizedShort) {
    // CSL uses "title-short" for subsequent citations
    const shortFormatted = metadata.title.romanizedShort;
    cslItem["title-short"] = `<i>${shortFormatted}</i>`;

    ztoolkit.log(
      `[CNE] Set title-short to romanized short form: ${shortFormatted}`,
    );
  }
}
