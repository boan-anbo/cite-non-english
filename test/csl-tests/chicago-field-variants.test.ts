import { assert } from "chai";
import { CHICAGO_STYLES } from "./chicago-test-helpers";
import {
  generateBibliography,
  generateSequentialCitationNotes,
} from "./test-helpers";

describe("Chicago explicit CNE field variants", function () {
  const created: Zotero.Item[] = [];

  after(async function () {
    await Promise.all(created.map((item) => item.eraseTx()));
  });

  // These field selectors exist in the two notes variants. Author-date has
  // native field rendering here and is covered by the upstream comparisons.
  for (const name of CHICAGO_STYLES.filter(
    (style) => style !== "chicago-author-date",
  )) {
    const styleId = `http://www.zotero.org/styles/${name}-cne`;

    for (const variant of ["original", "romanized"]) {
      const testName = `${name}: preserves ${variant} publisher and series casing and priority`;

      it(testName, async function () {
        const item = new Zotero.Item("book");
        item.setField("title", "A Book Title");
        item.setField("language", "en-US");
        item.setField("publisher", "Native Publisher");
        item.setField("series", "Native Series");
        const extra = [
          "cne-publisher-original: original publisher",
          "cne-series-original: original series",
        ];
        if (variant === "romanized") {
          extra.push("cne-publisher-romanized: romanized publisher");
          extra.push("cne-series-romanized: romanized series");
        }
        item.setField("extra", extra.join("\n"));
        await item.saveTx();
        created.push(item);

        const outputs = [await generateBibliography([item], styleId)];
        if (name === "chicago-notes-bibliography") {
          outputs.push(
            (await generateSequentialCitationNotes(item, styleId))[0],
          );
        }
        for (const output of outputs) {
          assert.include(output, `${variant} publisher`);
          assert.include(output, `${variant} series`);
          assert.notInclude(output, "Native Publisher");
          assert.notInclude(output, "Native Series");
          if (variant === "romanized") {
            assert.notInclude(output, "original publisher");
            assert.notInclude(output, "original series");
          }
        }
        assert.equal(item.getField("extra"), extra.join("\n"));
      });
    }

    for (const container of [false, true]) {
      const testName = `${name}: preserves ${container ? "container over journal" : "journal"} romanization`;

      it(testName, async function () {
        const item = new Zotero.Item("journalArticle");
        item.setField("title", "An Article Title");
        item.setField("language", "en-US");
        item.setField("publicationTitle", "Native Journal");
        const extra = [
          "cne-journal-romanized: Zhongguo shehui kexue",
          "cne-journal-original: 中国社会科学",
        ];
        if (container) {
          extra.push("cne-container-title-romanized: Selected container title");
          extra.push("cne-container-title-original: 所选刊名");
        }
        item.setField("extra", extra.join("\n"));
        await item.saveTx();
        created.push(item);

        const outputs = [await generateBibliography([item], styleId)];
        if (name === "chicago-notes-bibliography") {
          outputs.push(
            (await generateSequentialCitationNotes(item, styleId))[0],
          );
        }
        for (const output of outputs) {
          assert.include(
            output,
            container ? "Selected container title" : "Zhongguo shehui kexue",
          );
          assert.notInclude(output, "Native Journal");
          if (container) assert.notInclude(output, "Zhongguo shehui kexue");
        }
      });
    }
  }
});
