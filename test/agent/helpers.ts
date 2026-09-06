import { assert } from "chai";
import { snapshot } from "../../src/modules/cne/operations/items";
import { executeOperation } from "../../src/modules/cne/operations/catalog";
import type { Change } from "../../src/modules/cne/operations/values";

export async function createItem() {
  const item = new Zotero.Item("book");
  item.setField("title", "中国历史研究");
  item.setField("language", "zh-CN");
  item.setField("date", "2025");
  item.setField("publisher", "Example Press");
  item.setField(
    "extra",
    "Citation Key: keep-me\ncne-future-original: preserve-me\ncne-title-original: 中国历史研究",
  );
  item.setCreators([
    { lastName: "王", firstName: "小波", creatorType: "author" },
  ]);
  await item.saveTx();
  return item;
}

export function edit(item: Zotero.Item, changes: Change[]) {
  const current = snapshot(item);
  return { item: current.item, expectedRevision: current.revision, changes };
}

export async function patch(
  item: Zotero.Item,
  changes: Change[],
  mode = "replace",
) {
  return executeOperation("items.patch", {
    edits: [{ ...edit(item, changes), mode }],
  });
}

export async function rejectsCode(operation: Promise<unknown>, code: string) {
  try {
    await operation;
  } catch (error) {
    assert.equal((error as { code: string }).code, code);
    return;
  }
  assert.fail(`Expected ${code}`);
}
