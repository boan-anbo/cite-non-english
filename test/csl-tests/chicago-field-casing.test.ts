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

const SCENARIOS = [
  {
    type: "journalArticle",
    field: "publicationTitle",
    value: "Journal of Buddhist ethics",
  },
  {
    type: "bookSection",
    field: "bookTitle",
    value: "History of modern Buddhism",
  },
  { type: "book", field: "series", value: "Studies in modern religion" },
  { type: "book", field: "publisher", value: "example university press" },
] as const;

describe("Chicago native field casing", function () {
  this.timeout(30000);
  const created: Zotero.Item[] = [];

  before(installRetainedChicagoStyles);

  after(async function () {
    await Promise.all(created.map((item) => item.eraseTx()));
    await Zotero.Creators.purge();
  });

  for (const name of CHICAGO_STYLES) {
    const upstreamId = `http://www.zotero.org/styles/${name}`;
    const styleId = `${upstreamId}-cne`;

    for (const scenario of SCENARIOS) {
      const testName = `${name}: native ${scenario.field} matches upstream in bibliography and citations`;

      it(testName, async function () {
        const item = new Zotero.Item(scenario.type);
        item.setField("title", "A Study of Modern Buddhism");
        item.setField("language", "en-US");
        item.setField("date", "2025");
        item.setField(scenario.field, scenario.value);
        item.setCreators([
          { firstName: "John", lastName: "Makransky", creatorType: "author" },
        ]);
        await item.saveTx();
        created.push(item);

        assert.deepEqual(
          extractCslEntryTexts(await generateBibliography([item], styleId)),
          extractCslEntryTexts(await generateBibliography([item], upstreamId)),
        );
        assert.deepEqual(
          await generateSequentialCitationNotes(item, styleId),
          await generateSequentialCitationNotes(item, upstreamId),
        );
        assert.equal(item.getField(scenario.field), scenario.value);
      });
    }
  }
});
