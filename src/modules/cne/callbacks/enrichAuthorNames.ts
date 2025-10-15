/**
 * Callback for enriching author names with CNE metadata
 *
 * This callback intercepts CSL-JSON conversion to inject literal names for authors
 * with CNE metadata. It provides complete control over name formatting by using
 * the CSL-JSON "literal" name format instead of structured family/given names.
 *
 * ## Why Literal Names?
 *
 * CSL processors cannot handle per-author customization because:
 * - CSL lacks index accessor syntax (can't refer to author[0] vs author[1])
 * - `<name-part>` affixes apply uniformly to ALL authors
 * - No way to conditionally format individual names within a single citation
 *
 * The literal name format (`{literal: "formatted name"}`) bypasses CSL's name
 * parsing entirely, rendering the string as-is. This gives us complete control
 * over individual author name formatting.
 *
 * ## Formatting Logic
 *
 * For each author with CNE metadata, we build a formatted string based on options:
 *
 * ### Spacing Options
 * - `comma`: "Hao, Chunwen 郝春文" (Western style with comma)
 * - `space`: "Hao Chunwen 郝春文" (Space-separated)
 * - `none`: "HaoChunwen 郝春文" (No separator)
 *
 * ### Order Options
 * - `romanized-first`: "Hao, Chunwen 郝春文"
 * - `original-first`: "郝春文 Hao, Chunwen"
 *
 * ### Join Option
 * - `true`: Combine first and last into single romanized string
 * - `false`: Keep separate (default CSL behavior)
 *
 * ## Examples
 *
 * ### Chinese Author (romanized-first, comma spacing)
 * Input:
 *   cne-author-0-last-original: 郝
 *   cne-author-0-first-original: 春文
 *   cne-author-0-last-romanized: Hao
 *   cne-author-0-first-romanized: Chunwen
 *   cne-author-0-options: {"spacing":"comma","order":"romanized-first"}
 *
 * Output: `{literal: "Hao, Chunwen 郝春文"}`
 *
 * ### Japanese Author (original-first, space spacing)
 * Input:
 *   cne-author-0-last-original: 山田
 *   cne-author-0-first-original: 太郎
 *   cne-author-0-last-romanized: Yamada
 *   cne-author-0-first-romanized: Tarō
 *   cne-author-0-options: {"spacing":"space","order":"original-first"}
 *
 * Output: `{literal: "山田太郎 Yamada Tarō"}`
 *
 * ## Integration
 *
 * This callback is registered with ItemToCSLJSONInterceptor and runs after
 * Zotero's core itemToCSLJSON conversion but before CSL processing.
 */

import type { CneAuthorData } from "../types";
import { parseCNEMetadata } from "../metadata-parser";

/**
 * Format original script name
 *
 * @param author - CNE author metadata with original script names
 * @returns Formatted original name string, or empty string if no original data
 */
function formatOriginalName(author: CneAuthorData): string {
  if (!author.lastOriginal && !author.firstOriginal) {
    return "";
  }

  const last = author.lastOriginal || "";
  const first = author.firstOriginal || "";

  // Add space between original names if option is enabled (for Japanese, etc.)
  if (author.optionsOriginalSpacing && last && first) {
    return `${last} ${first}`;
  } else {
    return `${last}${first}`;
  }
}

/**
 * Format romanized name
 *
 * @param author - CNE author metadata with romanized names
 * @returns Formatted romanized name string (e.g., "Hao, Chunwen")
 */
function formatRomanizedName(author: CneAuthorData): string {
  if (!author.lastRomanized && !author.firstRomanized) {
    return "";
  }

  const last = author.lastRomanized || "";
  const first = author.firstRomanized || "";

  // Standard Western format: "Last, First"
  if (last && first) {
    return `${last}, ${first}`;
  } else if (last) {
    return last;
  } else {
    return first;
  }
}

/**
 * Build complete literal name from CNE author data
 *
 * Combines romanized and original names:
 * - "Hao, Chunwen 郝春文"
 * - "Yamada, Tarō 山田 太郎" (with spacing option)
 *
 * @param author - CNE author metadata
 * @returns Complete formatted name, or empty string if no data
 */
function buildLiteralName(author: CneAuthorData): string {
  const romanized = formatRomanizedName(author);
  const original = formatOriginalName(author);

  if (!romanized && !original) {
    return "";
  }

  // Both romanized and original available
  if (romanized && original) {
    return `${romanized} ${original}`;
  }

  // Only one available
  return romanized || original;
}

/**
 * Enrich author names in CSL-JSON with CNE metadata
 *
 * This callback modifies the cslItem.author array in-place, intercepting
 * and replacing names with CNE romanized versions, then appending original
 * script names.
 *
 * Strategy:
 * - Replace family/given with CNE romanized fields (if available)
 * - Append original script name to the given field
 * - Keep CSL's native name handling logic intact (abbreviations, sorting, etc.)
 *
 * Example:
 *   Input CSL: {family: "王", given: "小波"}
 *   CNE data: lastRomanized: "Wang", firstRomanized: "Xiaobo", lastOriginal: "王", firstOriginal: "小波"
 *   Output CSL: {family: "Wang", given: "Xiaobo 王小波"}
 *
 * @param zoteroItem - Original Zotero item (used to read Extra field)
 * @param cslItem - CSL-JSON object to modify in-place
 */
export function enrichAuthorNames(zoteroItem: any, cslItem: any) {
  // Get Extra field content
  const extraContent = zoteroItem.getField("extra");
  if (!extraContent) {
    return; // No Extra field, nothing to do
  }

  // Parse CNE metadata
  const metadata = parseCNEMetadata(extraContent);
  if (!metadata.authors || metadata.authors.length === 0) {
    return; // No author metadata, nothing to do
  }

  // Check if cslItem has authors
  if (!cslItem.author || !Array.isArray(cslItem.author)) {
    return; // No authors in CSL-JSON, nothing to do
  }

  // Track how many authors were enriched
  let enrichedCount = 0;

  // Enrich each author that has CNE metadata
  metadata.authors.forEach((cneAuthor, index) => {
    // Skip if no CNE data for this author or index out of bounds
    if (!cneAuthor || index >= cslItem.author.length) {
      return;
    }

    // Skip if no CNE data at all for this author
    if (!cneAuthor.lastRomanized && !cneAuthor.firstRomanized &&
        !cneAuthor.lastOriginal && !cneAuthor.firstOriginal) {
      return;
    }

    const cslAuthor = cslItem.author[index];

    // Handle literal names (single-field names) - convert to family/given if we have romanized data
    if (cslAuthor.literal) {
      // If we have romanized names, replace literal with structured name
      if (cneAuthor.lastRomanized || cneAuthor.firstRomanized) {
        delete cslAuthor.literal;
        cslAuthor.family = cneAuthor.lastRomanized || "";
        cslAuthor.given = cneAuthor.firstRomanized || "";
      }
    }

    // Replace family/given with CNE romanized names if available
    if (cneAuthor.lastRomanized) {
      cslAuthor.family = cneAuthor.lastRomanized;
    }
    if (cneAuthor.firstRomanized) {
      cslAuthor.given = cneAuthor.firstRomanized;
    }

    // Append original script name to the given field
    const originalName = formatOriginalName(cneAuthor);
    if (originalName) {
      if (cslAuthor.given) {
        cslAuthor.given = `${cslAuthor.given} ${originalName}`;
      } else {
        cslAuthor.given = originalName;
      }
    }

    enrichedCount++;
  });

  if (enrichedCount > 0) {
    ztoolkit.log(`[CNE] Enriched ${enrichedCount} author name(s) with romanized + original`);
  }
}
