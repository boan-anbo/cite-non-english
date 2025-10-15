import { assert } from "chai";

const CITEPROC_SERVER_URL = "http://127.0.0.1:8085";

describe("APA Japanese Style Tests", function () {
  // Test items based on real Japanese APA examples

  // Journal article example from user
  const journalArticle = {
    id: "torikai2020",
    type: "article-journal",
    title: "ソーシャルメディアを用いた新型コロナ禍における感情変化の分析",
    author: [
      { family: "鳥海", given: "不二夫" },
      { family: "榊", given: "剛史" },
      { family: "吉田", given: "光男" },
    ],
    "container-title": "人工知能学会論文誌",
    volume: "35",
    issue: "3",
    page: "1-7",
    issued: { "date-parts": [[2020]] },
    language: "ja",
  };

  // Book example from user
  const book = {
    id: "kadowaki2019",
    type: "book",
    title: "Kaggleで勝つデータ分析の技術",
    author: [
      { family: "門脇", given: "大輔" },
      { family: "阪田", given: "隆司" },
      { family: "保坂", given: "桂佑" },
      { family: "平松", given: "雄司" },
    ],
    publisher: "技術評論社",
    issued: { "date-parts": [[2019]] },
    language: "ja",
  };

  // Website example from user
  const website = {
    id: "nri2020",
    type: "webpage",
    title: "機械学習",
    author: [{ literal: "野村総合研究所" }],
    URL: "https://www.nri.com/jp/knowledge/glossary/lst/ka/machine_learning",
    issued: { "date-parts": [[2020]] },
    accessed: { "date-parts": [[2023, 4, 1]] },
    language: "ja",
  };

  // Original test item based on the user's screenshot
  const testItem = {
    id: "mou2023zhongguo",
    type: "book",
    title: "中國行政區劃通史. 十六国北朝卷",
    author: [
      { family: "牟", given: "發松" },
      { family: "丹", given: "有江" },
      { family: "魏", given: "俊傑" },
    ],
    editor: [{ family: "周", given: "振鶴" }],
    "collection-title": "中國行政區劃通史",
    edition: "1",
    language: "ja",
  };

  async function getCitation(
    items: any[],
    style: string = "apa-ja",
    format: string = "text",
  ): Promise<string> {
    const url = `${CITEPROC_SERVER_URL}?responseformat=${format}&style=${style}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Server error: ${response.status} ${response.statusText}\n${errorText}`,
      );
    }

    return await response.text();
  }

  it("should format journal article with correct Japanese quotation marks", async function () {
    const result = await getCitation([journalArticle]);

    console.log("\n📰 Journal Article Citation:");
    console.log(result);
    console.log();

    // Expected: 鳥海 不二夫, 榊 剛史, 吉田 光男（2020）. 「ソーシャルメディア...」『人工知能学会論文誌』35巻, 3号, pp.1-7.

    // Article title should use 「」
    assert.include(result, "「ソーシャルメディア", "Article title should start with 「");
    assert.include(result, "分析」", "Article title should end with 」");

    // Journal name should use 『』
    assert.include(result, "『人工知能学会論文誌』", "Journal name should use 『』");

    // Should have volume and issue in Japanese
    assert.include(result, "35巻", "Should have volume in Japanese format");
    assert.include(result, "3号", "Should have issue in Japanese format");

    // Year should be in parentheses
    assert.include(result, "（2020）", "Year should be in full-width parentheses");
  });

  it("should format book with double quotation marks", async function () {
    const result = await getCitation([book]);

    console.log("\n📚 Book Citation:");
    console.log(result);
    console.log();

    // Expected: 門脇大輔, 阪田隆司, 保坂桂佑, 平松雄司（2019）. 『Kaggleで勝つデータ分析の技術』. 技術評論社.

    // Book title should use 『』
    assert.include(result, "『Kaggleで勝つデータ分析の技術』", "Book title should use 『』");

    // Should have publisher
    assert.include(result, "技術評論社", "Should have publisher name");

    // Year should be in parentheses
    assert.include(result, "（2019）", "Year should be in full-width parentheses");

    // Should NOT have italic markers
    assert.notInclude(result, "<i>", "Should not have italic tags");
  });

  it("should format website with single quotation marks", async function () {
    const result = await getCitation([website]);

    console.log("\n🌐 Website Citation:");
    console.log(result);
    console.log();

    // Expected: 野村総合研究所（2020）. 「機械学習」. URL, （参照 2023-04-01）

    // Webpage title should use 「」
    assert.include(result, "「機械学習」", "Webpage title should use 「」");

    // Should have URL
    assert.include(result, "https://www.nri.com", "Should have URL");

    // Should have accessed date with Japanese term
    assert.include(result, "参照", "Should have Japanese 'accessed' term");
  });

  it("should format book with editor correctly", async function () {
    const result = await getCitation([testItem]);

    console.log("\n📖 Book with Editor Citation:");
    console.log(result);
    console.log();

    // Book title should use 『』
    assert.include(result, "『中國行政區劃通史", "Book title should use 『");

    // Should have editor notation
    assert.include(result, "編", "Should have Japanese editor notation");

    // Should have edition
    assert.include(result, "1版", "Should have edition in Japanese format");
  });

  it("should use Japanese terms for no date", async function () {
    const itemNoDate = {
      ...book,
      id: "test2",
      issued: undefined,
    };

    const result = await getCitation([itemNoDate]);

    console.log("\n📅 Citation with no date:");
    console.log(result);
    console.log();

    // Check for Japanese "no date" term
    assert.include(
      result,
      "日付なし",
      "Should use Japanese term for 'no date'",
    );
  });

  it("should use comma separator for multiple authors", async function () {
    const result = await getCitation([journalArticle]);

    console.log("\n👥 Author formatting:");
    console.log(result);
    console.log();

    // Authors should be separated by comma and space, not middle dot
    // Expected: 鳥海 不二夫, 榊 剛史, 吉田 光男
    assert.include(result, ", ", "Authors should be separated by comma and space");
  });
});
