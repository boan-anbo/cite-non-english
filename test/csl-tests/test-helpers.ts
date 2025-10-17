/**
 * Helper utilities for CSL testing
 */

import type { CNETestFixture } from './fixtures/types';

/**
 * Create a Zotero item from a test fixture
 *
 * This function dynamically sets all fields from the fixture onto the Zotero item,
 * regardless of item type. This approach works for all item types without needing
 * separate handling logic for each type.
 *
 * @param fixture - Test fixture data
 * @returns Created Zotero item
 */
export async function createZoteroItemFromTestCase(
  fixture: CNETestFixture
): Promise<Zotero.Item> {
  const item = new Zotero.Item();

  // Set item type
  const itemTypeID = Zotero.ItemTypes.getID(fixture.itemType);
  if (!itemTypeID) {
    throw new Error(`Unknown item type: ${fixture.itemType}`);
  }
  item.setType(itemTypeID);

  // Set all fields dynamically
  // Iterate through all properties in the fixture
  for (const [key, value] of Object.entries(fixture)) {
    // Skip special properties
    if (key === 'itemType' || key === 'creators' || key === 'id' || key === 'description') {
      continue;
    }

    // Handle 'extra' field
    if (key === 'extra' && typeof value === 'string') {
      item.setField('extra', value);
      continue;
    }

    // Set regular fields (only if value is defined and is a string)
    if (value !== undefined && value !== null && typeof value === 'string') {
      try {
        item.setField(key, value);
      } catch (error) {
        // Silently skip fields that don't exist for this item type
        // This allows fixtures to have optional fields
      }
    }
  }

  // Add creators
  if (fixture.creators && Array.isArray(fixture.creators)) {
    for (const creator of fixture.creators) {
      item.setCreator(
        0,
        {
          firstName: creator.firstName || '',
          lastName: creator.lastName || '',
          creatorType: creator.creatorType
        },
        0
      );
    }
  }

  // Save item to get ID
  await item.saveTx();

  return item;
}

/**
 * Generate bibliography for items using specified style and locale
 *
 * @param items - Array of Zotero items
 * @param styleId - CSL style ID (e.g., 'http://www.zotero.org/styles/chicago-notes-bibliography-cne')
 * @param styleLocale - Style locale (e.g., 'en-US', 'zh-CN')
 * @returns HTML bibliography output
 */
export async function generateBibliography(
  items: Zotero.Item[],
  styleId: string,
  styleLocale: string = 'en-US'
): Promise<string> {
  // Get style
  const style = Zotero.Styles.get(styleId);
  if (!style) {
    throw new Error(`Style not found: ${styleId}`);
  }

  // Get CiteProc engine with specified locale
  const engine = style.getCiteProc(styleLocale, 'html');

  // Register items with engine
  engine.updateItems(items.map(item => item.id));

  // Generate bibliography
  const output = Zotero.Cite.makeFormattedBibliography(engine, 'html');

  if (!output) {
    throw new Error('Bibliography generation returned empty result');
  }

  return output;
}

/**
 * Load snapshot from file
 *
 * @param relativePath - Path relative to test/csl-tests/ directory
 * @returns Snapshot content
 */
export async function loadSnapshot(relativePath: string): Promise<string> {
  try {
    const dataDir = Zotero.DataDirectory.dir;
    console.log(`[loadSnapshot] dataDir: ${dataDir}`);

    // Data dir is at: .scaffold/test/data
    // We need: test/csl-tests/{relativePath}
    const parent1 = PathUtils.parent(dataDir);
    console.log(`[loadSnapshot] parent1: ${parent1}`);
    const parent2 = PathUtils.parent(parent1);
    console.log(`[loadSnapshot] parent2: ${parent2}`);
    const projectRoot = PathUtils.parent(parent2);
    console.log(`[loadSnapshot] projectRoot: ${projectRoot}`);

    // Build path step by step
    const testDir = PathUtils.join(projectRoot, 'test');
    console.log(`[loadSnapshot] testDir: ${testDir}`);
    const cslTestsDir = PathUtils.join(testDir, 'csl-tests');
    console.log(`[loadSnapshot] cslTestsDir: ${cslTestsDir}`);

    // Split relative path and join each component separately
    // relativePath is like "snapshots/chicago-18th/en-US/chinese.html"
    const pathParts = relativePath.split('/');
    let fullPath = cslTestsDir;
    for (const part of pathParts) {
      fullPath = PathUtils.join(fullPath, part);
    }
    console.log(`[loadSnapshot] fullPath: ${fullPath}`);

    const exists = await IOUtils.exists(fullPath);
    if (!exists) {
      throw new Error(`Snapshot not found: ${fullPath}`);
    }

    return await IOUtils.readUTF8(fullPath);
  } catch (error) {
    console.error(`[loadSnapshot] Error: ${error.message}`);
    console.error(`[loadSnapshot] Stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Save snapshot to file
 *
 * @param relativePath - Path relative to test/csl-tests/ directory
 * @param content - Content to write
 */
export async function saveSnapshot(relativePath: string, content: string): Promise<void> {
  try {
    const dataDir = Zotero.DataDirectory.dir;
    console.log(`[saveSnapshot] dataDir: ${dataDir}`);

    // Data dir is at: .scaffold/test/data
    // We need: test/csl-tests/{relativePath}
    const parent1 = PathUtils.parent(dataDir);
    const parent2 = PathUtils.parent(parent1);
    const projectRoot = PathUtils.parent(parent2);
    console.log(`[saveSnapshot] projectRoot: ${projectRoot}`);

    // Build path step by step
    const testDir = PathUtils.join(projectRoot, 'test');
    const cslTestsDir = PathUtils.join(testDir, 'csl-tests');

    // Split relative path and join each component separately
    // relativePath is like "snapshots/chicago-18th/en-US/chinese.html"
    const pathParts = relativePath.split('/');
    let fullPath = cslTestsDir;
    for (const part of pathParts) {
      fullPath = PathUtils.join(fullPath, part);
    }
    console.log(`[saveSnapshot] fullPath: ${fullPath}`);

    // Ensure directory exists
    const dir = PathUtils.parent(fullPath);
    console.log(`[saveSnapshot] Creating directory: ${dir}`);
    await IOUtils.makeDirectory(dir, { ignoreExisting: true });

    console.log(`[saveSnapshot] Writing ${content.length} bytes to ${fullPath}`);
    await IOUtils.writeUTF8(fullPath, content);
    console.log(`[saveSnapshot] Successfully wrote snapshot`);
  } catch (error) {
    console.error(`[saveSnapshot] Error: ${error.message}`);
    console.error(`[saveSnapshot] Stack: ${error.stack}`);
    throw error;
  }
}
