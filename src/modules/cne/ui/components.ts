/**
 * Reusable UI component builders for non-English Citation Manager
 * Following Zotero 7 best practices and template patterns
 */

import type { FieldVariant } from "../types";
import { getElementId, getL10nKey } from "../constants";

/**
 * Create a text input element with data binding
 * Uses textarea for multi-line support like native Zotero fields
 * Uses Zotero's native styling: transparent background, gray on hover
 *
 * @param id - Element ID
 * @param bindKey - Data binding key (e.g., "title.original")
 * @param placeholder - Placeholder text
 * @returns Element configuration object
 */
export function createTextInput(
  id: string,
  bindKey: string,
  placeholder?: string,
): any {
  return {
    tag: "textarea",
    namespace: "html",
    id,
    attributes: {
      "data-bind": bindKey,
      "data-prop": "value",
      placeholder: placeholder || "",
      rows: "1",
    },
    styles: {
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: "transparent",
      border: "1px solid transparent",
      padding: "2px 4px",
      borderRadius: "3px",
      transition: "background-color 0.15s ease",
      fontSize: "13px",
      lineHeight: "1.4",
      resize: "vertical",
      minHeight: "24px",
      fontFamily: "inherit",
      overflow: "hidden",
    },
    listeners: [
      {
        type: "input",
        listener: (e: Event) => {
          const textarea = e.target as HTMLTextAreaElement;
          // Auto-resize textarea to fit content
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        },
      },
    ],
  };
}

/**
 * Create a label element with Zotero's muted styling
 *
 * @param text - Label text
 * @param htmlFor - ID of the input this label is for
 * @param l10nKey - Optional localization key
 * @returns Element configuration object
 */
export function createLabel(
  text: string,
  htmlFor?: string,
  l10nKey?: string,
): any {
  const config: any = {
    tag: "label",
    namespace: "html",
    properties: {
      innerHTML: text,
    },
    styles: {
      color: "#666",
      textAlign: "left",
      fontSize: "13px",
      lineHeight: "1",
      marginBottom: "2px",
    },
  };

  if (htmlFor) {
    config.attributes = { for: htmlFor };
  }

  if (l10nKey) {
    config.attributes = {
      ...config.attributes,
      "data-l10n-id": l10nKey,
    };
  }

  return config;
}

/**
 * Create a small helper text element
 *
 * @param text - Helper text
 * @returns Element configuration object
 */
export function createHelperText(text: string): any {
  return {
    tag: "span",
    namespace: "html",
    properties: {
      innerHTML: text,
    },
    styles: {
      display: "block",
      fontSize: "11px",
      color: "#666",
      marginTop: "2px",
      marginBottom: "8px",
      fontStyle: "italic",
    },
  };
}

/**
 * Create a container div
 *
 * @param children - Child elements
 * @param styles - Optional custom styles
 * @returns Element configuration object
 */
export function createContainer(children: any[], styles?: any): any {
  return {
    tag: "div",
    namespace: "html",
    children,
    styles: {
      marginBottom: "2px",
      ...styles,
    },
  };
}

/**
 * Create a field section container with a title and CSS Grid layout
 * Matches Zotero's native Info panel styling
 *
 * @param title - Section title
 * @param children - Child elements (should be alternating label/input pairs)
 * @param columns - Number of label/input pairs per row (default: 1)
 * @returns Element configuration object
 */
export function createFieldSection(
  title: string,
  children: any[],
  columns: number = 1,
): any {
  // Calculate grid template columns based on number of columns
  // Each column is a label+input pair: 100px (label) + 1fr (input)
  let gridTemplateColumns: string;
  if (columns === 1) {
    gridTemplateColumns = "100px 1fr";
  } else if (columns === 2) {
    gridTemplateColumns = "100px 1fr 100px 1fr";
  } else {
    // Fallback for other numbers
    const parts: string[] = [];
    for (let i = 0; i < columns; i++) {
      parts.push("100px");
      parts.push("1fr");
    }
    gridTemplateColumns = parts.join(" ");
  }

  return {
    tag: "div",
    namespace: "html",
    styles: {
      marginBottom: "8px",
      paddingBottom: "4px",
      borderBottom: "1px solid #e0e0e0",
    },
    children: [
      {
        tag: "h3",
        namespace: "html",
        properties: { innerHTML: title },
        styles: {
          margin: "0 0 3px 0",
          fontSize: "13px",
          fontWeight: "600",
          color: "#222",
        },
      },
      {
        tag: "div",
        namespace: "html",
        classList: ["cne-field-grid"],
        styles: {
          display: "grid",
          gridTemplateColumns,
          gap: "2px 6px",
          alignItems: "center",
        },
        children,
      },
    ],
  };
}

/**
 * Create a multi-line label for form fields
 * Shows two lines with the second line bolded (useful for variants like Original/Romanized)
 *
 * @param line1 - First line of label (e.g., "Last" or "First")
 * @param line2 - Second line of label (e.g., "(Original)" or "(Romanized)")
 * @param htmlFor - ID of the input this label is for
 * @returns Element configuration object
 */
export function createMultiLineLabel(
  line1: string,
  line2: string,
  htmlFor: string,
): any {
  return {
    tag: "label",
    namespace: "html",
    attributes: {
      for: htmlFor,
    },
    styles: {
      color: "#666",
      fontSize: "13px",
      lineHeight: "1.3",
      textAlign: "right",
      paddingRight: "8px",
    },
    properties: {
      innerHTML: `${line1}<br/><strong>${line2}</strong>`,
    },
  };
}

/**
 * Create a clear button for input fields
 * Shows "×" symbol and appears on hover
 *
 * @param inputId - ID of the input field to clear
 * @returns Element configuration object
 */
export function createClearButton(inputId: string): any {
  return {
    tag: "button",
    namespace: "html",
    classList: ["cne-clear-button"],
    attributes: {
      type: "button",
      title: "Clear",
      "data-clear-for": inputId,
    },
    properties: {
      innerHTML: "×",
    },
  };
}

/**
 * Create a button element
 *
 * @param text - Button text
 * @param onClick - Click handler
 * @param buttonStyle - Button style variant ('primary' | 'secondary')
 * @returns Element configuration object
 */
export function createButton(
  text: string,
  onClick: (e: Event) => void,
  buttonStyle: "primary" | "secondary" = "secondary",
): any {
  const isPrimary = buttonStyle === "primary";

  return {
    tag: "button",
    namespace: "html",
    attributes: {
      type: "button",
    },
    properties: {
      innerHTML: text,
    },
    listeners: [
      {
        type: "click",
        listener: onClick,
      },
    ],
    styles: {
      padding: "6px 12px",
      border: isPrimary ? "none" : "1px solid #ccc",
      borderRadius: "3px",
      backgroundColor: isPrimary ? "#4CAF50" : "#fff",
      color: isPrimary ? "#fff" : "#333",
      fontSize: "13px",
      cursor: "pointer",
      fontWeight: isPrimary ? "500" : "normal",
    },
  };
}

/**
 * Create a separator/divider
 *
 * @returns Element configuration object
 */
export function createSeparator(): any {
  return {
    tag: "hr",
    namespace: "html",
    styles: {
      border: "none",
      borderTop: "1px solid #e0e0e0",
      margin: "4px 0",
    },
  };
}

/**
 * Create a live preview panel showing current data state
 * Useful for debugging and showing what will be saved
 *
 * @param metadata - CneMetadata instance
 * @returns Element configuration object
 */
export function createLivePreview(metadata: any): any {
  return {
    tag: "details",
    namespace: "html",
    styles: {
      marginTop: "8px",
      padding: "8px",
      backgroundColor: "#f5f5f5",
      border: "1px solid #ddd",
      borderRadius: "4px",
    },
    children: [
      {
        tag: "summary",
        namespace: "html",
        properties: { innerHTML: "📋 Data Preview (In Memory)" },
        styles: {
          cursor: "pointer",
          fontWeight: "600",
          marginBottom: "8px",
        },
      },
      {
        tag: "pre",
        namespace: "html",
        id: "cjk-data-preview",
        properties: {
          innerHTML: JSON.stringify(metadata.toJSON(), null, 2),
        },
        styles: {
          fontSize: "11px",
          fontFamily: "monospace",
          margin: "0",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "3px",
          overflow: "auto",
          maxHeight: "300px",
        },
      },
    ],
  };
}

/**
 * Create a status indicator showing how many fields are filled
 *
 * @param metadata - CneMetadata instance
 * @returns Element configuration object
 */
export function createFieldCounter(metadata: any): any {
  const count = metadata.getFilledFieldCount();
  const total = 5; // Total supported fields

  return {
    tag: "div",
    namespace: "html",
    id: "cjk-field-counter",
    styles: {
      fontSize: "12px",
      color: "#666",
      marginBottom: "4px",
    },
    properties: {
      innerHTML: `${count} of ${total} fields have data`,
    },
  };
}
