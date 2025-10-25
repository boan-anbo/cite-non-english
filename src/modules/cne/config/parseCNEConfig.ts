/**
 * CNE Configuration Parser
 *
 * Extracts and parses CNE-CONFIG metadata from CSL style files to configure
 * citeproc-js multilingual rendering behavior.
 *
 * @see /docs/PLAN-multi-slot-architecture.md
 * @see /docs/citeproc-multilingual-infrastructure.md
 */

/**
 * Name formatting options for romanized CJK names
 *
 * Provides granular control over how romanized CJK names are formatted.
 * Describes the observable format without cultural assumptions.
 */
export interface RomanizedCJKFormatting {
  /**
   * Name component order
   *
   * - `'last-name-first'`: Family name, then given name (e.g., "Hao Chunwen" or "Hao, C.")
   * - `'first-name-first'`: Given name, then family name (e.g., "Chunwen Hao")
   *
   * @default 'last-name-first'
   */
  order?: 'last-name-first' | 'first-name-first';

  /**
   * Separator between family and given names
   *
   * - `'comma'`: Comma separator (e.g., "Hao, C.") - APA style
   * - `'space'`: Space separator (e.g., "Hao Chunwen") - Chicago style
   *
   * @default 'space'
   */
  separator?: 'comma' | 'space';
}

/**
 * Name formatting options
 *
 * Controls how names are formatted beyond basic slot selection.
 */
export interface NameFormatting {
  /** Formatting options for romanized CJK names */
  romanizedCJK?: RomanizedCJKFormatting;

  // Future: originalCJK, romanizedArabic, etc.
}

/**
 * CNE Configuration Options
 *
 * Specifies which language variants to display for each field type
 * and how to format them.
 *
 * @example
 * ```typescript
 * // MLA CNE: Show romanized + original for both names and titles
 * {
 *   persons: ['translit', 'orig'],
 *   titles: ['translit', 'orig'],
 *   nameFormatting: {
 *     romanizedCJK: {
 *       order: 'last-name-first',
 *       separator: 'space'
 *     }
 *   }
 * }
 *
 * // Chicago CNE: Show romanized + original for names, family-first with space
 * {
 *   persons: ['translit', 'orig'],
 *   nameFormatting: {
 *     romanizedCJK: {
 *       order: 'last-name-first',
 *       separator: 'space'
 *     }
 *   }
 * }
 *
 * // APA CNE: Show romanized only, family-first with comma
 * {
 *   persons: ['translit'],
 *   nameFormatting: {
 *     romanizedCJK: {
 *       order: 'last-name-first',
 *       separator: 'comma'
 *     }
 *   }
 * }
 * ```
 */
export interface CNEConfigOptions {
  /** Language variants for personal/corporate names */
  persons?: string[];

  /** Name formatting options */
  nameFormatting?: NameFormatting;
}

/**
 * Valid slot values for language variants
 *
 * - `orig`: Original script (uses main fields or falls back to multi._key if present)
 * - `translit`: Transliteration/romanization (searches multi._key for romanized variants)
 * - `translat`: Translation (searches multi._key for translated variants)
 */
export type SlotValue = 'orig' | 'translit' | 'translat';

/**
 * Valid field type names
 *
 * CNE-CONFIG only controls multi-slot rendering for creator names.
 * Title formatting is controlled by CSL macros, as titles require
 * complex style-specific formatting that multi-slot cannot provide.
 */
export type FieldType = 'persons';

/**
 * Parse CNE-CONFIG string from style metadata
 *
 * Supports two formats:
 * 1. **JSON format (preferred)**: `{"persons":["translit","orig"]}`
 * 2. **Legacy space-delimited format**: `persons=translit,orig`
 *
 * @param configString - Configuration string
 * @returns Parsed configuration object
 * @throws Error if syntax is invalid
 *
 * @example
 * ```typescript
 * // JSON format
 * const config = parseCNEConfigString('{"persons":["translit","orig"]}');
 * // Returns: { persons: ['translit', 'orig'] }
 *
 * // Legacy format (backward compatible)
 * const config = parseCNEConfigString("persons=translit,orig");
 * // Returns: { persons: ['translit', 'orig'] }
 * ```
 *
 * ## JSON Format Syntax
 *
 * ```json
 * {"persons": ["translit", "orig"]}
 * ```
 *
 * **Field Types**: persons, institutions
 *
 * **Slot Values**: orig, translit, translat
 *
 * **Examples**:
 * - `{"persons":["translit","orig"]}` → Show romanized + original for names
 * - `{"persons":["translit"]}` → Show romanized only
 * - `{"persons":["orig"]}` → Show original only
 * - `{"institutions":["translit"]}` → Institutional names romanized only
 *
 * **Note**: Titles, journals, publishers use CSL macros, not CNE-CONFIG.
 */
export function parseCNEConfigString(configString: string): CNEConfigOptions {
  if (!configString || typeof configString !== 'string') {
    throw new Error('CNE-CONFIG string must be a non-empty string');
  }

  const trimmed = configString.trim();

  // Try JSON format first (preferred)
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('CNE-CONFIG JSON must be an object');
      }

      const config: CNEConfigOptions = {};
      const validFields: FieldType[] = ['persons'];
      const validSlots: SlotValue[] = ['orig', 'translit', 'translat'];
      const validOrders = ['last-name-first', 'first-name-first'];
      const validSeparators = ['comma', 'space'];

      // Validate and convert to CNEConfigOptions
      for (const [key, value] of Object.entries(parsed)) {
        // Handle nameFormatting (new modular structure)
        if (key === 'nameFormatting') {
          if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(
              `nameFormatting must be an object, got: ${typeof value}`
            );
          }

          const nameFormatting: NameFormatting = {};

          // Handle romanizedCJK
          if ('romanizedCJK' in value) {
            const romanizedCJK = (value as any).romanizedCJK;
            if (!romanizedCJK || typeof romanizedCJK !== 'object' || Array.isArray(romanizedCJK)) {
              throw new Error(
                `nameFormatting.romanizedCJK must be an object, got: ${typeof romanizedCJK}`
              );
            }

            const romanizedCJKFormatting: RomanizedCJKFormatting = {};

            // Validate order
            if ('order' in romanizedCJK) {
              const order = romanizedCJK.order;
              if (typeof order !== 'string') {
                throw new Error(
                  `nameFormatting.romanizedCJK.order must be a string, got: ${typeof order}`
                );
              }
              if (!validOrders.includes(order)) {
                throw new Error(
                  `Invalid order: "${order}". Valid values: ${validOrders.join(', ')}`
                );
              }
              romanizedCJKFormatting.order = order as 'last-name-first' | 'first-name-first';
            }

            // Validate separator
            if ('separator' in romanizedCJK) {
              const separator = romanizedCJK.separator;
              if (typeof separator !== 'string') {
                throw new Error(
                  `nameFormatting.romanizedCJK.separator must be a string, got: ${typeof separator}`
                );
              }
              if (!validSeparators.includes(separator)) {
                throw new Error(
                  `Invalid separator: "${separator}". Valid values: ${validSeparators.join(', ')}`
                );
              }
              romanizedCJKFormatting.separator = separator as 'comma' | 'space';
            }

            nameFormatting.romanizedCJK = romanizedCJKFormatting;
          }

          config.nameFormatting = nameFormatting;
          continue;
        }

        // Validate field type (e.g., 'persons')
        if (!validFields.includes(key as FieldType)) {
          throw new Error(
            `Invalid field type: "${key}". Valid types: ${validFields.join(', ')}, nameFormatting. ` +
            `Note: CNE-CONFIG only controls multi-slot rendering for names. ` +
            `Title formatting is controlled by CSL macros.`
          );
        }

        // Validate slots is array
        if (!Array.isArray(value)) {
          throw new Error(
            `Field "${key}" must be an array of slot values, got: ${typeof value}`
          );
        }

        // Validate each slot value
        for (const slot of value) {
          if (!validSlots.includes(slot as SlotValue)) {
            throw new Error(
              `Invalid slot value: "${slot}". Valid values: ${validSlots.join(', ')}`
            );
          }
        }

        // Validate slot count (max 3 slots: primary, secondary, tertiary)
        if (value.length > 3) {
          throw new Error(
            `Too many slots for "${key}": ${value.length}. Maximum is 3 (primary, secondary, tertiary)`
          );
        }

        // Store in config
        config[key as FieldType] = value;
      }

      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in CNE-CONFIG: ${error.message}`);
      }
      throw error;
    }
  }

  // Fall back to legacy space-delimited format
  const config: CNEConfigOptions = {};
  const assignments = trimmed.split(/\s+/);

  for (const assignment of assignments) {
    // Skip empty strings
    if (!assignment) continue;

    // Parse field=slot1,slot2,slot3
    const parts = assignment.split('=');
    if (parts.length !== 2) {
      throw new Error(
        `Invalid CNE-CONFIG syntax: "${assignment}". Expected format: "field=slot1,slot2"`
      );
    }

    const [fieldType, slotsStr] = parts;

    // Validate field type
    const validFields: FieldType[] = ['persons'];

    if (!validFields.includes(fieldType as FieldType)) {
      throw new Error(
        `Invalid field type: "${fieldType}". Valid types: ${validFields.join(', ')}. ` +
        `Note: CNE-CONFIG only controls multi-slot rendering for names. ` +
        `Title formatting is controlled by CSL macros.`
      );
    }

    // Parse slots
    const slots = slotsStr.split(',').map((s) => s.trim());

    // Validate slots
    const validSlots: SlotValue[] = ['orig', 'translit', 'translat'];
    for (const slot of slots) {
      if (!validSlots.includes(slot as SlotValue)) {
        throw new Error(
          `Invalid slot value: "${slot}". Valid values: ${validSlots.join(', ')}`
        );
      }
    }

    // Validate slot count (max 3 slots: primary, secondary, tertiary)
    if (slots.length > 3) {
      throw new Error(
        `Too many slots for "${fieldType}": ${slots.length}. Maximum is 3 (primary, secondary, tertiary)`
      );
    }

    // Store in config
    config[fieldType as FieldType] = slots;
  }

  return config;
}

/**
 * Extract CNE-CONFIG from Processing Instruction
 *
 * Searches for <?cne-config ...?> processing instruction in the <info> section.
 *
 * @param doc - Parsed XML document
 * @returns Parsed configuration if found, null otherwise
 *
 * @example
 * ```xml
 * <info>
 *   <summary>Chicago-style source citations...</summary>
 *   <?cne-config persons=translit,orig?>
 *   <updated>2025-10-19T00:00:00+00:00</updated>
 * </info>
 * ```
 */
function extractCNEConfigFromPI(doc: Document): CNEConfigOptions | null {
  try {
    // === DIAGNOSTIC LOGGING START ===
    Zotero.debug('[CNE Config PI] === DIAGNOSTIC START ===');
    Zotero.debug('[CNE Config PI] typeof Node: ' + typeof Node);

    if (typeof Node !== 'undefined') {
      Zotero.debug('[CNE Config PI] Node is defined');
      Zotero.debug('[CNE Config PI] Node.PROCESSING_INSTRUCTION_NODE: ' + Node.PROCESSING_INSTRUCTION_NODE);
      Zotero.debug('[CNE Config PI] Node.ELEMENT_NODE: ' + Node.ELEMENT_NODE);
      Zotero.debug('[CNE Config PI] Node.TEXT_NODE: ' + Node.TEXT_NODE);
    } else {
      Zotero.debug('[CNE Config PI] Node is UNDEFINED - will use numeric constant 7');
    }
    // === DIAGNOSTIC LOGGING END ===

    // Get <info> element
    const infoElement = doc.querySelector('info');
    if (!infoElement) {
      Zotero.debug('[CNE Config PI] No <info> element found');
      return null;
    }

    Zotero.debug('[CNE Config PI] Found <info> element, child nodes count: ' + infoElement.childNodes.length);

    // Iterate through child nodes looking for processing instruction
    for (let i = 0; i < infoElement.childNodes.length; i++) {
      const node = infoElement.childNodes[i];

      // === DIAGNOSTIC: Log each node ===
      Zotero.debug(`[CNE Config PI] Node ${i}: type=${node.nodeType}, nodeName="${node.nodeName}"`);

      // Check if it's a processing instruction with target "cne-config"
      // Use numeric constant (7) for PROCESSING_INSTRUCTION_NODE
      if (node.nodeType === 7) {
        Zotero.debug(`[CNE Config PI] Found PI node! Checking target...`);
        const pi = node as ProcessingInstruction;
        Zotero.debug(`[CNE Config PI] PI target: "${pi.target}", data: "${pi.data}"`);

        if (pi.target === 'cne-config') {
          const configString = pi.data.trim();
          Zotero.debug(`[CNE Config PI] SUCCESS! Found cne-config PI: "${configString}"`);
          return parseCNEConfigString(configString);
        } else {
          Zotero.debug(`[CNE Config PI] PI target mismatch: "${pi.target}" !== "cne-config"`);
        }
      }
    }

    Zotero.debug('[CNE Config PI] No <?cne-config?> processing instruction found');
    return null;
  } catch (error) {
    Zotero.debug('[CNE Config PI] ERROR: ' + error);
    Zotero.debug('[CNE Config PI] Error stack: ' + (error instanceof Error ? error.stack : 'no stack'));
    return null;
  }
}

/**
 * Extract CNE-CONFIG from CSL style XML
 *
 * Tries Processing Instruction first (preferred method), then falls back to
 * searching for `CNE-CONFIG:` pattern in the style's `<summary>` element (legacy).
 *
 * @param styleXml - CSL style XML string or Document
 * @returns Parsed configuration if found, null otherwise
 *
 * @example
 * ```typescript
 * const styleXml = `
 *   <style>
 *     <info>
 *       <summary>Chicago CNE. CNE-CONFIG: persons=translit,orig</summary>
 *     </info>
 *   </style>
 * `;
 * const config = extractCNEConfigFromStyleXml(styleXml);
 * // Returns: { persons: ['translit', 'orig'] }
 * ```
 */
export function extractCNEConfigFromStyleXml(styleXml: string | Document): CNEConfigOptions | null {
  try {
    let doc: Document;

    // Parse XML if string provided
    if (typeof styleXml === 'string') {
      const parser = new DOMParser();
      doc = parser.parseFromString(styleXml, 'text/xml');

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        Zotero.debug('[CNE Config] XML parsing error: ' + parserError.textContent);
        return null;
      }
    } else {
      doc = styleXml;
    }

    // Try Processing Instruction first (preferred method)
    const piConfig = extractCNEConfigFromPI(doc);
    if (piConfig) {
      Zotero.debug('[CNE Config] Using PI-based config');
      return piConfig;
    }

    // Fallback to summary parsing (legacy method for backward compatibility)
    Zotero.debug('[CNE Config] No PI found, trying summary fallback');

    const summaryElement = doc.querySelector('info > summary');
    if (!summaryElement) {
      Zotero.debug('[CNE Config] No <summary> element found');
      return null;
    }

    const summaryText = summaryElement.textContent || '';

    // Look for CNE-CONFIG: marker
    const configMarker = 'CNE-CONFIG:';
    const markerIndex = summaryText.indexOf(configMarker);

    if (markerIndex === -1) {
      Zotero.debug('[CNE Config] No CNE-CONFIG marker found in summary');
      return null;
    }

    // Extract config string (everything after "CNE-CONFIG:" until end or newline)
    const configStart = markerIndex + configMarker.length;
    const remaining = summaryText.substring(configStart);
    const configString = remaining.split('\n')[0].trim();

    if (!configString) {
      Zotero.debug('[CNE Config] Empty config string after CNE-CONFIG marker');
      return null;
    }

    Zotero.debug(`[CNE Config] Found summary config (legacy): "${configString}"`);
    return parseCNEConfigString(configString);
  } catch (error) {
    Zotero.debug('[CNE Config] Error extracting config from style: ' + error);
    return null;
  }
}

/**
 * Extract CNE-CONFIG from a Zotero style object
 *
 * Convenience wrapper for extracting config from Zotero.Style instances.
 *
 * @param style - Zotero style object
 * @returns Parsed configuration if found, null otherwise
 *
 * @example
 * ```typescript
 * const style = Zotero.Styles.get('http://www.zotero.org/styles/chicago-notes-bibliography-cne');
 * const config = extractCNEConfigFromStyle(style);
 * ```
 */
export function extractCNEConfigFromStyle(style: any): CNEConfigOptions | null {
  try {
    // Get style XML from Zotero style object
    // Zotero styles have a getXML() method that returns the style XML
    if (typeof style.getXML === 'function') {
      const styleXml = style.getXML();
      const configFromMemory = extractCNEConfigFromStyleXml(styleXml);
      if (configFromMemory) {
        return configFromMemory;
      }
    }

    // Fallback: try to access XML directly
    if (style.xml) {
      const configFromProperty = extractCNEConfigFromStyleXml(style.xml);
      if (configFromProperty) {
        return configFromProperty;
      }
    }

    // Final fallback: read the installed style file from disk.
    // This covers cases where the in-memory style XML lacks the CNE markers
    // (e.g. temporary Style Editor copies).
    if (style.path && typeof style.path === 'string') {
      try {
        const fileContents = (Zotero.File as any).getContents
          ? (Zotero.File as any).getContents(style.path)
          : undefined;
        if (fileContents) {
          const configFromFile = extractCNEConfigFromStyleXml(fileContents);
          if (configFromFile) {
            Zotero.debug(
              '[CNE Config] Loaded configuration from style.path fallback: ' + style.path
            );
            return configFromFile;
          }
        }
      } catch (fileError) {
        Zotero.debug(
          '[CNE Config] Failed to read style.path fallback (' +
            style.path +
            '): ' +
            fileError
        );
      }
    }

    Zotero.debug('[CNE Config] Style object has no getXML() method or xml property');
    return null;
  } catch (error) {
    Zotero.debug('[CNE Config] Error extracting config from style object: ' + error);
    return null;
  }
}

/**
 * Get default CNE configuration
 *
 * Returns a safe default configuration that shows romanized text only.
 * This matches APA style requirements and is safe for most citation styles.
 *
 * @returns Default configuration
 *
 * @example
 * ```typescript
 * const config = getDefaultCNEConfig();
 * // Returns: { persons: ['translit'] }
 * ```
 */
export function getDefaultCNEConfig(): CNEConfigOptions {
  return {
    persons: ['translit'],
  };
}

/**
 * Validate CNE configuration object
 *
 * @param config - Configuration to validate
 * @returns True if valid, false otherwise
 */
export function isValidCNEConfig(config: any): config is CNEConfigOptions {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const validFields: FieldType[] = ['persons'];
  const validSlots: SlotValue[] = ['orig', 'translit', 'translat'];

  for (const field of validFields) {
    if (field in config) {
      const slots = config[field];

      // Must be array
      if (!Array.isArray(slots)) {
        return false;
      }

      // Check each slot value
      for (const slot of slots) {
        if (!validSlots.includes(slot as SlotValue)) {
          return false;
        }
      }

      // Max 3 slots
      if (slots.length > 3) {
        return false;
      }
    }
  }

  return true;
}
