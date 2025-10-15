#!/usr/bin/env ts-node
/**
 * Test all CNE styles against the comprehensive RIS fixture
 * Generates formatted citations for each style to verify CNE field handling
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const CITEPROC_SERVER_URL = "http://127.0.0.1:8085";
const FIXTURES_DIR = join(process.cwd(), "test/csl-tests/fixtures");
const CNE_STYLES_DIR = join(process.cwd(), "styles/cne");
const OUTPUT_DIR = join(process.cwd(), "test/csl-tests/output");

interface CSLItem {
  id: string;
  [key: string]: any;
}

/**
 * Convert CSL-JSON array to citeproc server format
 */
function convertToServerFormat(items: CSLItem[]): any {
  const itemsObject: Record<string, CSLItem> = {};
  for (const item of items) {
    itemsObject[item.id] = item;
  }
  return { items: itemsObject };
}

/**
 * Get citation from citeproc server
 */
async function getCitation(
  data: any,
  style: string,
  format: string = "html",
): Promise<string> {
  const url = `${CITEPROC_SERVER_URL}?responseformat=${format}&style=${style}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Server error: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  return await response.text();
}

/**
 * Get all CNE style names
 */
function getCNEStyles(): string[] {
  const files = readdirSync(CNE_STYLES_DIR);
  return files
    .filter((f) => f.endsWith("-cne.csl"))
    .map((f) => basename(f, ".csl"));
}

/**
 * Main test runner
 */
async function main() {
  // Load fixture data
  const fixturePath = join(FIXTURES_DIR, "cne-comprehensive-sample.json");
  console.log(`📖 Loading fixture: ${fixturePath}`);
  const fixtureArray: CSLItem[] = JSON.parse(
    readFileSync(fixturePath, "utf-8"),
  );
  const fixtureData = convertToServerFormat(fixtureArray);
  console.log(`   ✓ Loaded ${fixtureArray.length} items\n`);

  // Get all CNE styles
  const styles = getCNEStyles();
  console.log(`🎨 Found ${styles.length} CNE style(s):`);
  styles.forEach((style) => console.log(`   - ${style}`));
  console.log();

  // Test each style
  for (const style of styles) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Testing style: ${style}`);
    console.log("=".repeat(80));

    try {
      // Generate HTML output
      console.log("\n📝 Generating HTML bibliography...");
      const htmlOutput = await getCitation(fixtureData, style, "html");

      // Save output
      const outputPath = join(OUTPUT_DIR, `${style}.html`);
      writeFileSync(
        outputPath,
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CNE Style Test: ${style}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #333; border-bottom: 2px solid #666; padding-bottom: 10px; }
    .csl-bib-body { line-height: 1.8; }
    .csl-entry { margin-bottom: 1em; }
    .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 30px; border-radius: 5px; }
    .metadata p { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>CNE Style Test: ${style}</h1>
  <div class="metadata">
    <p><strong>Fixture:</strong> cne-comprehensive-sample.json</p>
    <p><strong>Items:</strong> ${fixtureArray.length}</p>
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
  </div>
  ${htmlOutput}
</body>
</html>`,
      );
      console.log(`   ✓ HTML output saved to: ${outputPath}`);

      // Generate plain text output (RTF format, but we'll call it text)
      console.log("\n📄 Generating plain text bibliography...");
      const textOutput = await getCitation(fixtureData, style, "text");
      const textPath = join(OUTPUT_DIR, `${style}.txt`);
      writeFileSync(textPath, textOutput);
      console.log(`   ✓ Text output saved to: ${textPath}`);

      // Show preview of first few entries
      console.log("\n🔍 Preview (first 3 entries):");
      const lines = textOutput.split("\n").filter((line) => line.trim());
      lines.slice(0, 3).forEach((line, i) => {
        console.log(`   ${i + 1}. ${line.substring(0, 100)}${line.length > 100 ? "..." : ""}`);
      });

      console.log(`\n✅ Style test passed: ${style}`);
    } catch (error) {
      console.error(`\n❌ Style test failed: ${style}`);
      console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 All tests completed!");
  console.log(`   Output directory: ${OUTPUT_DIR}`);
  console.log("=".repeat(80));
}

// Run tests
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
