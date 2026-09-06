import type {
  CneMetadataData,
  CneFieldName,
  FieldVariant,
  CneCreatorData,
} from "../types";
import { SUPPORTED_FIELDS } from "../constants";
import { snapshot, type ItemSnapshot } from "../operations/items";
import {
  applyChanges,
  diffValues,
  fromValues,
  toValues,
} from "../operations/values";
import { planEdit, saveEdits } from "../operations/write";

/** A sidebar draft over the same field operations used by agent adapters. */
export class CneMetadata {
  public data: CneMetadataData;
  public language: string;
  public error: string | null = null;
  private base: ItemSnapshot;
  private saving = false;
  private listeners = new Set<() => void>();

  constructor(private item: Zotero.Item) {
    this.base = snapshot(item);
    this.data = fromValues(this.base.values);
    this.language = String(this.base.values.language ?? "");
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
  private values() {
    return toValues(this.data, this.language);
  }
  private adopt(base: ItemSnapshot, values = base.values): void {
    this.base = base;
    this.data = fromValues(values);
    this.language = String(values.language ?? "");
    this.error = null;
    this.notify();
  }

  public async save(): Promise<void> {
    if (this.saving) return;
    const submitted = this.values();
    this.saving = true;
    try {
      const [result] = await saveEdits([
        {
          item: this.item,
          base: this.base,
          changes: diffValues(this.base.values, submitted),
        },
      ]);
      // Keep keystrokes entered while the database transaction was pending.
      const later = diffValues(submitted, this.values());
      this.adopt(
        result.current,
        applyChanges(result.current.values, later, "replace"),
      );
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Could not save CNE metadata.";
      this.notify();
      throw error;
    } finally {
      this.saving = false;
    }
  }

  /** Merge external changes while keeping local edits and their conflict baseline. */
  public refresh(): void {
    if (this.saving) return;
    try {
      const plan = planEdit({
        item: this.item,
        base: this.base,
        changes: diffValues(this.base.values, this.values()),
      });
      this.adopt(plan.before, plan.values);
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "The item changed elsewhere.";
      this.notify();
    }
  }

  /** Explicitly discard the draft and read saved values. */
  public reload(): void {
    this.adopt(snapshot(this.item));
  }
  public hasPendingChanges(): boolean {
    return diffValues(this.base.values, this.values()).length > 0;
  }
  public hasData(): boolean {
    return Object.keys(toValues(this.data)).length > 0;
  }
  public clear(): void {
    this.data = {};
  }
  public getItem(): Zotero.Item {
    return this.item;
  }
  public toJSON(): CneMetadataData {
    return fromValues(toValues(this.data));
  }
  public getFieldVariant(
    field: CneFieldName,
    variant: FieldVariant,
  ): string | undefined {
    return this.data[field]?.[variant];
  }
  public setFieldVariant(
    field: CneFieldName,
    variant: FieldVariant,
    value: string,
  ): void {
    (this.data[field] ??= {})[variant] = value || undefined;
  }
  public setCreatorField(
    index: number,
    key: keyof CneCreatorData,
    value: string | boolean,
  ): void {
    const creator = ((this.data.authors ??= [])[index] ??= {});
    Object.assign(creator, { [key]: value === "" ? undefined : value });
  }
  public hasFieldData(field: CneFieldName): boolean {
    return Object.values(this.data[field] ?? {}).some(Boolean);
  }
  public getFilledFieldCount(): number {
    return SUPPORTED_FIELDS.filter(({ name }) => this.hasFieldData(name))
      .length;
  }
}
