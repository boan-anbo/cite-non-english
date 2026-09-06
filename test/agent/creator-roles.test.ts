import { assert } from "chai";
import { createItem, patch } from "./helpers";

describe("CNE creator identity across CSL role grouping", function () {
  it("keeps metadata on the correct creator when roles are interleaved", async function () {
    const item = await createItem();
    try {
      item.setCreators([
        { lastName: "王", firstName: "小波", creatorType: "author" },
        { lastName: "李", firstName: "英", creatorType: "editor" },
        { lastName: "陈", firstName: "明", creatorType: "author" },
      ]);
      await item.saveTx();
      await patch(item, [
        { path: "creators.0.lastRomanized", value: "Wang" },
        { path: "creators.1.lastRomanized", value: "Li" },
        { path: "creators.2.lastRomanized", value: "Chen" },
      ]);
      const csl = Zotero.Utilities.Item.itemToCSLJSON(item);
      assert.equal(csl.author[0].multi._key.en.family, "Wang");
      assert.equal(csl.author[1].multi._key.en.family, "Chen");
      assert.equal(csl.editor[0].multi._key.en.family, "Li");
    } finally {
      await item.eraseTx();
    }
  });
});
