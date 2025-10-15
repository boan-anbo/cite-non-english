/**
 * Parser and serializer for non-English metadata in Zotero's Extra field
 *
 * Format: cne-{field}-{variant}: {value}
 * Example:
 *   cne-title-original: 中国古代文学史研究
 *   cne-title-romanized: Zhongguo gudai wenxue shi yanjiu
 *   cne-title-romanized-short: Wenxue shi
 *   cne-title-english: History of Ancient Chinese Literature
 *
 * Author fields use indexed format:
 *   cne-author-0-last-original: 郝
 *   cne-author-0-first-original: 春文
 *   cne-author-0-last-romanized: Hao
 *   cne-author-0-first-romanized: Chunwen
 *   cne-author-0-options: {"spacing":"comma","order":"romanized-first"}
 */

import type {
  CneFieldData,
  CneMetadataData,
  FieldVariant,
  CneAuthorData,
} from "./types";
import {
  NAMESPACE,
  FIELD_VARIANTS,
  ORIGINAL_LANGUAGE_KEY,
} from "./constants";

/**
 * Regular expression to match CNE metadata lines in Extra field
 * Format: cne-fieldname-variant: value
 */
const CNE_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}-([a-z]+)-(${FIELD_VARIANTS.join("|")}): (.+)$`,
  "i",
);

/**
 * Regular expression to match original language metadata
 * Format: cne-original-language: ISO-code
 */
const LANGUAGE_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}-${ORIGINAL_LANGUAGE_KEY}: (.+)$`,
  "i",
);

/**
 * Regular expression to match indexed author fields (both romanized and original)
 * Format: cne-author-{index}-{namePart}-{variant}: value
 * Examples:
 *   cne-author-0-last-romanized: Hao
 *   cne-author-0-first-romanized: Chunwen
 *   cne-author-0-last-original: 郝
 *   cne-author-0-first-original: 春文
 */
const AUTHOR_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}-author-(\\d+)-(last|first)-(romanized|original):\\s*(.+)$`,
  "i",
);

/**
 * Regular expression to match author option fields (flattened)
 * Format: cne-author-{index}-options-{optionName}: value
 * Example: cne-author-0-options-original-spacing: true
 */
const AUTHOR_OPTIONS_REGEX = new RegExp(
  `^${NAMESPACE}-author-(\\d+)-options-original-spacing:\\s*(.+)$`,
  "i",
);

/**
 * Parse indexed author fields from Extra field lines
 *
 * Extracts author metadata in indexed format:
 * - cne-author-0-last-romanized: Hao
 * - cne-author-0-first-romanized: Chunwen
 * - cne-author-0-last-original: 郝
 * - cne-author-0-first-original: 春文
 * - cne-author-0-options-original-spacing: true
 *
 * @param lines - Array of Extra field lines
 * @returns Array of author data (may have gaps if authors are not sequential)
 */
function parseAuthorFields(lines: string[]): CneAuthorData[] {
  const authorsMap = new Map<number, CneAuthorData>();

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Try to match author field line (romanized or original)
    const fieldMatch = trimmedLine.match(AUTHOR_FIELD_REGEX);
    if (fieldMatch) {
      const index = parseInt(fieldMatch[1], 10);
      const namePart = fieldMatch[2]; // 'last' or 'first'
      const variant = fieldMatch[3]; // 'romanized' or 'original'
      const value = fieldMatch[4].trim();

      // Initialize author if needed
      if (!authorsMap.has(index)) {
        authorsMap.set(index, {});
      }

      // Build field name: lastRomanized, firstRomanized, lastOriginal, firstOriginal
      const capitalizedPart = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
      const fieldName = (namePart + capitalizedVariant) as keyof CneAuthorData;
      const author = authorsMap.get(index)!;
      (author as any)[fieldName] = value;
      continue;
    }

    // Try to match author options line (original-spacing only)
    const optionsMatch = trimmedLine.match(AUTHOR_OPTIONS_REGEX);
    if (optionsMatch) {
      const index = parseInt(optionsMatch[1], 10);
      const value = optionsMatch[2].trim();

      if (!authorsMap.has(index)) {
        authorsMap.set(index, {});
      }

      const author = authorsMap.get(index)!;
      author.optionsOriginalSpacing = value === "true";
    }
  }

  // Convert map to array, preserving indices
  const maxIndex = Math.max(...Array.from(authorsMap.keys()));
  const authors: CneAuthorData[] = [];
  for (let i = 0; i <= maxIndex; i++) {
    if (authorsMap.has(i)) {
      authors[i] = authorsMap.get(i)!;
    }
  }

  return authors.length > 0 ? authors : [];
}

/**
 * Serialize author data to Extra field lines
 *
 * Generates indexed author field lines:
 * - cne-author-0-last-original: 郝
 * - cne-author-0-first-original: 春文
 * - etc.
 *
 * @param authors - Array of author data
 * @returns Array of formatted Extra field lines
 */
function serializeAuthorFields(authors?: CneAuthorData[]): string[] {
  const lines: string[] = [];

  if (!authors || authors.length === 0) {
    return lines;
  }

  authors.forEach((author, index) => {
    if (!author) return; // Skip gaps in array

    // Serialize romanized name fields
    if (author.lastRomanized) {
      lines.push(
        `${NAMESPACE}-author-${index}-last-romanized: ${author.lastRomanized}`,
      );
    }
    if (author.firstRomanized) {
      lines.push(
        `${NAMESPACE}-author-${index}-first-romanized: ${author.firstRomanized}`,
      );
    }

    // Serialize original script name fields
    if (author.lastOriginal) {
      lines.push(
        `${NAMESPACE}-author-${index}-last-original: ${author.lastOriginal}`,
      );
    }
    if (author.firstOriginal) {
      lines.push(
        `${NAMESPACE}-author-${index}-first-original: ${author.firstOriginal}`,
      );
    }

    // Serialize original spacing option
    if (author.optionsOriginalSpacing !== undefined) {
      lines.push(
        `${NAMESPACE}-author-${index}-options-original-spacing: ${author.optionsOriginalSpacing}`,
      );
    }
  });

  return lines;
}

/**
 * Parse CNE (Cite Non-English) metadata from Zotero item's Extra field
 *
 * Extracts structured CNE metadata including:
 * - Title variants (romanized, original, english, romanizedShort)
 * - Author information with indexed format
 * - Journal, publisher, series metadata
 * - Original language code
 *
 * @param extraContent - Raw content from item.getField('extra')
 * @returns Parsed CNE metadata structure
 */
export function parseCNEMetadata(extraContent: string): CneMetadataData {
  const metadata: CneMetadataData = {};

  if (!extraContent || extraContent.trim() === "") {
    return metadata;
  }

  const lines = extraContent.split("\n");

  // Parse author fields first (they need all lines)
  const authors = parseAuthorFields(lines);
  if (authors.length > 0) {
    metadata.authors = authors;
  }

  // Parse other fields line by line
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Try to match non-English field line
    const fieldMatch = trimmedLine.match(CNE_FIELD_REGEX);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const variant = fieldMatch[2] as FieldVariant;
      const value = fieldMatch[3].trim();

      // Initialize field data if it doesn't exist
      if (!metadata[fieldName as keyof CneMetadataData]) {
        (metadata as any)[fieldName] = {};
      }

      // Set the variant value
      const fieldData = (metadata as any)[fieldName] as CneFieldData;
      fieldData[variant] = value;
      continue;
    }

    // Try to match language field
    const langMatch = trimmedLine.match(LANGUAGE_FIELD_REGEX);
    if (langMatch) {
      metadata.originalLanguage = langMatch[1].trim();
    }
  }

  return metadata;
}

/**
 * Serialize non-English metadata back to Extra field format
 * Preserves existing non-CNE content in the Extra field
 * @param extraContent - Existing Extra field content
 * @param metadata - non-English metadata to serialize
 * @returns Updated Extra field content
 */
export function serializeToExtra(
  extraContent: string,
  metadata: CneMetadataData,
): string {
  // First, preserve all non-CNE lines from existing Extra content
  const preservedLines: string[] = [];

  if (extraContent && extraContent.trim() !== "") {
    const lines = extraContent.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Keep lines that don't match our CNE format (including author fields)
      if (
        !trimmedLine.match(CNE_FIELD_REGEX) &&
        !trimmedLine.match(LANGUAGE_FIELD_REGEX) &&
        !trimmedLine.match(AUTHOR_FIELD_REGEX) &&
        !trimmedLine.match(AUTHOR_OPTIONS_REGEX)
      ) {
        preservedLines.push(line);
      }
    }
  }

  // Build CNE metadata lines
  const cneLines: string[] = [];

  // Add original language if present
  if (metadata.originalLanguage) {
    cneLines.push(
      `${NAMESPACE}-${ORIGINAL_LANGUAGE_KEY}: ${metadata.originalLanguage}`,
    );
  }

  // Add field data for each field
  const fieldNames = [
    "title",
    "booktitle",
    "publisher",
    "journal",
    "series",
  ] as const;

  for (const fieldName of fieldNames) {
    const fieldData = metadata[fieldName];
    if (!fieldData) continue;

    // Add each variant that has a value
    for (const variant of FIELD_VARIANTS) {
      const value = fieldData[variant];
      if (value && value.trim() !== "") {
        cneLines.push(`${NAMESPACE}-${fieldName}-${variant}: ${value}`);
      }
    }
  }

  // Add author fields
  const authorLines = serializeAuthorFields(metadata.authors);
  cneLines.push(...authorLines);

  // Combine preserved lines and CNE lines
  const allLines = [...preservedLines, ...cneLines];

  // Filter out empty lines and join
  return allLines.filter((line) => line.trim() !== "").join("\n");
}

/**
 * Check if Extra field contains any CNE metadata
 * @param extraContent - Extra field content to check
 * @returns true if CNE metadata is present
 */
export function hasCneMetadata(extraContent: string): boolean {
  if (!extraContent || extraContent.trim() === "") {
    return false;
  }

  const lines = extraContent.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (
      trimmedLine.match(CNE_FIELD_REGEX) ||
      trimmedLine.match(LANGUAGE_FIELD_REGEX) ||
      trimmedLine.match(AUTHOR_FIELD_REGEX) ||
      trimmedLine.match(AUTHOR_OPTIONS_REGEX)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Strip CNE metadata lines from Extra field content
 *
 * Removes all cne-* lines from the Extra field, keeping only non-CNE content.
 * Useful for export scenarios where you want to inject processed CNE data
 * without keeping the original metadata lines.
 *
 * @param extraContent - Extra field content to process
 * @returns Extra field content with CNE lines removed
 *
 * @example
 * Input:
 *   "OCLC: 123456\ncne-title-original: 清代\ncne-title-romanized: Qingdai"
 * Output:
 *   "OCLC: 123456"
 */
export function stripCneMetadata(extraContent: string): string {
  if (!extraContent || extraContent.trim() === "") {
    return "";
  }

  const lines = extraContent.split("\n");
  const nonCneLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Keep lines that don't match any CNE pattern
    if (
      !trimmedLine.match(CNE_FIELD_REGEX) &&
      !trimmedLine.match(LANGUAGE_FIELD_REGEX) &&
      !trimmedLine.match(AUTHOR_FIELD_REGEX) &&
      !trimmedLine.match(AUTHOR_OPTIONS_REGEX)
    ) {
      nonCneLines.push(line);
    }
  }

  return nonCneLines.filter((line) => line.trim() !== "").join("\n");
}
