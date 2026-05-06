import { assert } from "chai";
import { ALL_FIXTURES, FIXTURE_IDS } from "./fixtures";
import {
  extractCslEntry,
  generateBibliography,
  generateSequentialCitationNotes,
} from "./test-helpers";
import { extractCNEConfigFromStyle } from "../../src/modules/cne/config/parseCNEConfig";

const STYLE_ID =
  "http://www.zotero.org/styles/chicago-shortened-notes-bibliography-cne";
const STYLE_LOCALE = "en-US";
const DONG_FIXTURE = ALL_FIXTURES[FIXTURE_IDS.ZHCN_DONG_2007_JINDAI];

describe("Chicago 18th Edition (shortened notes) - CNE (en-US)", function () {
  let dongItem: Zotero.Item;
  let bibliography: string;

  before(async function () {
    this.timeout(30000);

    const libraryID = Zotero.Libraries.userLibraryID;
    const allItems = await Zotero.Items.getAll(libraryID);
    dongItem = allItems.find(
      (item) => item.getField("title") === DONG_FIXTURE.title,
    )!;
    if (!dongItem) {
      throw new Error("dong-2007-jindai fixture item was not created");
    }

    bibliography = await generateBibliography(
      [dongItem],
      STYLE_ID,
      STYLE_LOCALE,
    );
  });

  it("should render shortened notes with romanized names only", async function () {
    const [firstNote, secondNote] = await generateSequentialCitationNotes(
      dongItem,
      STYLE_ID,
      STYLE_LOCALE,
      ["27", "27"],
    );

    for (const note of [firstNote, secondNote]) {
      assert.include(note, "Dong,");
      assert.include(note, "Jindai Shandong kaibu");
      assert.include(note, "27");
      assert.notInclude(note, "董建霞");
      assert.notInclude(note, "近代山东开埠与区位分析");
    }
  });

  it("should declare a citation-only person-slot override", function () {
    const style = Zotero.Styles.get(STYLE_ID);
    const config = extractCNEConfigFromStyle(style);

    assert.deepEqual(config?.persons, ["translit", "orig"]);
    assert.deepEqual(config?.citationPersons, ["translit"]);
  });

  it("should keep original script names and full CNE title fields in the bibliography", function () {
    const entry = extractCslEntry(bibliography, DONG_FIXTURE);

    assert.exists(entry, "Dong bibliography entry should exist");
    assert.include(entry!, "Dong Jianxia 董建霞");
    assert.include(entry!, "Jindai Shandong kaibu yu quwei fenxi");
    assert.include(entry!, "近代山东开埠与区位分析");
    assert.include(
      entry!,
      "[The Opening of Commercial Settlements in Modern Shandong and Locational Analysis]",
    );
    assert.include(entry!, "Jinan daxue xuebao (shehui kexue ban)");
    assert.include(entry!, "济南大学学报 (社会科学版)");
  });
});
