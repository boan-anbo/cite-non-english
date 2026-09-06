import { serializeToExtra } from "../metadata-parser";
import { CneError } from "./errors";
import { checkRevision, snapshot, type ItemSnapshot } from "./items";
import {
  applyChanges,
  diffValues,
  fromValues,
  validateChanges,
  type Change,
  type PatchMode,
} from "./values";

export interface Edit {
  item: Zotero.Item;
  changes: Change[];
  expectedRevision?: string;
  base?: ItemSnapshot;
  mode?: PatchMode;
}

export function planEdit(edit: Edit) {
  const before = snapshot(edit.item);
  if (edit.expectedRevision !== undefined)
    checkRevision(before, edit.expectedRevision);
  let changes: Change[];
  try {
    changes = validateChanges(edit.changes, edit.item.getCreators().length);
  } catch (error) {
    if (error instanceof CneError)
      error.details = { ...error.details, item: before.item };
    throw error;
  }
  if (edit.base) {
    if (
      changes.some(({ path }) => path.startsWith("creators.")) &&
      JSON.stringify(before.native.creators) !==
        JSON.stringify(edit.base.native.creators)
    ) {
      throw new CneError(
        "CREATORS_CHANGED",
        "Creators changed. Review the names before saving.",
        409,
        { current: before },
      );
    }
    const conflicts = changes
      .filter(
        ({ path, value }) =>
          before.values[path] !== edit.base!.values[path] &&
          (before.values[path] ?? null) !== value,
      )
      .map(({ path }) => path);
    if (conflicts.length)
      throw new CneError(
        "FIELD_CONFLICT",
        "These fields changed elsewhere. Review them before saving.",
        409,
        { paths: conflicts, current: before },
      );
  }
  const values = applyChanges(before.values, changes, edit.mode ?? "replace");
  return { before, values, changes: diffValues(before.values, values) };
}

/** One transaction: validate the entire batch before touching any live item. */
export async function saveEdits(edits: Edit[]) {
  const seen = new Set<number>();
  for (const { item } of edits) {
    if (seen.has(item.id))
      throw new CneError(
        "DUPLICATE_ITEM",
        "An item can appear only once in a batch. Combine its changes into one edit.",
        400,
        { item: { libraryID: item.libraryID, key: item.key } },
      );
    seen.add(item.id);
  }
  const touched = new Set<Zotero.Item>();
  try {
    return await Zotero.DB.executeTransaction(async () => {
      const plans = edits.map((edit) => {
        const plan = planEdit(edit);
        if (!plan.before.editable)
          throw new CneError(
            "READ_ONLY",
            "This library does not allow item edits.",
            403,
            { item: plan.before.item },
          );
        return plan;
      });
      for (let i = 0; i < edits.length; i++) {
        const { item } = edits[i];
        const { values, changes } = plans[i];
        if (!changes.length) continue;
        checkRevision(snapshot(item), plans[i].before.revision);
        touched.add(item);
        if (changes.some(({ path }) => path !== "language")) {
          item.setField(
            "extra",
            serializeToExtra(
              String(item.getField("extra") || ""),
              fromValues(values),
            ),
          );
        }
        if (changes.some(({ path }) => path === "language"))
          item.setField("language", String(values.language ?? ""));
        await item.save();
      }
      return edits.map(({ item }, index) => ({
        beforeRevision: plans[index].before.revision,
        changes: plans[index].changes,
        current: snapshot(item),
      }));
    });
  } catch (error) {
    // Zotero rolls back SQL, but successful earlier saves in the batch have
    // already updated cached Item objects. Restore those from committed storage.
    for (const item of touched)
      await item.reload(["primaryData", "itemData", "creators"], true);
    throw error;
  }
}
