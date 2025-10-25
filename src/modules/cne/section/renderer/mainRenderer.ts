/**
 * Main renderer for non-English Citation Manager section
 * Coordinates rendering of the item pane section with real-time data binding
 */

import { CneMetadata } from "../../model/CneMetadata";
import { setupDataBinding, setupLanguageBinding, updateCreatorSignature } from "../binding";
import { setupClearButtons } from "../handlers";
import { buildMainContainer } from "./containerBuilder";
import { renderError } from "./errorRenderer";

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

    // Build main container with all components
    const doc = body.ownerDocument!;
    const container = buildMainContainer(doc, item, metadata);

    // Append to body
    body.appendChild(container);

    // Set up all bindings and handlers
    setupDataBinding(body, metadata);
    setupClearButtons(body, metadata);
    setupLanguageBinding(body, item, metadata);

    // Initialize creator signature for change detection
    updateCreatorSignature(body, item);

  } catch (error) {
    ztoolkit.log("[CNE] Error rendering non-English section:", error);
    renderError(body, error);
  }
}