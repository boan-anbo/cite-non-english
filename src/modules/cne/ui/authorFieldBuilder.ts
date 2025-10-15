/**
 * Author field builder for CNE (Cite Non-English) Manager
 * Creates dynamic author sections based on item creators
 *
 * Unlike title/publisher fields which are static, author fields are indexed
 * and need to be dynamically generated based on the number of creators.
 */

import type { CneAuthorData } from "../types";
import {
  createFieldSection,
  createTextInput,
  createMultiLineLabel,
  createClearButton,
} from "./components";

/**
 * Build a single author field group
 *
 * Creates a section for one author with:
 * - Read-only native name display
 * - Four input fields (lastOriginal, firstOriginal, lastRomanized, firstRomanized)
 * - Options controls (spacing, order)
 *
 * @param index - Author index (0-based)
 * @param creator - Native Zotero creator object
 * @param authorData - CNE author metadata (if any)
 * @returns Element configuration for the author section
 */
export function buildAuthorFieldGroup(
  index: number,
  creator: any,
  authorData?: CneAuthorData,
): any {
  // Get native name and creator type for display
  const nativeName = formatNativeNamePlain(creator);

  // Handle undefined or invalid creatorTypeID
  let creatorType = "Creator";
  try {
    if (creator.creatorTypeID !== undefined) {
      const typeName = Zotero.CreatorTypes.getName(creator.creatorTypeID);
      if (typeName) {
        creatorType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      }
    }
  } catch (e) {
    ztoolkit.log("[CNE] Error getting creator type name:", e);
  }

  // Format: "1. Author: Wang Xiaobo"
  const label = `${index + 1}. ${creatorType}: ${formatNativeNamePlain(creator)}`;

  // Build input rows: 2 rows for Romanized and Original names (Last | First)
  const authorFieldRows = [
    // Row 1: Romanized names (Last | First) side by side
    createMultiLineLabel("Last", "(Romanized)", `author-${index}-last-romanized`),
    createInputWithClearButton(
      `author-${index}-last-romanized`,
      `author-${index}.lastRomanized`,
      "e.g., Hao, Yamada",
    ),
    createMultiLineLabel("First", "(Romanized)", `author-${index}-first-romanized`),
    createInputWithClearButton(
      `author-${index}-first-romanized`,
      `author-${index}.firstRomanized`,
      "e.g., Chunwen, Tarō",
    ),

    // Row 2: Original names (Last | First) side by side
    createMultiLineLabel("Last", "(Original)", `author-${index}-last-original`),
    createInputWithClearButton(
      `author-${index}-last-original`,
      `author-${index}.lastOriginal`,
      "e.g., 郝, 山田",
    ),
    createMultiLineLabel("First", "(Original)", `author-${index}-first-original`),
    createInputWithClearButton(
      `author-${index}-first-original`,
      `author-${index}.firstOriginal`,
      "e.g., 春文, 太郎",
    ),

    // Options section
    createOptionsSection(index, authorData),
  ];

  return createFieldSection(label, authorFieldRows, 2); // 2 label+input pairs per row
}

/**
 * Build all author field groups for an item
 *
 * @param item - Zotero item
 * @param authors - CNE author metadata array (if any)
 * @returns Array of author field group elements
 */
export function buildAllAuthorFieldGroups(
  item: Zotero.Item,
  authors?: CneAuthorData[],
): any[] {
  const creators = item.getCreators();

  ztoolkit.log("[CNE] Item creators:", {
    itemID: item.id,
    itemType: item.itemType,
    totalCreators: creators.length,
    creators: creators.map((c: any) => ({
      creatorTypeID: c.creatorTypeID,
      creatorTypeName: Zotero.CreatorTypes.getName(c.creatorTypeID),
      lastName: c.lastName,
      firstName: c.firstName,
      name: c.name,
    })),
  });

  if (creators.length === 0) {
    // Return empty state message
    return [
      {
        tag: "div",
        namespace: "html",
        styles: {
          padding: "16px",
          textAlign: "center",
          color: "#666",
          fontStyle: "italic",
        },
        properties: {
          innerHTML: "No creators found for this item.",
        },
      },
    ];
  }

  // Build field group for ALL creators (author, editor, translator, etc.)
  // We don't filter by type - we just display the role in the label
  return creators.map((creator: any, index: number) => {
    const authorData = authors && authors[index];
    return buildAuthorFieldGroup(index, creator, authorData);
  });
}

/**
 * Create an input field with clear button wrapper
 *
 * @param inputId - Input element ID
 * @param bindKey - Data binding key
 * @param placeholder - Placeholder text
 * @returns Element configuration for input wrapper
 */
function createInputWithClearButton(
  inputId: string,
  bindKey: string,
  placeholder: string,
): any {
  return {
    tag: "div",
    namespace: "html",
    classList: ["cne-input-wrapper"],
    children: [
      createTextInput(inputId, bindKey, placeholder),
      createClearButton(inputId),
    ],
  };
}

/**
 * Format native creator name for display (plain text)
 *
 * @param creator - Zotero creator object
 * @returns Formatted name string
 */
function formatNativeNamePlain(creator: any): string {
  if (creator.lastName && creator.firstName) {
    return `${creator.lastName}, ${creator.firstName}`;
  }
  return creator.lastName || creator.firstName || creator.name || "Unknown";
}

/**
 * Create options section for author name formatting
 *
 * @param index - Author index
 * @param authorData - Current author data (if any)
 * @returns Element configuration for options section
 */
function createOptionsSection(index: number, authorData?: CneAuthorData): any {
  return {
    tag: "div",
    namespace: "html",
    styles: {
      gridColumn: "1 / -1", // Span all columns (works for any grid)
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      padding: "8px 0",
      borderTop: "1px solid #e0e0e0",
      marginTop: "8px",
    },
    children: [
      createCheckboxOption(
        index,
        "original-spacing",
        "Space between original names",
        authorData?.optionsOriginalSpacing,
      ),
    ],
  };
}

/**
 * Create a single checkbox option
 *
 * @param index - Author index
 * @param optionKey - Option key (e.g., "original-spacing")
 * @param label - Display label
 * @param checked - Whether checkbox is checked
 * @returns Element configuration for checkbox option
 */
function createCheckboxOption(
  index: number,
  optionKey: string,
  label: string,
  checked?: boolean,
): any {
  // Convert kebab-case to camelCase for data binding
  // 'original-spacing' -> 'optionsOriginalSpacing'
  const bindKey = "options" +
    optionKey
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

  const checkboxAttrs: any = {
    type: "checkbox",
    "data-bind": `author-${index}.${bindKey}`,
    "data-prop": "checked",
  };
  if (checked) {
    checkboxAttrs.checked = "checked";
  }

  return {
    tag: "label",
    namespace: "html",
    attributes: {
      for: `author-${index}-${optionKey}`,
    },
    styles: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      cursor: "pointer",
    },
    children: [
      {
        tag: "input",
        namespace: "html",
        id: `author-${index}-${optionKey}`,
        attributes: checkboxAttrs,
      },
      {
        tag: "span",
        namespace: "html",
        properties: { innerHTML: label },
      },
    ],
  };
}
