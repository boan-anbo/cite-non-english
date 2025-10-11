/**
 * Parser and serializer for non-English metadata in Zotero's Extra field
 *
 * Format: cne.{field}-{variant}: {value}
 * Example:
 *   cne.title-original: 日本仏教綜合研究
 *   cne.title-english: Japanese Buddhist Comprehensive Research
 *   cne.title-romanized: Nihon Bukkyō Sōgō Kenkyū
 */

import type { CneFieldData, CneMetadataData, FieldVariant } from "../types";
import {
  NAMESPACE,
  FIELD_VARIANTS,
  ORIGINAL_LANGUAGE_KEY,
} from "../constants";

/**
 * Regular expression to match CNE metadata lines in Extra field
 * Format: cne.fieldname-variant: value
 */
const CNE_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}\\.([a-z]+)-(${FIELD_VARIANTS.join("|")}): (.+)$`,
  "i",
);

/**
 * Regular expression to match original language metadata
 * Format: cne.original-language: ISO-code
 */
const LANGUAGE_FIELD_REGEX = new RegExp(
  `^${NAMESPACE}\\.${ORIGINAL_LANGUAGE_KEY}: (.+)$`,
  "i",
);

/**
 * Parse Extra field content and extract non-English metadata
 * @param extraContent - Raw content from item.getField('extra')
 * @returns Parsed non-English metadata structure
 */
export function parseExtraField(extraContent: string): CneMetadataData {
  const metadata: CneMetadataData = {};

  if (!extraContent || extraContent.trim() === "") {
    return metadata;
  }

  const lines = extraContent.split("\n");

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
 * Preserves existing non-non-English content in the Extra field
 * @param extraContent - Existing Extra field content
 * @param metadata - non-English metadata to serialize
 * @returns Updated Extra field content
 */
export function serializeToExtra(
  extraContent: string,
  metadata: CneMetadataData,
): string {
  // First, preserve all non-non-English lines from existing Extra content
  const preservedLines: string[] = [];

  if (extraContent && extraContent.trim() !== "") {
    const lines = extraContent.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Keep lines that don't match our non-English format
      if (
        !trimmedLine.match(CNE_FIELD_REGEX) &&
        !trimmedLine.match(LANGUAGE_FIELD_REGEX)
      ) {
        preservedLines.push(line);
      }
    }
  }

  // Build non-English metadata lines
  const cjkLines: string[] = [];

  // Add original language if present
  if (metadata.originalLanguage) {
    cjkLines.push(
      `${NAMESPACE}.${ORIGINAL_LANGUAGE_KEY}: ${metadata.originalLanguage}`,
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
        cjkLines.push(`${NAMESPACE}.${fieldName}-${variant}: ${value}`);
      }
    }
  }

  // Combine preserved lines and non-English lines
  const allLines = [...preservedLines, ...cjkLines];

  // Filter out empty lines and join
  return allLines.filter((line) => line.trim() !== "").join("\n");
}

/**
 * Check if Extra field contains any non-English metadata
 * @param extraContent - Extra field content to check
 * @returns true if non-English metadata is present
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
      trimmedLine.match(LANGUAGE_FIELD_REGEX)
    ) {
      return true;
    }
  }

  return false;
}
