import { assert } from "chai";
import { executeOperation } from "../../src/modules/cne/operations/catalog";
import { snapshot } from "../../src/modules/cne/operations/items";
import { createItem, edit, patch, rejectsCode } from "./helpers";

describe("CNE transaction boundaries", function () {
  this.timeout(15000);

  it("restores both database and cached items if a later save fails", async function () {
    const first = await createItem(),
      second = await createItem();
    const before = [snapshot(first), snapshot(second)];
    // An actual SQLite failure after the first save, rather than a mocked service.
    await Zotero.DB.queryAsync(
      `CREATE TEMP TRIGGER cne_test_abort BEFORE UPDATE ON items WHEN NEW.itemID = ${second.id} BEGIN SELECT RAISE(ABORT, 'CNE test rollback'); END`,
    );
    try {
      let failed = false;
      try {
        await executeOperation("items.patch", {
          edits: [
            edit(first, [{ path: "title.romanized", value: "First" }]),
            edit(second, [{ path: "title.romanized", value: "Second" }]),
          ],
        });
      } catch {
        failed = true;
      }
      assert.isTrue(failed);
      assert.deepEqual([snapshot(first), snapshot(second)], before);
      await first.reload(["primaryData", "itemData"], true);
      await second.reload(["primaryData", "itemData"], true);
      assert.deepEqual([snapshot(first), snapshot(second)], before);
    } finally {
      await Zotero.DB.queryAsync("DROP TRIGGER cne_test_abort");
      await first.eraseTx();
      await second.eraseTx();
    }
  });

  it("rejects writes to a read-only group library", async function () {
    try {
      const group = new Zotero.Group({
        groupID: 938471,
        name: "CNE access fixture",
        description: "Disposable test library",
        version: 1,
      });
      group.editable = true;
      group.filesEditable = true;
      await group.saveTx();
      const item = new Zotero.Item("book");
      item.libraryID = group.libraryID;
      item.setField("title", "Read-only fixture");
      await item.saveTx();
      try {
        group.editable = false;
        await group.saveTx();
        assert.isFalse(snapshot(item).editable);
        await rejectsCode(
          patch(item, [{ path: "title.romanized", value: "Forbidden" }]),
          "READ_ONLY",
        );
      } finally {
        await group.eraseTx();
      }
    } catch (error) {
      assert.fail(`Group fixture: ${String(error)}`);
    }
  });
});
