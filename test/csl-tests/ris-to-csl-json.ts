#!/usr/bin/env ts-node
/**
 * Convert RIS format to CSL-JSON format
 * Treats RIS as single source of truth for test fixtures
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// RIS to CSL-JSON type mappings
const TYPE_MAP: Record<string, string> = {
  BOOK: "book",
  JOUR: "article-journal",
  CHAP: "chapter",
  NEWS: "article-newspaper",
  ELEC: "webpage",
  VIDEO: "motion_picture",
  MPCT: "motion_picture",
  DBASE: "dataset",
};

interface CSLItem {
  id: string;
  type: string;
  [key: string]: any;
}

/**
 * Parse a single RIS entry into a CSL-JSON item
 */
function parseRISEntry(lines: string[], itemIndex: number): CSLItem | null {
  if (lines.length === 0) return null;

  const item: CSLItem = {
    id: `item${itemIndex}`,
    type: "book", // default
  };

  const authors: Array<{ family: string; given?: string }> = [];
  const editors: Array<{ family: string; given?: string }> = [];
  let cneMetadata: Record<string, string> = {};
  let lastTag: string | null = null;
  let lastValue = "";

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9]{2})\s+-\s*(.*)$/);

    if (!match) {
      // Continuation line (no tag prefix)
      if (lastTag && line.trim()) {
        lastValue += "\n" + line.trim();
      }
      continue;
    }

    // Destructure tag and value first
    const [, tag, value] = match;

    // Process previous tag/value if it was N1
    if (lastTag === "N1" && lastValue && tag !== "N1") {
      const cneData = parseCNEMetadata(lastValue);
      cneMetadata = { ...cneMetadata, ...cneData };
      if (!lastValue.includes("cne-")) {
        item.note = lastValue;
      }
      lastValue = ""; // Clear after processing
    }

    switch (tag) {
      case "TY":
        item.type = TYPE_MAP[value] || value.toLowerCase();
        lastTag = tag;
        break;

      case "AU":
        authors.push(parseName(value));
        lastTag = tag;
        break;

      case "A2":
        editors.push(parseName(value));
        lastTag = tag;
        break;

      case "TI":
        item.title = value;
        lastTag = tag;
        break;

      case "T2":
        item["container-title"] = value;
        lastTag = tag;
        break;

      case "JO":
        item["container-title"] = value;
        lastTag = tag;
        break;

      case "PB":
        item.publisher = value;
        lastTag = tag;
        break;

      case "CY":
        item["publisher-place"] = value;
        lastTag = tag;
        break;

      case "PY":
        item.issued = { "date-parts": [[parseInt(value)]] };
        lastTag = tag;
        break;

      case "DA":
        item.issued = parseDateParts(value);
        lastTag = tag;
        break;

      case "Y2":
        item.accessed = parseDateParts(value);
        lastTag = tag;
        break;

      case "VL":
        item.volume = value;
        lastTag = tag;
        break;

      case "IS":
        item.issue = value;
        lastTag = tag;
        break;

      case "SP":
        item.page = value;
        lastTag = tag;
        break;

      case "EP":
        if (item.page) {
          item.page = `${item.page}-${value}`;
        }
        lastTag = tag;
        break;

      case "UR":
        item.URL = value;
        lastTag = tag;
        break;

      case "N1":
        // Start accumulating N1 value (continuation lines will be added)
        lastTag = tag;
        lastValue = value;
        break;

      case "ER":
        // End of record - will be handled at the end
        lastTag = tag;
        break;
    }
  }

  // Process final N1 value if exists
  if (lastTag === "N1" && lastValue) {
    const cneData = parseCNEMetadata(lastValue);
    cneMetadata = { ...cneMetadata, ...cneData };
    if (!lastValue.includes("cne-")) {
      item.note = lastValue;
    }
  }

  // Add authors/editors
  if (authors.length > 0) {
    item.author = authors;
  }
  if (editors.length > 0) {
    if (item.type === "chapter") {
      item["container-author"] = editors;
    } else {
      item.director = editors; // For films
    }
  }

  // Add CNE metadata
  Object.assign(item, cneMetadata);

  // Preprocessing: Embed author original names into author objects
  enrichAuthorNames(item, cneMetadata);

  return item;
}

/**
 * Enrich author/editor/director names with CNE original script
 * Embeds original script directly into name objects for CSL processing
 */
function enrichAuthorNames(
  item: CSLItem,
  cneMetadata: Record<string, string>,
): void {
  // Process author original names
  if (item.author && cneMetadata["cne-author-original"]) {
    const originalNames = cneMetadata["cne-author-original"]
      .split(";")
      .map((n) => n.trim());

    item.author = item.author.map((author, index) => {
      const originalName = originalNames[index];
      if (!originalName) return author;

      // Embed original script after family name with space separator
      return {
        ...author,
        family: `${author.family} ${originalName}`,
      };
    });

    // Remove the cne-author-original metadata since it's now embedded
    delete item["cne-author-original"];
  }

  // Process editor original names (for chapters)
  if (item["container-author"] && cneMetadata["cne-editor-original"]) {
    const originalNames = cneMetadata["cne-editor-original"]
      .split(";")
      .map((n) => n.trim());

    item["container-author"] = item["container-author"].map(
      (editor, index) => {
        const originalName = originalNames[index];
        if (!originalName) return editor;

        return {
          ...editor,
          family: `${editor.family} ${originalName}`,
        };
      },
    );

    delete item["cne-editor-original"];
  }

  // Process director original names (for films)
  if (item.director && cneMetadata["cne-director-original"]) {
    const originalNames = cneMetadata["cne-director-original"]
      .split(";")
      .map((n) => n.trim());

    item.director = item.director.map((director, index) => {
      const originalName = originalNames[index];
      if (!originalName) return director;

      return {
        ...director,
        family: `${director.family} ${originalName}`,
      };
    });

    delete item["cne-director-original"];
  }
}

/**
 * Parse a name from RIS format (Family, Given or Family)
 */
function parseName(name: string): { family: string; given?: string } {
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { family: parts[0], given: parts[1] };
  }
  return { family: name };
}

/**
 * Parse date from RIS format (YYYY/MM/DD/)
 */
function parseDateParts(dateStr: string): { "date-parts": number[][] } {
  const parts = dateStr
    .split("/")
    .filter((p) => p)
    .map((p) => parseInt(p))
    .filter((n) => !isNaN(n));
  return { "date-parts": [parts] };
}

/**
 * Parse CNE metadata from N1 field
 * Format: cne-field-variant: value
 */
function parseCNEMetadata(n1Field: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  const lines = n1Field.split("\n");

  for (const line of lines) {
    const match = line.match(/^(cne-[a-z-]+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      metadata[key] = value.trim();
    }
  }

  return metadata;
}

/**
 * Convert RIS file to CSL-JSON
 */
function convertRISToCslJson(risPath: string): CSLItem[] {
  const content = readFileSync(risPath, "utf-8");
  const lines = content.split("\n");

  const items: CSLItem[] = [];
  let currentEntry: string[] = [];
  let itemIndex = 1;

  for (const line of lines) {
    if (line.startsWith("TY  -")) {
      // Start of new entry
      if (currentEntry.length > 0) {
        const item = parseRISEntry(currentEntry, itemIndex++);
        if (item) items.push(item);
      }
      currentEntry = [line];
    } else if (line.startsWith("ER  -")) {
      // End of entry
      currentEntry.push(line);
      const item = parseRISEntry(currentEntry, itemIndex++);
      if (item) items.push(item);
      currentEntry = [];
    } else if (line.trim()) {
      currentEntry.push(line);
    }
  }

  return items;
}

// Main execution
const args = process.argv.slice(2);
if (args.length >= 1) {
  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(/\.ris$/, ".json");

  try {
    console.log(`Converting ${inputPath} to CSL-JSON...`);
    const items = convertRISToCslJson(inputPath);
    console.log(`✓ Parsed ${items.length} items`);

    writeFileSync(outputPath, JSON.stringify(items, null, 2));
    console.log(`✓ Written to ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

export { convertRISToCslJson };
