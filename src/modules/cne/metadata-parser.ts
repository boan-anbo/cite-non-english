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
 * Creator fields use indexed format:
 *   cne-creator-0-last-original: 郝
 *   cne-creator-0-first-original: 春文
 *   cne-creator-0-last-romanized: Hao
 *   cne-creator-0-first-romanized: Chunwen
 */

import type {
  CneFieldData,
  CneMetadataData,
  FieldVariant,
  CneCreatorData,
} from "./types";
import {
  NAMESPACE,
  FIELD_VARIANTS,
  ORIGINAL_LANGUAGE_KEY,
} from "./constants";

/**
 * Regular expression to match CNE metadata lines in Extra field
 * Format: cne-fieldname-variant: value
 * Supports hyphenated field names (e.g., container-title)
 */
const CNE_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}-([a-z-]+)-(${FIELD_VARIANTS.join("|")}): (.+)$`,
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
 * Regular expression to match indexed creator fields (both romanized and original)
 * Format: cne-creator-{index}-{namePart}-{variant}: value
 * Examples:
 *   cne-creator-0-last-romanized: Hao
 *   cne-creator-0-first-romanized: Chunwen
 *   cne-creator-0-last-original: 郝
 *   cne-creator-0-first-original: 春文
 */
const CREATOR_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}-creator-(\\d+)-(last|first)-(romanized|original):\\s*(.+)$`,
  "i",
);

/**
 * Regular expression to match creator option fields (flattened)
 * Format: cne-creator-{index}-options-{optionName}: value
 * Examples:
 *   cne-creator-0-options-original-spacing: true
 *   cne-creator-0-options-force-comma: true
 */
const CREATOR_OPTIONS_REGEX = new RegExp(
  `^${NAMESPACE}-creator-(\\d+)-options-(original-spacing|force-comma):\\s*(.+)$`,
  "i",
);

/**
 * Parse indexed creator fields from Extra field lines
 *
 * Extracts creator metadata in indexed format:
 * - cne-creator-0-last-romanized: Hao
 * - cne-creator-0-first-romanized: Chunwen
 * - cne-creator-0-last-original: 郝
 * - cne-creator-0-first-original: 春文
 *
 * @param lines - Array of Extra field lines
 * @returns Array of creator data (may have gaps if creators are not sequential)
 */
function parseCreatorFields(lines: string[]): CneCreatorData[] {
  const creatorsMap = new Map<number, CneCreatorData>();

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Try to match creator field line (romanized or original)
    const fieldMatch = trimmedLine.match(CREATOR_FIELD_REGEX);
    if (fieldMatch) {
      const index = parseInt(fieldMatch[1], 10);
      const namePart = fieldMatch[2]; // 'last' or 'first'
      const variant = fieldMatch[3]; // 'romanized' or 'original'
      const value = fieldMatch[4].trim();

      // Initialize creator if needed
      if (!creatorsMap.has(index)) {
        creatorsMap.set(index, {});
      }

      // Build field name: lastRomanized, firstRomanized, lastOriginal, firstOriginal
      const capitalizedPart = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
      const fieldName = (namePart + capitalizedVariant) as keyof CneCreatorData;
      const creator = creatorsMap.get(index)!;
      (creator as any)[fieldName] = value;
      continue;
    }

    // Try to match creator options line
    const optionsMatch = trimmedLine.match(CREATOR_OPTIONS_REGEX);
    if (optionsMatch) {
      const index = parseInt(optionsMatch[1], 10);
      const optionName = optionsMatch[2]; // 'original-spacing' or 'force-comma'
      const value = optionsMatch[3].trim();

      if (!creatorsMap.has(index)) {
        creatorsMap.set(index, {});
      }

      const creator = creatorsMap.get(index)!;
      const boolValue = value === "true" || value === "1";

      if (optionName === "original-spacing") {
        creator.optionsOriginalSpacing = boolValue;
      } else if (optionName === "force-comma") {
        creator.optionsForceComma = boolValue;
      }
    }
  }

  // Convert map to array, preserving indices
  const maxIndex = Math.max(...Array.from(creatorsMap.keys()));
  const creators: CneCreatorData[] = [];
  for (let i = 0; i <= maxIndex; i++) {
    if (creatorsMap.has(i)) {
      creators[i] = creatorsMap.get(i)!;
    }
  }

  return creators.length > 0 ? creators : [];
}

/**
 * Serialize creator data to Extra field lines
 *
 * Generates indexed creator field lines:
 * - cne-creator-0-last-original: 郝
 * - cne-creator-0-first-original: 春文
 * - etc.
 *
 * @param creators - Array of creator data
 * @returns Array of formatted Extra field lines
 */
function serializeCreatorFields(creators?: CneCreatorData[]): string[] {
  const lines: string[] = [];

  if (!creators || creators.length === 0) {
    return lines;
  }

  creators.forEach((creator, index) => {
    if (!creator) return; // Skip gaps in array

    // Serialize romanized name fields
    if (creator.lastRomanized) {
      lines.push(
        `${NAMESPACE}-creator-${index}-last-romanized: ${creator.lastRomanized}`,
      );
    }
    if (creator.firstRomanized) {
      lines.push(
        `${NAMESPACE}-creator-${index}-first-romanized: ${creator.firstRomanized}`,
      );
    }

    // Serialize original script name fields
    if (creator.lastOriginal) {
      lines.push(
        `${NAMESPACE}-creator-${index}-last-original: ${creator.lastOriginal}`,
      );
    }
    if (creator.firstOriginal) {
      lines.push(
        `${NAMESPACE}-creator-${index}-first-original: ${creator.firstOriginal}`,
      );
    }

    // Serialize options
    if (creator.optionsOriginalSpacing !== undefined) {
      lines.push(
        `${NAMESPACE}-creator-${index}-options-original-spacing: ${creator.optionsOriginalSpacing}`,
      );
    }
    if (creator.optionsForceComma !== undefined) {
      lines.push(
        `${NAMESPACE}-creator-${index}-options-force-comma: ${creator.optionsForceComma}`,
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
 * - Creator information with indexed format
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

  // Parse creator fields first (they need all lines)
  const creators = parseCreatorFields(lines);
  if (creators.length > 0) {
    metadata.authors = creators;
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
      // Keep lines that don't match our CNE format (including creator fields)
      if (
        !trimmedLine.match(CNE_FIELD_REGEX) &&
        !trimmedLine.match(LANGUAGE_FIELD_REGEX) &&
        !trimmedLine.match(CREATOR_FIELD_REGEX) &&
        !trimmedLine.match(CREATOR_OPTIONS_REGEX)
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
    "container-title",
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

  // Add creator fields
  const creatorLines = serializeCreatorFields(metadata.authors);
  cneLines.push(...creatorLines);

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
      trimmedLine.match(CREATOR_FIELD_REGEX) ||
      trimmedLine.match(CREATOR_OPTIONS_REGEX)
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
      !trimmedLine.match(CREATOR_FIELD_REGEX) &&
      !trimmedLine.match(CREATOR_OPTIONS_REGEX)
    ) {
      nonCneLines.push(line);
    }
  }

  return nonCneLines.filter((line) => line.trim() !== "").join("\n");
}
