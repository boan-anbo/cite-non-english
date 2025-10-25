/**
 * Container builder for CNE section
 * Handles building the main container structure with all UI components
 */

import type { CneMetadata } from "../../model/CneMetadata";
import { SUPPORTED_FIELDS } from "../../constants";
import { buildAllFieldGroups } from "../../ui/fieldBuilder";
import { buildAllAuthorFieldGroups } from "../../ui/authorFieldBuilder";
import {
  createLivePreview,
  createFieldCounter,
} from "../../ui/components";
import {
  createLanguageSelector,
  createQuickLanguageButtons
} from "../../ui/languageSelector";
import { getCneStyles } from "../styles";

/**
 * Build the main CNE container with all components
 *
 * @param doc - Document object for creating elements
 * @param item - Zotero item
 * @param metadata - CNE metadata instance
 * @returns The built container element
 */
export function buildMainContainer(
  doc: Document,
  item: Zotero.Item,
  metadata: CneMetadata
): Element | DocumentFragment {
  // Build all field groups
  const fieldGroups = buildAllFieldGroups(SUPPORTED_FIELDS);

  // Build author field groups
  const authorFieldGroups = buildAllAuthorFieldGroups(item, metadata.data.authors);

  // Create main container with unique class for easy identification
  const container = ztoolkit.UI.createElement(doc, "div", {
    namespace: "html",
    classList: ["cne-main-container"],  // Unique class for finding this container later
    styles: {
      padding: "4px 8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: "13px",
    },
    children: [
      // Style tag for hover effects and component styles
      {
        tag: "style",
        namespace: "html",
        properties: {
          innerHTML: getCneStyles(),
        },
      },
      // Field counter
      createFieldCounter(metadata),

      // Language selector
      createLanguageSelector(item, metadata),

      // Quick language buttons
      createQuickLanguageButtons(item, metadata),

      // Author field groups (dynamic)
      ...authorFieldGroups,

      // Title/Publisher/etc field groups (static)
      ...fieldGroups,

      // Live preview
      createLivePreview(metadata),
    ],
  });

  return container;
}

/**
 * Container utility class names
 */
export const CONTAINER_CLASSES = {
  main: "cne-main-container",
  fieldGrid: "cne-field-grid",
  quickButtons: "cne-quick-language-buttons",
} as const;