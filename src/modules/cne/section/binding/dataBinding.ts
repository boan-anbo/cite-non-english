/**
 * Main data binding coordinator for CNE section
 * Routes binding setup to appropriate handlers
 */

import type { CneMetadata } from "../../model/CneMetadata";
import { setupStaticFieldBinding } from "./staticFieldBinding";
import { setupAuthorFieldBinding } from "./authorFieldBinding";

/**
 * Set up two-way data binding between form inputs and metadata model
 * Uses model methods to ensure type safety and reusable logic
 * Implements real-time auto-save with debouncing
 *
 * Handles two types of bindings:
 * 1. Static fields: "title.original", "publisher.romanized", etc.
 * 2. Author fields: "author-0.lastOriginal", "author-1.optionsSpacing", etc.
 *
 * @param container - Container element with input elements
 * @param metadata - CneMetadata instance to bind to
 */
export function setupDataBinding(container: HTMLElement, metadata: CneMetadata): void {
  // Find all elements with data-bind attribute
  const boundElements = container.querySelectorAll("[data-bind]");

  boundElements.forEach((element: Element) => {
    const bindKey = element.getAttribute("data-bind");
    const prop = element.getAttribute("data-prop") || "value";

    if (!bindKey) return;

    // Check if this is an author field binding
    if (bindKey.startsWith("author-")) {
      setupAuthorFieldBinding(element, bindKey, prop, metadata, container);
    } else {
      // Handle static field binding (title, publisher, etc.)
      setupStaticFieldBinding(element, bindKey, prop, metadata, container);
    }
  });
}
