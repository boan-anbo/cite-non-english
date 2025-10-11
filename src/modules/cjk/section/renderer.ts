/**
 * Section renderer for CJK Citation Manager
 * Handles rendering the item pane section with real-time data binding
 */

import { CjkMetadata } from "../model/CjkMetadata";
import { SUPPORTED_FIELDS } from "../constants";
import { buildAllFieldGroups } from "../ui/fieldBuilder";
import {
  createSeparator,
  createLivePreview,
  createFieldCounter,
} from "../ui/components";
import type { CjkFieldName, FieldVariant } from "../types";

/**
 * Debounce timer for auto-save
 */
let saveDebounceTimer: number | undefined;

/**
 * Render the CJK citation section
 * This is called by ItemPaneManager when the section needs to render
 *
 * @param renderProps - Properties provided by ItemPaneManager
 */
export function renderCjkSection(renderProps: {
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
    const metadata = new CjkMetadata(item);

    ztoolkit.log("Rendering CJK section for item:", item.id);
    ztoolkit.log("CJK metadata:", metadata.toJSON());

    // Build all field groups
    const fieldGroups = buildAllFieldGroups(SUPPORTED_FIELDS);

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
        // Style tag for hover effects
        {
          tag: "style",
          namespace: "html",
          properties: {
            innerHTML: `
              .citecjk-field-grid input[type="text"]:hover {
                border-color: #999 !important;
              }
              .citecjk-field-grid input[type="text"]:focus {
                border-color: #0066cc !important;
                outline: none;
              }
              .citecjk-input-wrapper {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              .citecjk-clear-button {
                background: transparent;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 4px;
                font-size: 16px;
                line-height: 1;
                opacity: 0;
                transition: opacity 0.2s;
              }
              .citecjk-input-wrapper:hover .citecjk-clear-button {
                opacity: 1;
              }
              .citecjk-clear-button:hover {
                color: #666;
              }
            `,
          },
        },
        // Field counter
        createFieldCounter(metadata),

        // All field groups
        ...fieldGroups,

        // Live preview
        createLivePreview(metadata),
      ],
    });

    // Append to body
    body.appendChild(container);

    // Set up data binding
    // The ztoolkit Dialog helper has built-in data binding support
    // We need to manually bind for ItemPaneManager sections
    setupDataBinding(body, metadata);

    // Set up clear buttons
    setupClearButtons(body, metadata);

  } catch (error) {
    ztoolkit.log("Error rendering CJK section:", error);

    // Show error message
    body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #d32f2f;">
        <p>Error loading CJK citation fields.</p>
        <p style="font-size: 12px; color: #666;">Check the console for details.</p>
      </div>
    `;
  }
}

/**
 * Set up two-way data binding between form inputs and metadata model
 * Uses model methods to ensure type safety and reusable logic
 * Implements real-time auto-save with debouncing
 *
 * @param container - Container element with input elements
 * @param metadata - CjkMetadata instance to bind to
 */
function setupDataBinding(container: HTMLElement, metadata: CjkMetadata): void {
  // Find all elements with data-bind attribute
  const boundElements = container.querySelectorAll("[data-bind]");

  boundElements.forEach((element: Element) => {
    const bindKey = element.getAttribute("data-bind");
    const prop = element.getAttribute("data-prop") || "value";

    if (!bindKey) return;

    // Parse the bind key (e.g., "title.original" => ["title", "original"])
    const keys = bindKey.split(".");

    if (keys.length !== 2) {
      ztoolkit.log(`Invalid bind key format: ${bindKey}`);
      return;
    }

    const fieldName = keys[0] as CjkFieldName;
    const variant = keys[1] as FieldVariant;

    // Set initial value from metadata model
    const initialValue = metadata.getFieldVariant(fieldName, variant) || "";
    (element as any)[prop] = initialValue;

    // Listen for changes and update metadata using model methods
    element.addEventListener("input", () => {
      const newValue = (element as any)[prop];

      // Update model
      metadata.setFieldVariant(fieldName, variant, newValue);

      // Update UI
      updateLivePreview(container, metadata);
      updateFieldCounter(container, metadata);

      // Auto-save with debouncing
      debouncedSave(metadata);

      ztoolkit.log(`Data binding updated: ${bindKey} = ${newValue}`);
    });

    ztoolkit.log(`Data binding set up for: ${bindKey}`);
  });
}

/**
 * Debounced save function
 * Delays saving until user stops typing for 500ms
 * This prevents excessive saves while maintaining real-time feel
 *
 * @param metadata - CjkMetadata instance to save
 */
function debouncedSave(metadata: CjkMetadata): void {
  // Clear existing timer
  if (saveDebounceTimer !== undefined) {
    clearTimeout(saveDebounceTimer);
  }

  // Set new timer
  saveDebounceTimer = setTimeout(async () => {
    try {
      await metadata.save();
      ztoolkit.log("CJK metadata auto-saved successfully");
    } catch (error) {
      ztoolkit.log("Error auto-saving CJK metadata:", error);
    }
  }, 500) as unknown as number; // 500ms debounce delay
}

/**
 * Update the live preview display with current metadata state
 *
 * @param container - Container element
 * @param metadata - CjkMetadata instance
 */
function updateLivePreview(container: HTMLElement, metadata: CjkMetadata): void {
  const previewElement = container.querySelector("#cjk-data-preview");
  if (previewElement) {
    previewElement.innerHTML = JSON.stringify(metadata.toJSON(), null, 2);
  }
}

/**
 * Update the field counter display
 *
 * @param container - Container element
 * @param metadata - CjkMetadata instance
 */
function updateFieldCounter(container: HTMLElement, metadata: CjkMetadata): void {
  const counterElement = container.querySelector("#cjk-field-counter");
  if (counterElement) {
    const count = metadata.getFilledFieldCount();
    const total = 5; // Total supported fields
    counterElement.innerHTML = `${count} of ${total} fields have data`;
  }
}

/**
 * Set up clear buttons for all input fields
 *
 * @param container - Container element
 * @param metadata - CjkMetadata instance
 */
function setupClearButtons(container: HTMLElement, metadata: CjkMetadata): void {
  const clearButtons = container.querySelectorAll(".citecjk-clear-button");

  clearButtons.forEach((button: Element) => {
    button.addEventListener("click", () => {
      const inputId = button.getAttribute("data-clear-for");
      if (!inputId) return;

      const input = container.querySelector(`#${inputId}`) as HTMLInputElement;
      if (!input) return;

      // Get the bind key from the input
      const bindKey = input.getAttribute("data-bind");
      if (!bindKey) return;

      // Parse bind key to get field and variant
      const keys = bindKey.split(".");
      if (keys.length !== 2) return;

      const fieldName = keys[0] as import("../types").CjkFieldName;
      const variant = keys[1] as import("../types").FieldVariant;

      // Clear the input value
      input.value = "";

      // Directly update the model
      metadata.setFieldVariant(fieldName, variant, "");

      // Update UI
      updateLivePreview(container, metadata);
      updateFieldCounter(container, metadata);

      // Trigger auto-save
      debouncedSave(metadata);

      ztoolkit.log(`Cleared field: ${bindKey}`);
    });
  });
}
