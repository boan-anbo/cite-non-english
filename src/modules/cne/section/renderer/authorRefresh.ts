/**
 * Author fields refresh logic for CNE section
 * Handles dynamic updating of author fields when creators change
 */

import type { CneMetadata } from "../../model/CneMetadata";
import { buildAllAuthorFieldGroups } from "../../ui/authorFieldBuilder";
import { setupDataBinding, updateCreatorSignature } from "../binding";
import { setupClearButtons } from "../handlers";

/**
 * Refresh only the author fields section when creators change
 * Preserves all existing CNE metadata and other fields
 *
 * @param body - The outer body element (from ItemPane)
 * @param item - Zotero item
 * @param metadata - CNE metadata instance
 */
export async function refreshAuthorFields(
  body: HTMLElement,
  item: Zotero.Item,
  metadata: CneMetadata
): Promise<void> {
  try {
    ztoolkit.log("[CNE] Refreshing author fields for item:", item.id);

    // Find the main container using our unique class
    const realContainer = body.querySelector(".cne-main-container") as HTMLElement;
    if (!realContainer) {
      ztoolkit.log("[CNE] Error: Could not find CNE main container");
      return;
    }

    const doc = body.ownerDocument!;

    // Build new author field groups
    const newAuthorFieldGroups = buildAllAuthorFieldGroups(
      item,
      metadata.data.authors
    );
    ztoolkit.log(`[CNE] Built ${newAuthorFieldGroups.length} new author field groups`);

    // Strategy: Rebuild the container children array preserving non-author elements
    // This mimics the initial render approach more closely
    const childrenToKeep: Element[] = [];
    const childrenArray = Array.from(realContainer.children);

    // Collect all non-author sections
    for (const child of childrenArray) {
      // Skip author sections (they contain author inputs)
      const hasAuthorInputs = child.querySelector && child.querySelector('[id^="author-"]');
      if (!hasAuthorInputs) {
        childrenToKeep.push(child);
      }
    }

    // Find where to insert author fields - after language buttons
    let insertIndex = findInsertionIndex(childrenToKeep);

    ztoolkit.log(`[CNE] Inserting author fields at index ${insertIndex} of ${childrenToKeep.length} kept elements`);

    // Create new author elements
    const newAuthorElements = createAuthorElements(doc, newAuthorFieldGroups);

    // Rebuild the container with elements in correct order
    rebuildContainer(realContainer, childrenToKeep, newAuthorElements, insertIndex);

    // Re-setup data binding for all elements
    // Use setTimeout to ensure DOM is fully updated
    setTimeout(() => {
      setupDataBinding(body, metadata);
      setupClearButtons(body, metadata);

      // Update the creator signature to match current state
      // This ensures the next comparison will be accurate
      updateCreatorSignature(body, item);

      ztoolkit.log("[CNE] Author fields refreshed and bindings re-established");
    }, 0);

  } catch (error) {
    ztoolkit.log("[CNE] Error refreshing author fields:", error);
    throw error;
  }
}

/**
 * Find the correct insertion index for author fields
 * @param childrenToKeep - Array of non-author elements
 * @returns The index where author fields should be inserted
 */
function findInsertionIndex(childrenToKeep: Element[]): number {
  let insertIndex = -1;

  // First try: after language buttons
  for (let i = 0; i < childrenToKeep.length; i++) {
    const child = childrenToKeep[i];
    if (child.classList && child.classList.contains("cne-quick-language-buttons")) {
      insertIndex = i + 1;
      break;
    }
  }

  // Fallback: if no language buttons found, insert before title section
  if (insertIndex === -1) {
    for (let i = 0; i < childrenToKeep.length; i++) {
      const child = childrenToKeep[i];
      if (child.querySelector && child.querySelector('[id="title-original"]')) {
        insertIndex = i;
        break;
      }
    }
  }

  // If still no position found, insert after field counter and language selector
  if (insertIndex === -1) {
    // Look for a reasonable default position (after initial UI elements)
    insertIndex = Math.min(3, childrenToKeep.length); // After style, counter, language selector
  }

  return insertIndex;
}

/**
 * Create DOM elements for author fields
 * @param doc - Document object
 * @param fieldGroups - Author field group configurations
 * @returns Array of created elements
 */
function createAuthorElements(
  doc: Document,
  fieldGroups: any[]
): (Element | DocumentFragment)[] {
  const elements: (Element | DocumentFragment)[] = [];

  for (const fieldGroupConfig of fieldGroups) {
    const element = ztoolkit.UI.createElement(
      doc,
      fieldGroupConfig.tag,
      fieldGroupConfig
    );
    elements.push(element);
  }

  return elements;
}

/**
 * Rebuild container with elements in correct order
 * @param container - The container element
 * @param childrenToKeep - Non-author elements to preserve
 * @param authorElements - New author elements to insert
 * @param insertIndex - Where to insert author elements
 */
function rebuildContainer(
  container: HTMLElement,
  childrenToKeep: Element[],
  authorElements: (Element | DocumentFragment)[],
  insertIndex: number
): void {
  // First, remove all children but keep references to non-author elements
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Re-add elements in order
  for (let i = 0; i < childrenToKeep.length; i++) {
    // Insert author fields at the designated position
    if (i === insertIndex) {
      for (const authorElement of authorElements) {
        container.appendChild(authorElement);
      }
    }
    container.appendChild(childrenToKeep[i]);
  }

  // If we haven't added author fields yet (they go at the end)
  if (insertIndex >= childrenToKeep.length) {
    for (const authorElement of authorElements) {
      container.appendChild(authorElement);
    }
  }
}