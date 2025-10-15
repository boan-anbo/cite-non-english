/**
 * Section renderer for non-English Citation Manager
 * Handles rendering the item pane section with real-time data binding
 */

import { CneMetadata } from "../model/CneMetadata";
import { SUPPORTED_FIELDS } from "../constants";
import { buildAllFieldGroups } from "../ui/fieldBuilder";
import { buildAllAuthorFieldGroups } from "../ui/authorFieldBuilder";
import {
  createSeparator,
  createLivePreview,
  createFieldCounter,
} from "../ui/components";
import { createLanguageSelector, createQuickLanguageButtons } from "../ui/languageSelector";
import { getCneStyles } from "./styles";
import { setupDataBinding, setupLanguageBinding } from "./binding";
import { setupClearButtons } from "./handlers";

/**
 * Render the non-English citation section
 * This is called by ItemPaneManager when the section needs to render
 *
 * @param renderProps - Properties provided by ItemPaneManager
 */
export function renderCneSection(renderProps: {
  body: HTMLElement;
  item: Zotero.Item;
  editable: boolean;
  tabType: string;
}): void {
  const { body, item, editable } = renderProps;

  // Clear any existing content
  body.innerHTML = "";

  try {
    // Create metadata instance (single source of truth)
    const metadata = new CneMetadata(item);

    ztoolkit.log("Rendering non-English section for item:", item.id);
    ztoolkit.log("non-English metadata:", metadata.toJSON());

    // Build all field groups
    const fieldGroups = buildAllFieldGroups(SUPPORTED_FIELDS);

    // Build author field groups
    const authorFieldGroups = buildAllAuthorFieldGroups(item, metadata.data.authors);

    // Create main container
    const doc = body.ownerDocument!;
    const container = ztoolkit.UI.createElement(doc, "div", {
      namespace: "html",
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

    // Append to body
    body.appendChild(container);

    // Set up all bindings and handlers
    setupDataBinding(body, metadata);
    setupClearButtons(body, metadata);
    setupLanguageBinding(body, item, metadata);

  } catch (error) {
    ztoolkit.log("[CNE] Error rendering non-English section:", error);
    renderError(body, error);
  }
}

/**
 * Render error message in the section
 *
 * @param body - Container element
 * @param error - Error object or message
 */
function renderError(body: HTMLElement, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : "";

  body.innerHTML = `
    <div style="padding: 20px; color: #d32f2f; font-family: monospace; font-size: 11px;">
      <p style="font-weight: bold; font-size: 13px;">Error loading non-English citation fields</p>
      <p style="margin-top: 8px; color: #666;">${errorMessage}</p>
      <details style="margin-top: 8px; font-size: 10px;">
        <summary style="cursor: pointer; color: #999;">Stack trace</summary>
        <pre style="margin-top: 4px; overflow-x: auto; color: #999;">${errorStack}</pre>
      </details>
    </div>
  `;
}
