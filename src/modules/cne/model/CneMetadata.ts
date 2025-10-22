/**
 * Main data model for non-English citation metadata
 * Acts as the single source of truth for all non-English field data
 */

import type { CneMetadataData, CneFieldName, FieldVariant } from "../types";
import { parseCNEMetadata, serializeToExtra } from "../metadata-parser";

/**
 * CneMetadata class
 * Manages non-English citation metadata for a Zotero item
 * Provides loading, saving, and data binding support
 */
export class CneMetadata {
  /**
   * The Zotero item this metadata belongs to
   */
  private item: Zotero.Item;

  /**
   * The metadata data object
   * This is the single source of truth that UI elements bind to
   */
  public data: CneMetadataData;

  /**
   * Create a new CneMetadata instance
   * @param item - The Zotero item to manage metadata for
   */
  constructor(item: Zotero.Item) {
    this.item = item;
    this.data = this.load();
  }

  /**
   * Load non-English metadata from the item's Extra field
   * @returns Parsed metadata data
   */
  private load(): CneMetadataData {
    try {
      const extraContent = this.item.getField("extra") as string;
      return parseCNEMetadata(extraContent || "");
    } catch (error) {
      ztoolkit.log("Error loading non-English metadata:", error);
      return {};
    }
  }

  /**
   * Save current non-English metadata back to the item's Extra field
   * Preserves non-non-English content in the Extra field
   * @returns Promise that resolves when save is complete
   */
  public async save(): Promise<void> {
    try {
      const currentExtra = (this.item.getField("extra") as string) || "";
      const updatedExtra = serializeToExtra(currentExtra, this.data);

      this.item.setField("extra", updatedExtra);
      await this.item.saveTx();

      ztoolkit.log("non-English metadata saved successfully");
    } catch (error) {
      ztoolkit.log("Error saving non-English metadata:", error);
      throw error;
    }
  }

  /**
   * Reload metadata from the item's Extra field
   * Useful when the Extra field has been modified externally
   */
  public reload(): void {
    this.data = this.load();
  }

  /**
   * Check if this item has any non-English metadata
   * @returns true if any non-English fields have values
   */
  public hasData(): boolean {
    // Check if original language is set
    if (this.data.originalLanguage) {
      return true;
    }

    // Check if any field has data
    const fields: CneFieldName[] = [
      "title",
      "container-title",
      "publisher",
      "journal",
    ];
    for (const fieldName of fields) {
      const fieldData = this.data[fieldName];
      if (fieldData) {
        // Check if any variant has a value
        if (
          fieldData.original ||
          fieldData.romanized ||
          fieldData.romanizedShort ||
          fieldData.english
        ) {
          return true;
        }
      }
    }

    // Check if any author has data
    if (this.data.authors && this.data.authors.length > 0) {
      for (const author of this.data.authors) {
        if (author && (author.lastOriginal || author.firstOriginal)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Clear all non-English metadata
   * Sets all fields to empty/undefined
   */
  public clear(): void {
    this.data = {
      title: undefined,
      "container-title": undefined,
      publisher: undefined,
      journal: undefined,
      originalLanguage: undefined,
    };
  }

  /**
   * Get the item this metadata belongs to
   */
  public getItem(): Zotero.Item {
    return this.item;
  }

  /**
   * Export metadata as a plain object (for debugging/logging)
   */
  public toJSON(): CneMetadataData {
    return { ...this.data };
  }

  /**
   * Get a specific field variant value
   * @param field - Field name (e.g., 'title')
   * @param variant - Variant type ('original', 'romanized', 'romanized-short', 'english')
   * @returns The field value or undefined
   */
  public getFieldVariant(
    field: CneFieldName,
    variant: FieldVariant,
  ): string | undefined {
    const fieldData = this.data[field];
    return fieldData?.[variant];
  }

  /**
   * Set a specific field variant value
   * @param field - Field name
   * @param variant - Variant type
   * @param value - Value to set (empty string clears it)
   */
  public setFieldVariant(
    field: CneFieldName,
    variant: FieldVariant,
    value: string,
  ): void {
    if (!this.data[field]) {
      this.data[field] = {};
    }
    this.data[field]![variant] = value || undefined;
  }

  /**
   * Check if a specific field has any data
   * @param field - Field name to check
   * @returns true if the field has any variant with data
   */
  public hasFieldData(field: CneFieldName): boolean {
    const fieldData = this.data[field];
    if (!fieldData) return false;

    return !!(
      fieldData.original ||
      fieldData.romanized ||
      fieldData.romanizedShort ||
      fieldData.english
    );
  }

  /**
   * Get count of fields with data
   * @returns Number of fields that have at least one variant filled
   */
  public getFilledFieldCount(): number {
    const fields: CneFieldName[] = [
      "title",
      "container-title",
      "publisher",
      "journal",
    ];
    return fields.filter((field) => this.hasFieldData(field)).length;
  }
}
