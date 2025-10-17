/// <reference types="zotero-types" />

/**
 * Type definitions for CSL test fixtures
 *
 * These types use Zotero's official type definitions from zotero-types package
 * to ensure test data matches the exact shape of Zotero items.
 */

/**
 * Base interface for all test fixtures
 * Contains test metadata (id, description not part of Zotero item data)
 */
export interface BaseTestCase {
  id?: string;
  description?: string;
}

/**
 * All possible Zotero item fields
 * Based on _ZoteroTypes.Item.ItemField - all fields are optional and typed as string
 */
export type ItemFields = Partial<{
  [K in _ZoteroTypes.Item.ItemField]: string;
}>;

/**
 * Complete test fixture for a journal article
 * Combines Zotero item fields with creators and required fields
 */
export interface JournalArticleFixture extends ItemFields {
  itemType: 'journalArticle';
  title: string;
  publicationTitle: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra: string;  // CNE metadata in Extra field format (required)
}

/**
 * Complete test fixture for a book
 * Combines Zotero item fields with creators and required fields
 */
export interface BookFixture extends ItemFields {
  itemType: 'book';
  title: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra: string;  // CNE metadata in Extra field format (required)
}

/**
 * Complete test fixture for a book section (chapter)
 */
export interface BookSectionFixture extends ItemFields {
  itemType: 'bookSection';
  title: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra: string;
}

/**
 * Complete test fixture for a newspaper article
 */
export interface NewspaperArticleFixture extends ItemFields {
  itemType: 'newspaperArticle';
  title: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra: string;
}

/**
 * Complete test fixture for a webpage
 */
export interface WebpageFixture extends ItemFields {
  itemType: 'webpage';
  title: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra?: string;
}

/**
 * Complete test fixture for a film/motion picture
 */
export interface FilmFixture extends ItemFields {
  itemType: 'film';
  title: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra?: string;
}

/**
 * Complete test fixture for a dataset
 */
export interface DatasetFixture extends ItemFields {
  itemType: 'dataset';
  title: string;
  creators: Array<_ZoteroTypes.Item.CreatorJSON>;
  extra: string;
}

/**
 * Union type of all test fixtures
 */
export type CNETestFixture =
  | JournalArticleFixture
  | BookFixture
  | BookSectionFixture
  | NewspaperArticleFixture
  | WebpageFixture
  | FilmFixture
  | DatasetFixture;
