import { parseCNEMetadata } from "../metadata-parser";
import { CneError } from "./errors";
import { toValues, type Values } from "./values";

export interface ItemRef {
  libraryID: number;
  key: string;
}
export interface ItemSnapshot {
  item: ItemRef;
  revision: string;
  editable: boolean;
  native: Record<string, unknown>;
  values: Values;
}

export function requireItem(
  item: Zotero.Item | false,
  ref?: ItemRef,
): asserts item is Zotero.Item {
  if (!item || !item.id || item.deleted || !item.isRegularItem()) {
    throw new CneError(
      "ITEM_NOT_FOUND",
      "A saved, non-deleted bibliographic item is required.",
      404,
      ref ? { item: ref } : undefined,
    );
  }
}

export async function resolveItem(ref: ItemRef): Promise<Zotero.Item> {
  const item = await Zotero.Items.getByLibraryAndKeyAsync(
    ref.libraryID,
    ref.key,
  );
  requireItem(item, ref);
  await item.loadAllData();
  return item;
}

export async function snapshotItems(
  items: Zotero.Item[],
): Promise<ItemSnapshot[]> {
  await Zotero.Items.loadDataTypes(items);
  return items.map(snapshot);
}

export function snapshot(item: Zotero.Item): ItemSnapshot {
  requireItem(item);
  const json = item.toJSON();
  const extra = String(item.getField("extra") || "");
  const native = { ...json };
  delete native.extra;
  // A content revision, independent of Zotero's sync version and wall-clock resolution.
  // MD5 here is only a change detector; it is never an authorization credential.
  const revision = Zotero.Utilities.Internal.md5(JSON.stringify(json));
  return {
    item: { libraryID: item.libraryID, key: item.key },
    revision,
    editable: item.isEditable(),
    native,
    values: toValues(
      parseCNEMetadata(extra),
      String(item.getField("language") || ""),
    ),
  };
}

export function checkRevision(current: ItemSnapshot, expected: string): void {
  if (current.revision !== expected) {
    throw new CneError(
      "REVISION_CONFLICT",
      "The item changed. Read it again and review changed fields and creator order before retrying.",
      409,
      { current },
    );
  }
}
