import { assert } from "chai";
import {
  createZoteroItemFromTestCase,
  extractCslEntryTexts,
  generateBibliography,
  generateSequentialCitationNotes,
} from "./test-helpers";

const CHICAGO_STYLES = [
  "chicago-notes-bibliography",
  "chicago-shortened-notes-bibliography",
  "chicago-author-date",
] as const;

// Existing English fixtures exercise creator formatting with already-cased
// titles. These sentence-case inputs exercise native-title formatting.
const ARTICLE = {
  itemType: "journalArticle" as const,
  title:
    "Positive and problematic aspects of modernistic engaged Buddhism in light of the history of Buddhist adaptation to cultures",
  shortTitle: "Positive and problematic aspects",
  publicationTitle: "Journal of Buddhist Ethics",
  volume: "32",
  pages: "131-157",
  date: "2025",
  language: "en-US",
  creators: [
    {
      firstName: "John",
      lastName: "Makransky",
      creatorType: "author" as const,
    },
  ],
  extra: "",
};

const TITLE_CASE =
  "Positive and Problematic Aspects of Modernistic Engaged Buddhism in Light of the History of Buddhist Adaptation to Cultures";

describe("Chicago native title casing", function () {
  this.timeout(30000);
  const created: Zotero.Item[] = [];
  let article: Zotero.Item;

  before(async function () {
    article = await createZoteroItemFromTestCase(ARTICLE);
    created.push(article);
    let root = Zotero.DataDirectory.dir;
    for (let level = 0; level < 3; level++) {
      const parent = PathUtils.parent(root);
      if (!parent) throw new Error("Missing CSL test project root");
      root = parent;
    }
    for (const name of CHICAGO_STYLES) {
      await IOUtils.copy(
        PathUtils.join(root, "styles", "templates", `${name}-template.csl`),
        PathUtils.join(Zotero.DataDirectory.dir, "styles", `${name}.csl`),
      );
    }
    await Zotero.Styles.reinit();
  });

  after(async function () {
    await Promise.all(created.map((item) => item.eraseTx()));
    await Zotero.Creators.purge();
  });

  for (const name of CHICAGO_STYLES) {
    const styleId = `http://www.zotero.org/styles/${name}-cne`;

    describe(name, function () {
      it("title-cases the English article reported in #17", async function () {
        const output = await generateBibliography([article], styleId);
        assert.include(output, TITLE_CASE);
        assert.notInclude(output, ARTICLE.title);
      });

      // Compare against the retained upstream template, not newly generated
      // expectations. Include types where Chicago deliberately avoids title case.
      for (const itemType of [
        "book",
        "journalArticle",
        "blogPost",
        "forumPost",
        "patent",
        "case",
        "encyclopediaArticle",
      ] as const) {
        const testName = `preserves upstream casing for native ${itemType} titles`;

        it(testName, async function () {
          const item = new Zotero.Item(itemType);
          item.setField(
            "title",
            "a study of modern Buddhism: evidence and context",
          );
          item.setField("language", "en-US");
          if (itemType === "encyclopediaArticle") {
            item.setField("encyclopediaTitle", "Reference Encyclopedia");
          }
          await item.saveTx();
          created.push(item);

          const engine = Zotero.Styles.get(
            `http://www.zotero.org/styles/${name}`,
          ).getCiteProc("en-US", "html");
          engine.updateItems([item.id]);
          const expected = Zotero.Cite.makeFormattedBibliography(
            engine,
            "html",
          );
          const actual = await generateBibliography([item], styleId);
          assert.deepEqual(
            extractCslEntryTexts(actual),
            extractCslEntryTexts(expected),
          );
        });
      }

      for (const language of ["en", "English", "fr"]) {
        const testName = `preserves upstream behavior for language ${language}`;

        it(testName, async function () {
          const item = await createZoteroItemFromTestCase({
            ...ARTICLE,
            language,
          });
          created.push(item);
          const engine = Zotero.Styles.get(
            `http://www.zotero.org/styles/${name}`,
          ).getCiteProc("en-US", "html");
          engine.updateItems([item.id]);
          const expected = Zotero.Cite.makeFormattedBibliography(
            engine,
            "html",
          );
          const actual = await generateBibliography([item], styleId);
          assert.deepEqual(
            extractCslEntryTexts(actual),
            extractCslEntryTexts(expected),
          );
        });
      }

      it("preserves explicitly entered CNE romanization even with English item language", async function () {
        const item = await createZoteroItemFromTestCase({
          ...ARTICLE,
          extra:
            "cne-title-romanized: Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu",
        });
        created.push(item);
        const output = await generateBibliography([item], styleId);
        assert.include(
          output,
          "Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu",
        );
      });

      if (name !== "chicago-author-date") {
        const fullFirstNote = name === "chicago-notes-bibliography";

        it("title-cases native shortened notes", async function () {
          const [first, subsequent] = await generateSequentialCitationNotes(
            article,
            styleId,
            "en-US",
            ["132", "133"],
          );
          assert.include(subsequent, "Positive and Problematic Aspects");
          if (fullFirstNote) {
            assert.include(first, TITLE_CASE);
          } else {
            assert.include(first, "Positive and Problematic Aspects");
          }
        });
      }
    });
  }
});
