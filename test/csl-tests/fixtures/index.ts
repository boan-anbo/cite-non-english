/**
 * Fixture Index - Central export point for all test fixtures
 *
 * This file aggregates fixtures from multiple sources into a single
 * ALL_FIXTURES export. When adding new fixture files (e.g., arabic-fixtures.ts),
 * simply import and spread them here.
 *
 * ## Adding New Fixture Sets
 *
 * 1. Create new fixture file (e.g., `arabic-fixtures.ts`)
 * 2. Export fixtures as `ARABIC_FIXTURES`
 * 3. Import here and add to ALL_FIXTURES spread
 *
 * Example:
 * ```typescript
 * import { ARABIC_FIXTURES } from './arabic-fixtures';
 * export const ALL_FIXTURES = {
 *   ...UNIFIED_FIXTURES,
 *   ...ARABIC_FIXTURES,
 * };
 * ```
 */

import { ALL_FIXTURES as UNIFIED_FIXTURES } from './unified-fixtures';

// Re-export types and constants
export * from './types';
export * from './constants';

/**
 * Single source of truth for all test fixtures
 *
 * Aggregates all fixture sets from various files.
 * Used by:
 * - Global setup (creates Zotero items)
 * - Snapshot generator (references for generation)
 * - Style tests (IDs and expectations)
 */
export const ALL_FIXTURES = {
  ...UNIFIED_FIXTURES,
  // Add future fixture sets here:
  // ...ARABIC_FIXTURES,
  // ...HEBREW_FIXTURES,
};
