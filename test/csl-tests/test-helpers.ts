/**
 * Helper utilities for CSL testing
 */

import type { CNETestFixture } from './fixtures/types';

/**
 * Zotero Styles Lifecycle Manager
 *
 * Manages the initialization and state of the Zotero styles system
 * across all test files. Ensures styles are initialized exactly once
 * and provides observable state for debugging.
 *
 * @example
 * ```typescript
 * // In global setup or test before hooks
 * await stylesManager.ensureInitialized();
 *
 * // Check if ready (useful for debugging)
 * if (stylesManager.isReady()) {
 *   console.log('Styles ready!');
 * }
 * ```
 */
class StylesLifecycleManager {
  private state: 'uninitialized' | 'initializing' | 'ready' | 'failed' = 'uninitialized';
  private initError: Error | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Ensure Zotero.Styles is initialized.
   *
   * This method is idempotent - safe to call multiple times.
   * Subsequent calls will:
   * - Return immediately if already initialized
   * - Wait for in-progress initialization to complete
   * - Re-throw the original error if initialization failed
   *
   * @throws {Error} If initialization fails
   */
  async ensureInitialized(): Promise<void> {
    // Already ready
    if (this.state === 'ready') {
      console.log('ℹ️  Zotero.Styles already initialized');
      return;
    }

    // Previously failed - throw the original error
    if (this.state === 'failed') {
      console.error('❌ Zotero.Styles initialization previously failed');
      throw this.initError || new Error('Styles initialization failed (unknown error)');
    }

    // Currently initializing - wait for it
    if (this.state === 'initializing' && this.initPromise) {
      console.log('⏳ Waiting for in-progress initialization...');
      return this.initPromise;
    }

    // First call - perform initialization
    this.state = 'initializing';
    console.log('🎨 Initializing Zotero.Styles...');

    this.initPromise = this._performInit();
    return this.initPromise;
  }

  /**
   * Internal method to perform actual initialization
   */
  private async _performInit(): Promise<void> {
    try {
      await Zotero.Styles.init();
      this.state = 'ready';
      console.log('✅ Zotero.Styles initialized successfully');
    } catch (error) {
      this.state = 'failed';
      this.initError = error instanceof Error ? error : new Error(String(error));

      console.error('❌ Failed to initialize Zotero.Styles:', this.initError.message);
      if (this.initError.stack) {
        console.error('Stack trace:', this.initError.stack);
      }

      throw this.initError;
    }
  }

  /**
   * Check if styles system is ready
   *
   * @returns true if initialized and ready to use
   */
  isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * Get current state (useful for debugging)
   *
   * @returns Current initialization state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Get initialization error if failed
   *
   * @returns Error object if initialization failed, null otherwise
   */
  getError(): Error | null {
    return this.initError;
  }

  /**
   * Reset state (primarily for testing the manager itself)
   *
   * WARNING: Only use this if you know what you're doing!
   * In normal test execution, styles should be initialized once.
   */
  _reset(): void {
    this.state = 'uninitialized';
    this.initError = null;
    this.initPromise = null;
    console.warn('⚠️  StylesLifecycleManager reset - this should rarely be needed');
  }
}

// Export singleton instance
export const stylesManager = new StylesLifecycleManager();

/**
 * Install a CSL style file from addon to Zotero styles directory
 *
 * @param styleFilename - Name of the style file (e.g., 'chicago-notes-bibliography-cne.csl')
 */
export async function installCslStyle(styleFilename: string): Promise<void> {
  const stylesDir = PathUtils.join(Zotero.DataDirectory.dir, 'styles');
  await IOUtils.makeDirectory(stylesDir, { ignoreExisting: true });

  // Navigate from test/data -> parent -> parent -> cite-non-english
  const dataDir = Zotero.DataDirectory.dir;
  const test = PathUtils.parent(dataDir);
  const scaffold = PathUtils.parent(test);
  const root = PathUtils.parent(scaffold);

  const sourcePath = PathUtils.join(root, 'styles', 'cne', styleFilename);
  const destPath = PathUtils.join(stylesDir, styleFilename);

  await IOUtils.copy(sourcePath, destPath, { noOverwrite: false });
}

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
 * Parse COinS metadata from a Z3988 span element
 *
 * COinS (ContextObjects in Spans) is a standard for embedding citation metadata
 * in HTML using OpenURL format in the title attribute of a span element.
 *
 * @param coinsSpan - The Z3988 span element containing COinS metadata
 * @returns Parsed metadata object with decoded fields
 */
function parseCoinsMetadata(coinsSpan: Element): Record<string, string> {
  const metadata: Record<string, string> = {};

  const title = coinsSpan.getAttribute('title');
  if (!title) return metadata;

  // Parse URL-encoded key-value pairs
  const params = new URLSearchParams(title);

  // Extract and decode common fields
  for (const [key, value] of params.entries()) {
    // Decode URL-encoded UTF-8 (handles CJK characters)
    metadata[key] = decodeURIComponent(value);
  }

  return metadata;
}

/**
 * Match entry using COinS metadata
 *
 * COinS provides structured, reliable metadata that is immune to:
 * - Quote character differences (' vs " vs " vs ")
 * - Whitespace normalization
 * - HTML entity encoding
 *
 * @param entry - The .csl-entry element (COinS span is its next sibling)
 * @param fixture - Test fixture to match against
 * @returns Match score (0 if no match)
 */
function matchEntryByCoins(entry: Element, fixture: CNETestFixture): number {
  // COinS span is the next sibling of the .csl-entry
  const coinsSpan = entry.nextElementSibling;

  if (!coinsSpan || !coinsSpan.classList.contains('Z3988')) {
    return 0;
  }

  const coins = parseCoinsMetadata(coinsSpan);
  let score = 0;

  // Match by original title (most reliable - exact Unicode match)
  // COinS stores the original Zotero field, not the formatted version
  if (fixture.title && coins['rft.btitle'] === fixture.title) {
    score += 100;
  }
  if (fixture.title && coins['rft.atitle'] === fixture.title) {
    score += 100;
  }

  // Match by date (year)
  if (fixture.date && coins['rft.date']?.includes(fixture.date)) {
    score += 50;
  }

  // Match by language
  if (fixture.language && coins['rft.language'] === fixture.language) {
    score += 30;
  }

  // Match by author (last name from COinS)
  if (fixture.creators && fixture.creators.length > 0) {
    const firstAuthor = fixture.creators[0];
    if (firstAuthor.lastName && coins['rft.aulast'] === firstAuthor.lastName) {
      score += 40;
    }
  }

  return score;
}

/**
 * Decode HTML entities in a string while preserving HTML tags
 *
 * Replaces common HTML entities with their character equivalents.
 * Preserves HTML tags like <i>, <b>, <a>, etc.
 *
 * @param html - HTML string with entities
 * @returns Decoded string with tags preserved
 */
function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Extract a specific CSL entry from bibliography HTML
 *
 * Uses COinS metadata (structured citation data) for robust matching,
 * with text-based matching as fallback for compatibility.
 *
 * COinS-based matching is immune to quote character differences,
 * whitespace normalization, and HTML entity encoding issues.
 *
 * @param bibliography - Full bibliography HTML string
 * @param fixture - Test fixture to extract entry for
 * @returns Inner HTML of the matched CSL entry (with HTML entities decoded), or null if not found
 */
export function extractCslEntry(
  bibliography: string,
  fixture: CNETestFixture
): string | null {
  // Parse HTML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(bibliography, 'text/html');

  // Get all bibliography item divs (contain both .csl-entry and .Z3988)
  const bibItems = doc.querySelectorAll('.csl-bib-body > .csl-entry');

  if (bibItems.length === 0) {
    console.warn('[extractCslEntry] No .csl-entry elements found in bibliography');
    return null;
  }

  // Try COinS-based matching first (most robust)
  let bestMatch: Element | null = null;
  let bestScore = 0;

  for (const entry of bibItems) {
    // Try COinS matching
    const coinsScore = matchEntryByCoins(entry, fixture);

    if (coinsScore > bestScore) {
      bestScore = coinsScore;
      bestMatch = entry;
    }
  }

  // If COinS matching found a strong match, use it
  if (bestMatch && bestScore >= 100) {
    // Decode HTML entities (e.g., &amp; → &)
    return decodeHtmlEntities(bestMatch.innerHTML);
  }

  // Fallback to text-based matching for compatibility
  console.log('[extractCslEntry] COinS matching weak or failed, using text fallback');
  const identifiers = extractFixtureIdentifiers(fixture);
  bestMatch = null;
  bestScore = 0;

  for (const entry of bibItems) {
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

    // English title (in brackets) - now less reliable due to quote changes
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
    // Decode HTML entities (e.g., &amp; → &)
    return decodeHtmlEntities(bestMatch.innerHTML);
  }

  console.warn('[extractCslEntry] No matching entry found for fixture', identifiers);
  return null;
}
