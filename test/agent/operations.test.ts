import { assert } from "chai";
import { CneMetadata } from "../../src/modules/cne/model/CneMetadata";
import {
  executeOperation,
  describeOperations,
} from "../../src/modules/cne/operations/catalog";
import { snapshot } from "../../src/modules/cne/operations/items";
import { createItem, edit, patch, rejectsCode } from "./helpers";
import { debouncedSave } from "../../src/modules/cne/section/handlers/saveHandler";

describe("CNE shared field operations", function () {
  this.timeout(15000);
  let item: Zotero.Item;

  beforeEach(async function () {
    item = await createItem();
  });

  afterEach(async function () {
    await item.eraseTx();
  });

  it("merges an agent's pinyin and a stale sidebar's translation, preserving Extra", async function () {
    const sidebar = new CneMetadata(item);
    await patch(item, [
      { path: "title.romanized", value: "Zhongguo lishi yanjiu" },
    ]);
    sidebar.setFieldVariant("title", "english", "Studies in Chinese history");
    await sidebar.save();
    const values = snapshot(item).values;
    assert.equal(values["title.romanized"], "Zhongguo lishi yanjiu");
    assert.equal(values["title.english"], "Studies in Chinese history");
    assert.include(String(item.getField("extra")), "Citation Key: keep-me");
    assert.include(
      String(item.getField("extra")),
      "cne-future-original: preserve-me",
    );
  });

  it("keeps unsaved text and rejects conflicting edits to the same field", async function () {
    const sidebar = new CneMetadata(item);
    sidebar.setFieldVariant("title", "romanized", "My reading");
    await patch(item, [{ path: "title.romanized", value: "Another reading" }]);
    sidebar.refresh();
    assert.include(sidebar.error!, "changed elsewhere");
    assert.equal(sidebar.data.title!.romanized, "My reading");
    await rejectsCode(sidebar.save(), "FIELD_CONFLICT");
    assert.equal(snapshot(item).values["title.romanized"], "Another reading");
  });

  it("rejects a stale agent revision even when its patch addresses a different field", async function () {
    const stale = edit(item, [{ path: "title.english", value: "History" }]);
    await patch(item, [{ path: "title.romanized", value: "Lishi" }]);
    await rejectsCode(
      executeOperation("items.patch", { edits: [stale] }),
      "REVISION_CONFLICT",
    );
    assert.notProperty(snapshot(item).values, "title.english");
  });

  it("guards the meaning of creator indices when a human reorders names", async function () {
    const sidebar = new CneMetadata(item);
    sidebar.setCreatorField(0, "lastRomanized", "Wang");
    item.setCreators([
      { firstName: "Ying", lastName: "Li", creatorType: "editor" },
    ]);
    await item.saveTx();
    await rejectsCode(sidebar.save(), "CREATORS_CHANGED");
    assert.notProperty(snapshot(item).values, "creators.0.lastRomanized");
  });

  it("fills only missing values, including preserving an explicit false option", async function () {
    await patch(item, [{ path: "creators.0.optionsForceComma", value: false }]);
    await patch(
      item,
      [
        { path: "title.original", value: "Do not replace" },
        { path: "creators.0.optionsForceComma", value: true },
        { path: "title.romanized", value: "Lishi" },
      ],
      "fillMissing",
    );
    assert.equal(snapshot(item).values["title.original"], "中国历史研究");
    assert.isFalse(snapshot(item).values["creators.0.optionsForceComma"]);
    assert.equal(snapshot(item).values["title.romanized"], "Lishi");
  });

  it("clears explicitly, preserving native language and unknown Extra fields", async function () {
    await patch(item, [{ path: "title.original", value: null }]);
    assert.notProperty(snapshot(item).values, "title.original");
    await patch(item, [
      { path: "series.english", value: "Series translation" },
    ]);
    const before = snapshot(item);
    await executeOperation("items.clear", {
      items: [{ item: before.item, expectedRevision: before.revision }],
    });
    assert.deepEqual(snapshot(item).values, { language: "zh-CN" });
    assert.include(
      String(item.getField("extra")),
      "cne-future-original: preserve-me",
    );
  });

  it("can clear metadata left behind after a creator was removed", async function () {
    await patch(item, [{ path: "creators.0.lastRomanized", value: "Wang" }]);
    item.setCreators([]);
    await item.saveTx();
    const before = snapshot(item);
    await executeOperation("items.clear", {
      items: [{ item: before.item, expectedRevision: before.revision }],
    });
    assert.deepEqual(snapshot(item).values, { language: "zh-CN" });
  });

  it("changes native language separately from the CNE creator override", async function () {
    await patch(item, [
      { path: "originalLanguage", value: "ja" },
      { path: "language", value: "zh-TW" },
    ]);
    assert.equal(item.getField("language"), "zh-TW");
    assert.equal(snapshot(item).values.originalLanguage, "ja");
  });

  for (const [name, changes, code] of [
    ["unknown fields", [{ path: "title.typo", value: "x" }], "INVALID_FIELD"],
    [
      "nonexistent creator",
      [{ path: "creators.1.lastRomanized", value: "x" }],
      "INVALID_CREATOR",
    ],
    [
      "empty string",
      [{ path: "title.romanized", value: "  " }],
      "INVALID_VALUE",
    ],
    [
      "multiline Extra insertion",
      [{ path: "title.romanized", value: "Lishi\ncne-title-english: bad" }],
      "INVALID_VALUE",
    ],
    [
      "wrong option type",
      [{ path: "creators.0.optionsForceComma", value: "true" }],
      "INVALID_VALUE",
    ],
    [
      "duplicate field",
      [
        { path: "title.romanized", value: "A" },
        { path: "title.romanized", value: "B" },
      ],
      "INVALID_PATCH",
    ],
  ] as const) {
    const testName = `rejects ${name} without changing the item`;

    it(testName, async function () {
      const before = snapshot(item);
      await rejectsCode(patch(item, [...changes]), code);
      assert.deepEqual(snapshot(item), before);
    });
  }

  it("validates all entries before an atomic batch changes any item", async function () {
    const other = await createItem();
    try {
      const before = snapshot(item);
      const stale = edit(other, [{ path: "title.english", value: "Other" }]);
      await patch(other, [{ path: "title.romanized", value: "Changed" }]);
      await rejectsCode(
        executeOperation("items.patch", {
          edits: [
            edit(item, [{ path: "title.english", value: "History" }]),
            stale,
          ],
        }),
        "REVISION_CONFLICT",
      );
      assert.deepEqual(snapshot(item), before);
    } finally {
      await other.eraseTx();
    }
  });

  it("retains keystrokes entered while a save waits for the database", async function () {
    const sidebar = new CneMetadata(item);
    let release!: () => void;
    let entered!: () => void;
    const ready = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const holding = Zotero.DB.executeTransaction(async () => {
      entered();
      await gate;
    });
    await ready;
    sidebar.setFieldVariant("title", "english", "First draft");
    const saving = sidebar.save();
    sidebar.setFieldVariant("title", "english", "Still typing");
    release();
    await holding;
    await saving;
    assert.equal(sidebar.data.title!.english, "Still typing");
    assert.isTrue(sidebar.hasPendingChanges());
    await sidebar.save();
    assert.equal(snapshot(item).values["title.english"], "Still typing");
  });

  it("does not cancel another item's sidebar autosave", async function () {
    const other = await createItem();
    try {
      const first = new CneMetadata(item),
        second = new CneMetadata(other);
      first.setFieldVariant("title", "english", "First");
      second.setFieldVariant("title", "english", "Second");
      debouncedSave(first);
      debouncedSave(second);
      await Zotero.Promise.delay(1200);
      assert.equal(snapshot(item).values["title.english"], "First");
      assert.equal(snapshot(other).values["title.english"], "Second");
    } finally {
      await other.eraseTx();
    }
  });

  it("discovers and reads through the same catalog, rejecting undeclared input", async function () {
    const discovery = describeOperations();
    assert.include(discovery.fields.text, "series.english");
    assert.isAtLeast(discovery.operations.length, 8);
    const result = await executeOperation("items.read", {
      items: [snapshot(item).item],
    });
    assert.deepEqual(result, [snapshot(item)]);
    await rejectsCode(
      executeOperation("items.read", {
        items: [snapshot(item).item],
        typo: true,
      }),
      "INVALID_INPUT",
    );
    await rejectsCode(
      executeOperation("items.patch", {
        edits: [{ item: snapshot(item).item, changes: [] }],
      }),
      "INVALID_INPUT",
    );
  });

  it("loads complete item data even when only a primary-data cache entry exists", async function () {
    const before = snapshot(item);
    const id = item.id;
    Zotero.Items.unload(id);
    item = await Zotero.Items.getAsync(id);
    const result = await executeOperation("items.read", {
      items: [before.item],
    });
    assert.deepEqual(result, [before]);
  });

  it("validates an unsaved proposal without writing, and reports only effective changes", async function () {
    const before = snapshot(item);
    const result = (await executeOperation("items.validate", {
      edits: [edit(item, [{ path: "title.romanized", value: "Lishi" }])],
    })) as any;
    assert.equal(result[0].values["title.romanized"], "Lishi");
    assert.deepEqual(result[0].changes, [
      { path: "title.romanized", value: "Lishi" },
    ]);
    assert.deepEqual(snapshot(item), before);
  });

  it("searches within a library and supports bounded pages", async function () {
    const result = (await executeOperation("items.search", {
      libraryID: item.libraryID,
      query: "中国历史研究",
      limit: 1,
    })) as any;
    assert.isAtLeast(result.total, 1);
    assert.lengthOf(result.items, 1);
    assert.equal(result.items[0].native.title, "中国历史研究");
  });
});
