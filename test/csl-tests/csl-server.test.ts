import { assert } from "chai";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CITEPROC_SERVER_URL = "http://127.0.0.1:8085";

describe("CSL Style Tests - CNE Fields via Server", function () {
  let testItems: any[];

  before(function () {
    // Load test data
    const fixturesPath = join(__dirname, "fixtures/cne-book-sample.json");
    testItems = JSON.parse(readFileSync(fixturesPath, "utf-8"));
  });

  async function getCitation(
    items: any[],
    style: string = "chicago-notes-bibliography-cne-test",
    format: string = "html",
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
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  it("should connect to citeproc server", async function () {
    // Simple test - just check server responds
    try {
      const result = await getCitation([testItems[1]]); // Regular item
      assert.isString(result);
      assert.isNotEmpty(result);
    } catch (error) {
      assert.fail(`Server not responding: ${error}`);
    }
  });

  it("should render CNE item with cne-title-original field", async function () {
    const result = await getCitation([testItems[0]]);

    console.log("\n📚 Citation output for item with CNE fields:");
    console.log(result);
    console.log();

    // Check that the CNE-ORIGINAL marker appears
    assert.include(result, "[CNE-ORIGINAL:", "Should show CNE-ORIGINAL prefix");
    assert.include(
      result,
      "日本仏教綜合研究",
      "Should show original Japanese title",
    );
  });

  it("should render regular item without CNE fields normally", async function () {
    const result = await getCitation([testItems[1]]);

    console.log("\n📖 Citation output for regular item:");
    console.log(result);
    console.log();

    // Should NOT have CNE marker
    assert.notInclude(result, "[CNE-ORIGINAL:", "Should not show CNE prefix");
    assert.include(result, "Regular English Book", "Should show normal title");
  });

  it("should process both items in bibliography", async function () {
    const result = await getCitation(testItems);

    console.log("\n📚 Full bibliography:");
    console.log(result);
    console.log();

    // Should contain both items
    assert.include(result, "日本仏教綜合研究", "Should have Japanese item");
    assert.include(result, "Regular English Book", "Should have English item");
  });

  it("should test with different item types", async function () {
    const articleItem = {
      id: "article1",
      type: "article-journal",
      title: "Test Article",
      "cne-title-original": "測試文章",
      "cne-title-romanized": "Cèshì wénzhāng",
      "cne-title-english": "Test Article",
      author: [{ family: "Wang", given: "Wei" }],
      "container-title": "Journal of Testing",
      volume: "10",
      issue: "2",
      page: "100-120",
      issued: { "date-parts": [[2024]] },
    };

    const result = await getCitation([articleItem]);

    console.log("\n📄 Citation output for article with CNE fields:");
    console.log(result);
    console.log();

    assert.include(result, "測試文章", "Should show Chinese title");
  });
});
