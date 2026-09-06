import { assert } from "chai";
import { executeOperation } from "../../src/modules/cne/operations/catalog";
import { listStyles } from "../../src/modules/cne/operations/preview";
import { snapshot } from "../../src/modules/cne/operations/items";
import { createItem, edit, patch } from "./helpers";
import { generateBibliography } from "../csl-tests/test-helpers";

const changes = [
  { path: "title.romanized", value: "Zhongguo lishi yanjiu" },
  { path: "title.english", value: "Studies in Chinese history" },
  { path: "creators.0.lastRomanized", value: "Wang" },
  { path: "creators.0.firstRomanized", value: "Xiaobo" },
];

describe("CNE unsaved citation preview", function () {
  this.timeout(30000);
  let item: Zotero.Item;

  beforeEach(async function () {
    item = await createItem();
  });

  afterEach(async function () {
    await item.eraseTx();
  });

  it("renders proposed pinyin exactly as saved data across all bundled styles, without transient writes", async function () {
    const styles = listStyles().filter((style) => style.id.endsWith("-cne"));
    assert.isAtLeast(styles.length, 7);
    const before = snapshot(item);
    const notifications: unknown[] = [];
    const observer = Zotero.Notifier.registerObserver(
      {
        notify: (event, type, ids) => {
          if (type === "item" && ids.map(Number).includes(item.id))
            notifications.push(event);
        },
      },
      ["item"],
    );
    const previews = new Map<string, any>();
    try {
      for (const style of styles) {
        const result = (await executeOperation("items.preview", {
          ...edit(item, changes),
          styleID: style.id,
        })) as any;
        assert.isString(result.citation);
        assert.isString(result.subsequentCitation);
        previews.set(style.id, result);
      }
      assert.deepEqual(snapshot(item), before);
      assert.isEmpty(notifications);
    } finally {
      Zotero.Notifier.unregisterObserver(observer);
    }
    await patch(item, changes);
    for (const style of styles) {
      const saved = (await executeOperation("items.preview", {
        item: snapshot(item).item,
        expectedRevision: snapshot(item).revision,
        styleID: style.id,
      })) as any;
      assert.equal(saved.citation, previews.get(style.id).citation, style.id);
      assert.equal(
        saved.subsequentCitation,
        previews.get(style.id).subsequentCitation,
        style.id,
      );
      assert.equal(
        saved.bibliography,
        previews.get(style.id).bibliography,
        style.id,
      );
      if (style.forms.includes("bibliography"))
        assert.equal(
          saved.bibliography,
          await generateBibliography([item], style.id),
        );
    }
    assert.include(
      previews.get("http://www.zotero.org/styles/apa-7th-cne").bibliography,
      "Zhongguo lishi yanjiu",
    );
  });

  it("returns plain text through the real engine and leaves its HTML output independent", async function () {
    const input = {
      ...edit(item, changes),
      styleID: "http://www.zotero.org/styles/apa-7th-cne",
    };
    const plain = (await executeOperation("items.preview", {
      ...input,
      format: "text",
    })) as any;
    const html = (await executeOperation("items.preview", {
      ...input,
      format: "html",
    })) as any;
    assert.include(plain.bibliography, "Zhongguo lishi yanjiu");
    assert.notInclude(plain.bibliography, "<i>");
    assert.include(html.bibliography, "<i>");
  });
});
