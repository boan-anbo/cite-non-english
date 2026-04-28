import { assert } from "chai";
import { generateBibliography, extractCslEntryTexts } from "./test-helpers";

const STYLE_ID = "http://www.zotero.org/styles/chicago-author-date-cne";
const STYLE_LOCALE = "en-US";

describe("Chicago author-date CNE rendering", function () {
  let entries: string[];

  before(async function () {
    const allItems = await Zotero.Items.getAll(Zotero.Libraries.userLibraryID);
    const bibliography = await generateBibliography(
      allItems,
      STYLE_ID,
      STYLE_LOCALE,
    );
    entries = extractCslEntryTexts(bibliography);
  });

  function findEntry(marker: string): string {
    const entry = entries.find((candidate) => candidate.includes(marker));
    assert.exists(entry, `expected bibliography entry containing "${marker}"`);
    return entry!;
  }

  it("renders Japanese CNE names without forcing Western commas", function () {
    const abeEntry = findEntry("Asakawa");
    assert.include(abeEntry, "Abe Yoshio 阿部善雄");
    assert.include(abeEntry, "Kaneko Hideo 金子英生");
    assert.notInclude(abeEntry, "Abe, Yoshio");
    assert.notInclude(abeEntry, "Hideo Kaneko");

    const kondoEntry = findEntry("Harima");
    assert.include(kondoEntry, "Kondō Shigekazu 近藤成一");
    assert.notInclude(kondoEntry, "Kondō, Shigekazu");
  });

  it("uses Chicago no-comma CJK defaults while preserving force-comma overrides", function () {
    const haoEntry = findEntry("Tang houqi");
    assert.include(haoEntry, "Hao Chunwen 郝春文");
    assert.notInclude(haoEntry, "Hao, Chunwen");

    const kangEntry = findEntry("Wŏnyung");
    assert.include(kangEntry, "Kang U-bang 姜友邦");
    assert.notInclude(kangEntry, "Kang, U-bang");

    const kimEntry = findEntry("Traditional Architecture");
    assert.include(kimEntry, "Kim, Minsoo 김민수");
    assert.notInclude(kimEntry, "Kim Minsoo 김민수");
  });

  it("renders Japanese CNE title supplements", function () {
    const abeEntry = findEntry("Asakawa");
    assert.include(abeEntry, "Saigo no");
    assert.include(abeEntry, "最後の「日本人」");
    assert.include(abeEntry, "The last");

    const yoshimiEntry = findEntry("Genshiryoku");
    assert.include(yoshimiEntry, "Mōhitotsu no media");
    assert.include(yoshimiEntry, "もう一つのメディア");
    assert.include(yoshimiEntry, "Expo as another media");
  });

  it("preserves Western Chicago name formatting for English items", function () {
    const petridesEntry = findEntry("Convulsive Therapy");
    assert.include(
      petridesEntry,
      "Petrides, Georgios, Chitra Malur, and Max Fink",
    );
  });
});
