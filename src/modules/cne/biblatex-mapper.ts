/**
 * BibLaTeX Field Mapper
 *
 * Maps CNE metadata to BibLaTeX-compatible fields for Better BibTeX export.
 *
 * This module transforms CNE structured metadata into BibLaTeX field format,
 * specifically targeting BibLaTeX-Chicago style with support for non-English
 * citations.
 *
 * Field Mapping:
 * - title.original → titleaddon (with \textzh{} wrapper)
 * - title.english → usere (translation field)
 * - journal.original → journaltitleaddon
 * - publisher.original → publisheraddon (if supported)
 * - series.original → seriestitleaddon (if supported)
 *
 * See: reference/biblatex-chicago-cjk-example.bib for expected output format
 */

import type { CneMetadataData } from "./types";

/**
 * Map CNE metadata to BibLaTeX tex.* fields
 *
 * Generates a record of BibLaTeX field names to values that can be injected
 * into the item's Extra field as `biblatex.fieldname= value` lines.
 *
 * Uses `=` delimiter (not `:`) to indicate raw LaTeX content that should not
 * be escaped by Better BibTeX.
 *
 * @param metadata - Parsed CNE metadata
 * @returns Record of BibLaTeX field names to raw LaTeX values
 *
 * @example
 * ```typescript
 * const metadata = parseCNEMetadata(extra);
 * const fields = mapCNEtoBibLaTeX(metadata);
 * // fields = {
 * //   titleaddon: '\\textzh{清代以來三峽地區水旱災害的初步研究}',
 * //   usere: 'A preliminary study of floods and droughts...'
 * // }
 * ```
 */
export function mapCNEtoBibLaTeX(
  metadata: CneMetadataData,
): Record<string, string> {
  const fields: Record<string, string> = {};

  // Title fields
  if (metadata.title?.original) {
    // Use \textzh{} wrapper for original script titles
    // This tells LaTeX to handle the text as Chinese/Japanese/Korean
    fields.titleaddon = `\\textzh{${metadata.title.original}}`;
  }

  if (metadata.title?.english) {
    // usere field is used by biblatex-chicago for translations
    fields.usere = metadata.title.english;
  }

  // Journal/Publication title
  if (metadata.journal?.original) {
    fields.journaltitleaddon = `\\textzh{${metadata.journal.original}}`;
  }

  // Book title (for book sections)
  if (metadata.booktitle?.original) {
    fields.booktitleaddon = `\\textzh{${metadata.booktitle.original}}`;
  }

  // Series title
  if (metadata.series?.original) {
    // Note: seriestitleaddon may not be standard in all BibLaTeX styles
    // May need to use 'series' field with special formatting
    fields.seriestitleaddon = `\\textzh{${metadata.series.original}}`;
  }

  // Publisher
  if (metadata.publisher?.original) {
    // Note: publisheraddon may not be standard
    // Alternative: modify 'publisher' field directly
    fields.publisheraddon = `\\textzh{${metadata.publisher.original}}`;
  }

  // Add options field for author name formatting
  // biblatex-chicago uses: options = {nametemplates=cjk}
  if (metadata.authors && metadata.authors.length > 0) {
    // Check if any author has original script name
    const hasOriginalNames = metadata.authors.some(
      (author) => author && (author.lastOriginal || author.firstOriginal),
    );

    if (hasOriginalNames) {
      // Set options for CNE name formatting
      // This tells biblatex-chicago to use Chinese name order
      fields.options = "nametemplates=cjk";

      // Also set spacing options if needed
      fields.ctitleaddon = "space";
      fields.ptitleaddon = "space";
    }
  }

  return fields;
}

/**
 * Check if CNE metadata has any data that needs BibLaTeX export
 *
 * Used to avoid unnecessary processing when there's no CNE data.
 *
 * @param metadata - Parsed CNE metadata
 * @returns true if metadata contains any exportable fields
 */
export function hasBibLaTeXData(metadata: CneMetadataData): boolean {
  // Check title fields
  if (metadata.title?.original || metadata.title?.english) {
    return true;
  }

  // Check journal fields
  if (metadata.journal?.original) {
    return true;
  }

  // Check book title
  if (metadata.booktitle?.original) {
    return true;
  }

  // Check series
  if (metadata.series?.original) {
    return true;
  }

  // Check publisher
  if (metadata.publisher?.original) {
    return true;
  }

  // Check authors
  if (metadata.authors && metadata.authors.length > 0) {
    const hasOriginalNames = metadata.authors.some(
      (author) => author && (author.lastOriginal || author.firstOriginal),
    );
    if (hasOriginalNames) {
      return true;
    }
  }

  return false;
}

/**
 * Format CNE author data for BibLaTeX export
 *
 * BibLaTeX-Chicago format:
 * author = {family=Hua, given=Linfu, cjk=\textzh{華林甫}}
 *
 * This requires special handling beyond simple tex.* fields.
 * For now, we inject the romanized names into item.creators and rely on
 * Better BibTeX's standard author formatting.
 *
 * Future: May need custom postscript or translator modification for full
 * support of cjk= parameter in author fields.
 *
 * @param metadata - CNE metadata with author data
 * @returns BibLaTeX author field value (future implementation)
 */
export function formatBibLaTeXAuthors(metadata: CneMetadataData): string | null {
  // TODO: Implement full BibLaTeX author formatting
  // For now, return null and handle authors via item.creators modification
  return null;
}
