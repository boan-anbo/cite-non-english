import { assert } from "chai";
import {
  createZoteroItemFromTestCase,
  extractCslEntryTexts,
  generateBibliography,
} from "./test-helpers";

// Synthetic example, not a bibliographic claim. The expected title slots follow
// the existing APA CJK expectations: romanization + [translation], no original.
// UQ's non-English-scripts example follows the same convention:
// https://guides.library.uq.edu.au/referencing/apa7/non-english-scripts
const HEBREW_BOOK = {
  itemType: "book" as const,
  title: "Catalog title",
  language: "he",
  date: "2025",
  publisher: "Example Press",
  creators: [
    { firstName: "David", lastName: "Levi", creatorType: "author" as const },
  ],
  extra: `cne-title-original: ספר לדוגמה
cne-title-romanized: Sefer ledugma
cne-title-english: An example book`,
};

describe("APA Hebrew title variants (#13)", function () {
  let item: Zotero.Item;

  before(async function () {
    item = await createZoteroItemFromTestCase(HEBREW_BOOK);
  });

  after(async function () {
    await item.eraseTx();
    await Zotero.Creators.purge();
  });

  it("keeps all variants in citation data for the style to select", function () {
    const csl = Zotero.Utilities.Item.itemToCSLJSON(item);
    assert.equal(csl["cne-title-original"], "ספר לדוגמה");
    assert.equal(csl["cne-title-romanized"], "Sefer ledugma");
    assert.equal(csl["cne-title-english"], "An example book");
  });

  it("renders Hebrew romanization and translation using the existing APA contract", async function () {
    const output = await generateBibliography(
      [item],
      "http://www.zotero.org/styles/apa-7th-cne",
    );
    assert.deepEqual(extractCslEntryTexts(output), [
      "Levi, D. (2025). Sefer ledugma [An example book]. Example Press.",
    ]);
    assert.include(output, "<i>Sefer ledugma</i> [An example book]");
    assert.notInclude(extractCslEntryTexts(output)[0], "ספר לדוגמה");
    assert.equal(item.getField("extra"), HEBREW_BOOK.extra);
    assert.equal(item.getField("title"), HEBREW_BOOK.title);
  });
});
