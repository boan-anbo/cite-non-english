import { assert } from "chai";
import {
  createZoteroItemFromTestCase,
  generateBibliography,
  extractCslEntryTexts,
} from "./test-helpers";

const CHICAGO_NOTES_STYLE_ID =
  "http://www.zotero.org/styles/chicago-notes-bibliography-cne";
const CHICAGO_AUTHOR_DATE_STYLE_ID =
  "http://www.zotero.org/styles/chicago-author-date-cne";
const APA_STYLE_ID = "http://www.zotero.org/styles/apa-7th-cne";

function normalized(text: string): string {
  return text.toLocaleLowerCase("en-US");
}

describe("CNE legal item rendering", function () {
  let allItems: Zotero.Item[];
  let plainStatuteItem: Zotero.Item;

  before(async function () {
    const libraryID = Zotero.Libraries.userLibraryID;
    allItems = await Zotero.Items.getAll(libraryID);
    plainStatuteItem = await createZoteroItemFromTestCase({
      itemType: "statute",
      title: "Plain Legal Regression Act",
      nameOfAct: "Plain Legal Regression Act",
      publicLawNumber: "No. 123",
      dateEnacted: "2026",
      language: "en",
      creators: [
        {
          lastName: "Regression Assembly",
          creatorType: "author",
        },
      ],
      extra: "",
    });
  });

  after(async function () {
    await plainStatuteItem.eraseTx();
    await Zotero.Creators.purge();
  });

  async function getStatuteEntry(styleId: string, marker: string) {
    const bibliography = await generateBibliography(allItems, styleId);
    return extractCslEntryTexts(bibliography).find((text) =>
      text.includes(marker),
    );
  }

  async function assertCneStatute(
    styleName: string,
    styleId: string,
    supportsOriginal: boolean,
  ) {
    const entry = await getStatuteEntry(styleId, "第五十八号");

    assert.exists(entry, `${styleName} statute entry should exist`);
    assert.include(
      entry!,
      "Quanguo Renmin Daibiao Dahui Changwu Weiyuanhui",
      `${styleName} should render romanized legal author`,
    );
    assert.include(
      normalized(entry!),
      "zhonghua renmin gongheguo",
      `${styleName} should render romanized statute title`,
    );
    assert.include(
      entry!,
      "Export Control Law",
      `${styleName} should render translated statute title`,
    );
    assert.include(
      entry!,
      "Pub. L. No. 第五十八号",
      `${styleName} should preserve public-law metadata`,
    );

    if (supportsOriginal) {
      assert.include(
        entry!,
        "全国人民代表大会常务委员会",
        `${styleName} should render original legal author`,
      );
      assert.include(
        entry!,
        "中华人民共和国出口管制法",
        `${styleName} should render original statute title`,
      );
    }
  }

  async function assertTitleOnlyStatute(styleName: string, styleId: string) {
    const entry = await getStatuteEntry(styleId, "第404号");

    assert.exists(entry, `${styleName} title-only statute entry should exist`);
    assert.include(
      normalized(entry!),
      "shouyao",
      `${styleName} should render CNE title metadata`,
    );
    assert.notInclude(
      entry!,
      "中华人民共和国国务院",
      `${styleName} should not render native legal author without CNE creator metadata`,
    );
  }

  async function assertPlainStatute(styleName: string, styleId: string) {
    const bibliography = await generateBibliography(
      [plainStatuteItem],
      styleId,
    );
    const entry = extractCslEntryTexts(bibliography)[0];

    assert.include(
      entry,
      "Plain Legal Regression Act",
      `${styleName} should preserve the native statute title without CNE metadata`,
    );
    assert.include(
      entry,
      "Pub. L. No. No. 123",
      `${styleName} should preserve public-law metadata without CNE metadata`,
    );
    assert.include(
      entry,
      "2026",
      `${styleName} should preserve the native legal date without CNE metadata`,
    );
    assert.notInclude(
      entry,
      "Regression Assembly",
      `${styleName} should not add a legal author prefix without CNE creator metadata`,
    );
    assert.notInclude(
      entry,
      "[",
      `${styleName} should not add CNE title supplements without CNE title metadata`,
    );
  }

  it("renders CNE statute fields in Chicago notes", async function () {
    await assertCneStatute(
      "chicago-notes-bibliography-cne",
      CHICAGO_NOTES_STYLE_ID,
      true,
    );
  });

  it("does not add native legal author in Chicago notes", async function () {
    await assertTitleOnlyStatute(
      "chicago-notes-bibliography-cne",
      CHICAGO_NOTES_STYLE_ID,
    );
  });

  it("renders CNE statute fields in Chicago author-date", async function () {
    await assertCneStatute(
      "chicago-author-date-cne",
      CHICAGO_AUTHOR_DATE_STYLE_ID,
      true,
    );
  });

  it("does not add native legal author in Chicago author-date", async function () {
    await assertTitleOnlyStatute(
      "chicago-author-date-cne",
      CHICAGO_AUTHOR_DATE_STYLE_ID,
    );
  });

  it("renders CNE statute fields in APA", async function () {
    await assertCneStatute("apa-7th-cne", APA_STYLE_ID, false);
  });

  it("does not add native legal author in APA", async function () {
    await assertTitleOnlyStatute("apa-7th-cne", APA_STYLE_ID);
  });

  it("preserves plain statute rendering in Chicago notes", async function () {
    await assertPlainStatute(
      "chicago-notes-bibliography-cne",
      CHICAGO_NOTES_STYLE_ID,
    );
  });

  it("preserves plain statute rendering in Chicago author-date", async function () {
    await assertPlainStatute(
      "chicago-author-date-cne",
      CHICAGO_AUTHOR_DATE_STYLE_ID,
    );
  });

  it("preserves plain statute rendering in APA", async function () {
    await assertPlainStatute("apa-7th-cne", APA_STYLE_ID);
  });
});
