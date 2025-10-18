/**
 * BibLaTeX Field Mapper
 *
 * Maps CNE metadata to BibLaTeX-compatible fields for Better BibTeX export
 * using an explicit adapter configuration pattern.
 *
 * This module transforms CNE structured metadata into BibLaTeX field format,
 * specifically targeting BibLaTeX-Chicago style with support for non-English
 * citations.
 *
 * ADAPTER PATTERN:
 * The BIBLATEX_FIELD_MAPPINGS configuration makes it easy to:
 * - See all field mappings at a glance
 * - Add/remove mappings
 * - Enable/disable specific fields
 * - Customize formatters
 * - Mark fields as standard vs experimental
 *
 * See: reference/biblatex-chicago-cjk-example.bib for expected output format
 */

import type { CneMetadataData } from "./types";

/**
 * Defines a mapping from a CNE metadata field to a BibLaTeX field
 */
export interface BibLaTeXFieldMapping {
  /** Human-readable description of this mapping */
  description: string;
  /** Path to CNE metadata field (e.g., "title.original") */
  cneFieldPath: string;
  /** BibLaTeX field name (e.g., "titleaddon") */
  biblatexField: string;
  /** Function to format the CNE value for BibLaTeX output */
  formatter: (value: string) => string;
  /** Whether this field is enabled (allows easy toggling) */
  enabled: boolean;
  /** Whether this field is standard in BibLaTeX or experimental */
  standard: boolean;
}

/**
 * BibLaTeX Field Mappings Configuration
 *
 * Based on biblatex-chicago documentation and reference/biblatex-chicago-cjk-example.bib
 *
 * Standard fields are well-supported in biblatex-chicago and recommended.
 * Experimental fields may not be supported in all BibLaTeX styles.
 */
export const BIBLATEX_FIELD_MAPPINGS: BibLaTeXFieldMapping[] = [
  // ========== Title Fields ==========
  {
    description: "Original script title (Chinese/Japanese/Korean)",
    cneFieldPath: "title.original",
    biblatexField: "titleaddon",
    formatter: (value) => `\\textzh{${value}}`,
    enabled: true,
    standard: true,
  },
  {
    description: "English translation of title",
    cneFieldPath: "title.english",
    biblatexField: "usere",
    formatter: (value) => value, // No formatting needed
    enabled: true,
    standard: true,
  },

  // ========== Journal/Publication Title Fields ==========
  {
    description: "Original script journal title",
    cneFieldPath: "journal.original",
    biblatexField: "journaltitleaddon",
    formatter: (value) => `\\textzh{${value}}`,
    enabled: true,
    standard: true,
  },

  // ========== Container Title Fields ==========
  {
    description: "Original script container title (for book sections/chapters)",
    cneFieldPath: "container-title.original",
    biblatexField: "booktitleaddon",
    formatter: (value) => `\\textzh{${value}}`,
    enabled: true,
    standard: true,
  },

  // ========== Series Fields (Experimental) ==========
  {
    description: "Original script series title (experimental, may not be standard)",
    cneFieldPath: "series.original",
    biblatexField: "seriestitleaddon",
    formatter: (value) => `\\textzh{${value}}`,
    enabled: false, // Disabled by default - not standard in all styles
    standard: false,
  },

  // ========== Publisher Fields (Experimental) ==========
  {
    description: "Original script publisher name (experimental, may not be standard)",
    cneFieldPath: "publisher.original",
    biblatexField: "publisheraddon",
    formatter: (value) => `\\textzh{${value}}`,
    enabled: false, // Disabled by default - not standard in all styles
    standard: false,
  },
];

/**
 * Get value from nested object path
 * @param obj - Object to traverse
 * @param path - Dot-separated path (e.g., "title.original")
 * @returns Value at path or undefined
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Map CNE metadata to BibLaTeX tex.* fields using the configuration
 *
 * Iterates through BIBLATEX_FIELD_MAPPINGS and generates BibLaTeX fields
 * based on available CNE metadata. Only enabled mappings are processed.
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

  // Process each mapping in configuration
  for (const mapping of BIBLATEX_FIELD_MAPPINGS) {
    if (!mapping.enabled) {
      continue;
    }

    const value = getNestedValue(metadata, mapping.cneFieldPath);
    if (value) {
      fields[mapping.biblatexField] = mapping.formatter(value);
    }
  }

  // Add special options fields for author name formatting
  // These control formatting in biblatex-chicago and are not part of the main mapping
  if (metadata.authors && metadata.authors.length > 0) {
    const hasOriginalNames = metadata.authors.some(
      (author) => author && (author.lastOriginal || author.firstOriginal),
    );

    if (hasOriginalNames) {
      // Set options for CNE name formatting
      // This tells biblatex-chicago to use Chinese name order
      fields.options = "nametemplates=cjk";

      // Also set spacing options to eliminate punctuation
      // between romanized and original script
      fields.ctitleaddon = "space";
      fields.ptitleaddon = "space";
    }
  }

  return fields;
}

/**
 * Check if CNE metadata has any data that needs BibLaTeX export
 *
 * Uses the BIBLATEX_FIELD_MAPPINGS configuration to determine if any
 * enabled fields have data. This ensures consistency with mapCNEtoBibLaTeX().
 *
 * @param metadata - Parsed CNE metadata
 * @returns true if metadata contains any exportable fields (based on enabled mappings)
 */
export function hasBibLaTeXData(metadata: CneMetadataData): boolean {
  // Check if any enabled mapping has data
  for (const mapping of BIBLATEX_FIELD_MAPPINGS) {
    if (!mapping.enabled) {
      continue;
    }

    const value = getNestedValue(metadata, mapping.cneFieldPath);
    if (value) {
      return true;
    }
  }

  // Check authors (special case, not part of field mappings)
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
