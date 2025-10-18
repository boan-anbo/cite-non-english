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
        // Log errors for debugging (some fields might not exist for certain item types)
        console.log(`[createItem] Could not set field '${key}' = '${value}': ${error}`);
      }
    }
  }

  // Add creators
  if (fixture.creators && Array.isArray(fixture.creators)) {
    for (let i = 0; i < fixture.creators.length; i++) {
      const creator = fixture.creators[i];
      item.setCreator(
        i,
        {
          firstName: creator.firstName || '',
          lastName: creator.lastName || '',
          creatorType: creator.creatorType
        },
        i
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
 * Generate citations (notes format) for items using specified style and locale
 *
 * @param items - Array of Zotero items
 * @param styleId - CSL style ID (e.g., 'http://www.zotero.org/styles/chicago-notes-bibliography-cne')
 * @param styleLocale - Style locale (e.g., 'en-US', 'zh-CN')
 * @returns HTML citations output formatted as numbered list (notes style)
 */
export async function generateCitations(
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

  // Generate citations as numbered list (asCitationList=true)
  const output = Zotero.Cite.makeFormattedBibliographyOrCitationList(
    engine,
    items,
    'html',
    true  // asCitationList parameter triggers notes/citations mode
  );

  if (!output) {
    throw new Error('Citations generation returned empty result');
  }

  return output;
}

/**
 * Save snapshot to file
 *
 * @param relativePath - Path relative to project root directory
 * @param content - Content to write
 */
export async function saveSnapshot(relativePath: string, content: string): Promise<void> {
  try {
    const dataDir = Zotero.DataDirectory.dir;
    console.log(`[saveSnapshot] dataDir: ${dataDir}`);

    // Data dir is at: .scaffold/test/data
    // We need: {projectRoot}/{relativePath}
    const parent1 = PathUtils.parent(dataDir);
    const parent2 = PathUtils.parent(parent1);
    const projectRoot = PathUtils.parent(parent2);
    console.log(`[saveSnapshot] projectRoot: ${projectRoot}`);

    // Build path step by step
    // relativePath is like "snapshots/chicago-18th/en-US/all-languages.html"
    const pathParts = relativePath.split('/');
    let fullPath = projectRoot;
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

/**
 * Extract identifiers from a test fixture for matching CSL entries
 *
 * Parses the Extra field to extract CNE metadata that can be used to
 * uniquely identify entries in bibliography output.
 *
 * @param fixture - Test fixture data
 * @returns Object with extracted identifiers
 */
export function extractFixtureIdentifiers(fixture: CNETestFixture): {
  originalTitle?: string;
  romanizedTitle?: string;
  englishTitle?: string;
  originalAuthor?: string;
  romanizedAuthor?: string;
  originalJournal?: string;
  romanizedJournal?: string;
} {
  const identifiers: Record<string, string> = {};

  // Parse Extra field for CNE metadata
  if (fixture.extra) {
    const lines = fixture.extra.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // Map CNE fields to identifiers
        if (key === 'cne-title-original') {
          identifiers.originalTitle = value;
        } else if (key === 'cne-title-romanized') {
          identifiers.romanizedTitle = value;
        } else if (key === 'cne-title-english') {
          identifiers.englishTitle = value;
        } else if (key === 'cne-author-0-last-original' || key === 'cne-director-0-last-original') {
          identifiers.originalAuthor = value;
        } else if (key === 'cne-author-0-last-romanized' || key === 'cne-director-0-last-romanized') {
          identifiers.romanizedAuthor = value;
        } else if (key === 'cne-journal-original') {
          identifiers.originalJournal = value;
        } else if (key === 'cne-journal-romanized') {
          identifiers.romanizedJournal = value;
        }
      }
    }
  }

  // Fall back to main fields if CNE metadata not present
  if (!identifiers.originalTitle && fixture.title) {
    identifiers.originalTitle = fixture.title;
  }

  return identifiers;
}

/**
 * Extract a specific CSL entry from bibliography HTML
 *
 * Matches entries by finding unique identifiers (original title, romanized title,
 * author names, journal names) in the text content. Uses a scoring system to handle
 * entries with different field combinations.
 *
 * @param bibliography - Full bibliography HTML string
 * @param fixture - Test fixture to extract entry for
 * @returns Inner HTML of the matched CSL entry, or null if not found
 */
export function extractCslEntry(
  bibliography: string,
  fixture: CNETestFixture
): string | null {
  // Extract identifiers from fixture
  const identifiers = extractFixtureIdentifiers(fixture);

  // Parse HTML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(bibliography, 'text/html');

  // Get all CSL entry elements
  const entries = doc.querySelectorAll('.csl-entry');

  if (entries.length === 0) {
    console.warn('[extractCslEntry] No .csl-entry elements found in bibliography');
    return null;
  }

  // Score each entry based on identifier matches
  let bestMatch: Element | null = null;
  let bestScore = 0;

  for (const entry of entries) {
    const entryText = entry.textContent || '';
    let score = 0;

    // Original title is the strongest identifier (most unique)
    if (identifiers.originalTitle && entryText.includes(identifiers.originalTitle)) {
      score += 100;
    }

    // Romanized title is also very strong
    if (identifiers.romanizedTitle && entryText.includes(identifiers.romanizedTitle)) {
      score += 80;
    }

    // English title (in brackets)
    if (identifiers.englishTitle && entryText.includes(identifiers.englishTitle)) {
      score += 60;
    }

    // Journal titles
    if (identifiers.originalJournal && entryText.includes(identifiers.originalJournal)) {
      score += 40;
    }
    if (identifiers.romanizedJournal && entryText.includes(identifiers.romanizedJournal)) {
      score += 40;
    }

    // Author names (weaker identifiers as they may be common)
    if (identifiers.originalAuthor && entryText.includes(identifiers.originalAuthor)) {
      score += 20;
    }
    if (identifiers.romanizedAuthor && entryText.includes(identifiers.romanizedAuthor)) {
      score += 20;
    }

    // Update best match if this score is higher
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Return inner HTML of best match (or null if no good match found)
  if (bestMatch && bestScore > 0) {
    return bestMatch.innerHTML;
  }

  console.warn('[extractCslEntry] No matching entry found for fixture', identifiers);
  return null;
}
