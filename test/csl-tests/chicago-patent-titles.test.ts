import { assert } from "chai";
import {
  CHICAGO_STYLES,
  installRetainedChicagoStyles,
} from "./chicago-test-helpers";
import {
  extractCslEntryTexts,
  generateBibliography,
  generateSequentialCitationNotes,
} from "./test-helpers";

describe("Chicago native patent short titles", function () {
  const created: Zotero.Item[] = [];

  before(async function () {
    await installRetainedChicagoStyles();
    // Deliberately opposing full/short order exposes sort-key consequences.
    for (const [title, shortTitle] of [
      ["zebra full patent title", "alpha short patent title"],
      ["alpha full patent title", "zebra short patent title"],
    ]) {
      const item = new Zotero.Item("patent");
      item.setField("title", title);
      item.setField("shortTitle", shortTitle);
      item.setField("language", "en-US");
      item.setField("issueDate", "2025");
      await item.saveTx();
      created.push(item);
    }
  });

  after(async function () {
    await Promise.all(created.map((item) => item.eraseTx()));
  });

  for (const name of CHICAGO_STYLES) {
    const testName = `${name}: preserves upstream short-title selection and sorted output`;

    it(testName, async function () {
      const upstreamId = `http://www.zotero.org/styles/${name}`;
      const styleId = `${upstreamId}-cne`;
      assert.deepEqual(
        extractCslEntryTexts(await generateBibliography(created, styleId)),
        extractCslEntryTexts(await generateBibliography(created, upstreamId)),
      );
      for (const item of created) {
        const output = await generateBibliography([item], styleId);
        assert.include(
          output,
          String(item.getField("shortTitle")).replace(/^./, (letter) =>
            letter.toUpperCase(),
          ),
        );
        assert.notInclude(output, "full patent title");
        assert.deepEqual(
          await generateSequentialCitationNotes(item, styleId),
          await generateSequentialCitationNotes(item, upstreamId),
        );
      }
    });
  }
});
