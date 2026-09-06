/**
 * Main renderer for non-English Citation Manager section
 * Coordinates rendering of the item pane section with real-time data binding
 */

import { bindDraft } from "../binding/draftBinding";
import { CneMetadata } from "../../model/CneMetadata";
import {
  setupDataBinding,
  setupLanguageBinding,
  updateCreatorSignature,
} from "../binding";
import { setupClearButtons } from "../handlers";
import {
  setupResponsivePlaceholders,
  clearResponsivePlaceholderObservers,
} from "../handlers/responsivePlaceholders";
import { buildMainContainer } from "./containerBuilder";
import { renderError } from "./errorRenderer";

const sessions = new Map<
  HTMLElement,
  { metadata: CneMetadata; editable: boolean; cleanup: () => void }
>();
const drafts = new Map<number, CneMetadata>();

export function disposeCneSection(body: HTMLElement): void {
  const session = sessions.get(body);
  if (session) {
    session.cleanup();
    if (session.metadata.hasPendingChanges())
      drafts.set(session.metadata.getItem().id, session.metadata);
  }
  clearResponsivePlaceholderObservers(body);
  sessions.delete(body);
}

export function disposeCneSections(): void {
  for (const body of sessions.keys()) disposeCneSection(body);
  drafts.clear();
}

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

  const existing = sessions.get(body);
  if (
    existing?.metadata.getItem().id === item.id &&
    existing.editable === editable
  ) {
    existing.metadata.refresh();
    return;
  }
  disposeCneSection(body);
  body.innerHTML = "";

  try {
    // Create metadata instance (single source of truth)
    const metadata = drafts.get(item.id) ?? new CneMetadata(item);
    drafts.delete(item.id);
    for (const [id, draft] of drafts)
      if (!draft.hasPendingChanges()) drafts.delete(id);
    metadata.refresh();

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
    setupResponsivePlaceholders(body);

    // Initialize creator signature for change detection
    updateCreatorSignature(body, item);
    sessions.set(body, {
      metadata,
      editable,
      cleanup: bindDraft(body, metadata, editable),
    });
  } catch (error) {
    ztoolkit.log("[CNE] Error rendering non-English section:", error);
    renderError(body, error);
  }
}
