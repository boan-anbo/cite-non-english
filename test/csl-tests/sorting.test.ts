import { assert } from "chai";
import {
  createZoteroItemFromTestCase,
  extractCslEntryTexts,
  generateBibliography,
  installCslStyle,
  stylesManager,
} from "./test-helpers";
import { ALL_FIXTURES, FIXTURE_IDS } from "./fixtures";
import type { CNETestFixture } from "./fixtures/types";

const STYLE_LOCALE = "en-US";

const CNE_STYLES = [
  {
    id: "http://www.zotero.org/styles/chicago-notes-bibliography-cne",
    filename: "chicago-notes-bibliography-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/chicago-author-date-cne",
    filename: "chicago-author-date-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/apa-7th-cne",
    filename: "apa-7th-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/modern-language-association-8th-cne",
    filename: "modern-language-association-8th-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/modern-language-association-9th-in-text-cne",
    filename: "modern-language-association-9th-in-text-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/modern-language-association-9th-notes-cne",
    filename: "modern-language-association-9th-notes-cne.csl",
  },
] as const;

function englishBook(lastName: string, firstName = ""): CNETestFixture {
  return {
    itemType: "book",
    title: `${lastName} Sort Target`,
    publisher: "Sorting Press",
    date: "2026",
    language: "en",
    creators: [{ firstName, lastName, creatorType: "author" }],
    extra: "",
  };
}

function englishAuthorWithCneEditor(
  authorLastName: string,
  authorFirstName: string,
): CNETestFixture {
  return {
    itemType: "book",
    title: `${authorLastName} Primary Author Target`,
    publisher: "Sorting Press",
    date: "2026",
    language: "en",
    creators: [
      {
        firstName: authorFirstName,
        lastName: authorLastName,
        creatorType: "author",
      },
      {
        firstName: "민수",
        lastName: "김",
        creatorType: "editor",
      },
    ],
    extra: `cne-creator-1-last-original: 김
cne-creator-1-first-original: 민수
cne-creator-1-last-romanized: Aardvark
cne-creator-1-first-romanized: Editor`,
  };
}

function noCreatorBook(title: string, extra = ""): CNETestFixture {
  return {
    itemType: "book",
    title,
    publisher: "Sorting Press",
    date: "2026",
    language: extra ? "ko-KR" : "en",
    creators: [],
    extra,
  };
}

describe("CNE bibliography sorting", function () {
  this.timeout(30000);

  const createdItems: Zotero.Item[] = [];
  let mixedLanguageItems: Zotero.Item[] = [];
  let noCreatorItems: Zotero.Item[] = [];
  let secondaryCreatorItems: Zotero.Item[] = [];
  let baseSortingItems: Zotero.Item[] = [];

  async function cleanupCreatedItems() {
    const items = createdItems.splice(0);
    await Promise.all(items.map((item) => item.eraseTx()));
    await Zotero.Creators.purge();
  }

  async function cleanupStaleSortingItems() {
    const libraryID = Zotero.Libraries.userLibraryID;
    const allItems = await Zotero.Items.getAll(libraryID);
    const staleItems = allItems.filter((item) => {
      const title = String(item.getField("title") || "");
      return (
        title.includes("Sort Target") ||
        title.includes("Primary Author Target") ||
        title.includes("정렬 대상")
      );
    });
    await Promise.all(staleItems.map((item) => item.eraseTx()));
    await Zotero.Creators.purge();
  }

  async function findFixtureItems(fixtureIds: string[]) {
    const libraryID = Zotero.Libraries.userLibraryID;
    const allItems = await Zotero.Items.getAll(libraryID);

    return fixtureIds.map((fixtureId) => {
      const fixture = ALL_FIXTURES[fixtureId];
      const item = allItems.find(
        (candidate) => candidate.getField("title") === fixture.title,
      );

      if (!item) {
        throw new Error(`Missing global CSL fixture item: ${fixtureId}`);
      }

      return item;
    });
  }

  before(async function () {
    for (const style of CNE_STYLES) {
      await installCslStyle(style.filename);
    }

    if (stylesManager.isReady()) {
      await (Zotero.Styles as any).reinit?.();
    } else {
      await stylesManager.ensureInitialized();
    }

    await cleanupStaleSortingItems();
    baseSortingItems = await createItems([
      englishBook("Petrides", "Georgios"),
      englishBook("Fink", "Max"),
      englishBook("Malur", "Chitra"),
    ]);
    mixedLanguageItems = [
      ...baseSortingItems,
      ...(await findFixtureItems([
        FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG,
        FIXTURE_IDS.KO_HA_2000_TONGSAM,
        FIXTURE_IDS.KO_HAN_1991_KYONGHUNG,
        FIXTURE_IDS.KO_KIM_2020_COMMA,
      ])),
    ];
    noCreatorItems = await createItems([
      noCreatorBook(
        "무저자 정렬 대상",
        `cne-title-original: 무저자 정렬 대상
cne-title-romanized: Aardvark Sort Target
cne-publisher-romanized: Sorting Press`,
      ),
      noCreatorBook("Middling Sort Target"),
    ]);
    secondaryCreatorItems = [
      ...(await createItems([
        englishAuthorWithCneEditor("Petrides", "Georgios"),
      ])),
      baseSortingItems[1],
    ];
  });

  after(async function () {
    await cleanupCreatedItems();
  });

  async function createItems(fixtures: CNETestFixture[]) {
    const items: Zotero.Item[] = [];
    for (const fixture of fixtures) {
      const item = await createZoteroItemFromTestCase(fixture);
      createdItems.push(item);
      items.push(item);
    }
    return items;
  }

  CNE_STYLES.forEach((style) => {
    // Register the same order checks for every curated CNE style.
    describe(style.filename, function () {
      it("sorts mixed English and Korean entries by CNE romanization", async function () {
        const bibliography = await generateBibliography(
          mixedLanguageItems,
          style.id,
          STYLE_LOCALE,
        );
        const entries = extractCslEntryTexts(bibliography).filter((entry) =>
          /\b(Chu|Fink|Ha|Han|Kim|Malur|Petrides)\b/.test(entry),
        );
        const order = entries.map((entry) => {
          const match = entry.match(/\b(Chu|Fink|Ha|Han|Kim|Malur|Petrides)\b/);
          return match?.[1] || entry;
        });

        assert.deepEqual(order, [
          "Chu",
          "Fink",
          "Ha",
          "Han",
          "Kim",
          "Malur",
          "Petrides",
        ]);
      });

      it("sorts no-creator CNE entries by romanized title", async function () {
        const bibliography = await generateBibliography(
          noCreatorItems,
          style.id,
          STYLE_LOCALE,
        );
        const entries = extractCslEntryTexts(bibliography).filter(
          (entry) =>
            entry.includes("Aardvark") ||
            entry.includes("무저자") ||
            entry.includes("Middling"),
        );
        const order = entries.map((entry) =>
          entry.includes("Aardvark") || entry.includes("무저자")
            ? "Aardvark"
            : "Middling",
        );

        assert.deepEqual(order, ["Aardvark", "Middling"]);
      });

      it("does not let a CNE secondary creator override a native primary creator", async function () {
        const bibliography = await generateBibliography(
          secondaryCreatorItems,
          style.id,
          STYLE_LOCALE,
        );
        const entries = extractCslEntryTexts(bibliography).filter((entry) =>
          /\b(Fink|Petrides)\b/.test(entry),
        );
        const order = entries.map((entry) => {
          const match = entry.match(/\b(Fink|Petrides)\b/);
          return match?.[1] || entry;
        });

        assert.deepEqual(order, ["Fink", "Petrides"]);
      });

      it("preserves base style sorting when no CNE sort metadata is present", async function () {
        const bibliography = await generateBibliography(
          baseSortingItems,
          style.id,
          STYLE_LOCALE,
        );
        const entries = extractCslEntryTexts(bibliography).filter((entry) =>
          /\b(Fink|Malur|Petrides)\b/.test(entry),
        );
        const order = entries.map((entry) => {
          const match = entry.match(/\b(Fink|Malur|Petrides)\b/);
          return match?.[1] || entry;
        });

        assert.deepEqual(order, ["Fink", "Malur", "Petrides"]);
      });
    });
  });
});
