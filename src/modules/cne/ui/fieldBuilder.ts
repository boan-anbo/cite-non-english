/**
 * Field builder for non-English Citation Manager
 * Creates complete field input groups with original, English, and romanized variants
 */

import type { FieldConfig } from "../types";
import { VARIANT_LABELS, getElementId } from "../constants";
import {
  createTextInput,
  createLabel,
  createHelperText,
  createFieldSection,
  createContainer,
} from "./components";

/**
 * Build a complete field group with variants in Zotero's two-column grid layout
 * Each field gets inputs with clear buttons based on configured variants
 * If no variants specified, uses all 4 variants (original, romanized, romanizedShort, english)
 *
 * @param fieldConfig - Configuration for the field
 * @returns Element configuration object for the complete field group
 */
export function buildFieldGroup(fieldConfig: FieldConfig): any {
  const { name, label, variants } = fieldConfig;

  // Use custom variants if specified, otherwise use all VARIANT_LABELS
  const variantsToUse = variants
    ? VARIANT_LABELS.filter(v => variants.includes(v.variant))
    : VARIANT_LABELS;

  // Create grid rows for each variant (label + input with clear button)
  const variantRows = variantsToUse.flatMap((variantConfig) => {
    const variant = variantConfig.variant;
    const elementId = getElementId(name, variant);
    const bindKey = `${name}.${variant}`; // e.g., "title.original"

    return [
      createLabel(
        variantConfig.label,
        elementId,
        variantConfig.l10nKey,
      ),
      // Wrapper with input and clear button
      {
        tag: "div",
        namespace: "html",
        classList: ["cne-input-wrapper"],
        children: [
          createTextInput(
            elementId,
            bindKey,
            variantConfig.placeholder,
          ),
          // Clear button
          {
            tag: "button",
            namespace: "html",
            classList: ["cne-clear-button"],
            attributes: {
              type: "button",
              title: "Clear",
              "data-clear-for": elementId,
            },
            properties: {
              innerHTML: "×",
            },
          },
        ],
      },
    ];
  });

  // Create the complete field section with grid layout
  return createFieldSection(label, variantRows);
}

/**
 * Build all field groups for all supported fields
 *
 * @param supportedFields - Array of field configurations
 * @returns Array of field group elements
 */
export function buildAllFieldGroups(supportedFields: readonly FieldConfig[]): any[] {
  return supportedFields.map((fieldConfig) => buildFieldGroup(fieldConfig));
}
