/**
 * Name Variant Builder
 *
 * Encapsulates the complex logic for building multi-language name variants
 * in citeproc-js multi-slot architecture.
 *
 * ## Problem This Solves
 *
 * Citeproc-js formats names differently based on the "romanesque level":
 * - romanesque=0: Entirely non-romanesque (e.g., pure Chinese characters)
 * - romanesque=1: Mixed content (romanized CJK names) → family-first, no comma
 * - romanesque=2: Pure romanesque (Western names) → respects CSL attributes
 *
 * The romanesque level is determined by _isRomanesque() which checks:
 * 1. Character set (Latin vs CJK)
 * 2. multi.main language tag
 *
 * We exploit this by setting different multi.main values to control formatting.
 *
 * ## Variant Semantics
 *
 * ### 'en' Variant (Chicago-style, natural ordering)
 * - Used when separator="space"
 * - Inherits multi.main from main creator fields
 * - CJK creators: multi.main='zh/ja/ko' → romanesque=1 → "Du Weisheng" (no comma)
 * - English creators: multi.main='en' → romanesque=2 → "John Smith" (natural)
 *
 * ### 'en-x-western' Variant (APA-style, CSL-controlled)
 * - Used when separator="comma"
 * - Sets multi.main='en' to force romanesque=2
 * - This makes citeproc RESPECT CSL's name-as-sort-order attribute
 * - With name-as-sort-order="all": "Du, W." (inverted with comma)
 * - Without name-as-sort-order: "W. Du" (direct)
 *
 * ## Container Creator Problem (APA-specific)
 *
 * APA has a quirk: editors in book chapters ("In Editor (Ed.), Book") lack
 * name-as-sort-order in the CSL file. This is correct for English names
 * (should be "A. Morrison" in direct order), but breaks CJK names.
 *
 * With multi.main='en' (romanesque=2), CJK editors become "S. Lin" (direct)
 * instead of "Lin S." (family-first).
 *
 * **Solution**: For container creators (editor, translator), use multi.main=originalLang
 * to trigger romanesque=1 automatic family-first formatting.
 *
 * Result:
 * - CJK editor: multi.main='zh' → romanesque=1 → "Lin S." ✓
 * - English editor (no CNE): multi.main='en' via main → "A. Morrison" ✓
 *
 * This is language-based (robust), not position-based (fragile).
 *
 * @module nameVariantBuilder
 */

/**
 * Container Creator Roles
 *
 * These are creators that appear in container context (e.g., "In Editor (Ed.), Book")
 * rather than as primary creators of the work.
 *
 * In most citation styles, container creators lack name-as-sort-order attributes
 * because English names should be in direct order ("A. Morrison").
 *
 * For CJK names with separator="comma", these roles need special handling:
 * we set multi.main=originalLang to trigger automatic family-first formatting
 * via romanesque=1, bypassing the lack of CSL attributes.
 *
 * This is a bibliographic distinction, not style-specific.
 */
const CONTAINER_CREATOR_ROLES = ['editor', 'translator', 'collection-editor'] as const;

/**
 * Check if a creator role is a container creator
 *
 * @param role - Creator role (e.g., 'author', 'editor', 'translator')
 * @returns true if role is a container creator
 */
function isContainerCreator(role: string): boolean {
  return CONTAINER_CREATOR_ROLES.includes(role as any);
}

/**
 * Variant Configuration
 *
 * Parameters needed to determine the correct multi.main value for a name variant.
 */
export interface VariantConfig {
  /** Which variant tag we're building ('en' or 'en-x-western') */
  variantTag: 'en' | 'en-x-western';

  /** Creator's role (author, editor, translator, etc.) */
  creatorRole: string;

  /** Creator's original language (zh, ja, ko, etc.) */
  originalLang: string;

  /** Whether this creator has CNE romanization data */
  hasCNE: boolean;
}

/**
 * Get multi.main value for a name variant
 *
 * This is the core decision function that encapsulates all the romanesque-level
 * tricks we use to control name formatting.
 *
 * @param config - Variant configuration
 * @returns multi.main value to use (or undefined to inherit from main fields)
 *
 * @example
 * // Chicago author (natural ordering)
 * getVariantMultiMain({
 *   variantTag: 'en',
 *   creatorRole: 'author',
 *   originalLang: 'zh',
 *   hasCNE: true
 * })
 * // Returns: undefined (inherits 'zh' → "Du Weisheng")
 *
 * @example
 * // APA author (CSL-controlled with comma)
 * getVariantMultiMain({
 *   variantTag: 'en-x-western',
 *   creatorRole: 'author',
 *   originalLang: 'zh',
 *   hasCNE: true
 * })
 * // Returns: 'en' (romanesque=2 → respects name-as-sort-order="all" → "Du, W.")
 *
 * @example
 * // APA editor (container creator, needs family-first)
 * getVariantMultiMain({
 *   variantTag: 'en-x-western',
 *   creatorRole: 'editor',
 *   originalLang: 'zh',
 *   hasCNE: true
 * })
 * // Returns: 'zh' (romanesque=1 → auto family-first → "Lin S.")
 */
export function getVariantMultiMain(config: VariantConfig): string | undefined {
  // 'en' variant: ALWAYS inherit multi.main from main fields
  // This gives natural ordering for both CJK and English names
  if (config.variantTag === 'en') {
    return undefined;  // Inherit → CJK gets romanesque=1, English gets romanesque=2
  }

  // 'en-x-western' variant: used with separator="comma" (APA-style)
  // Strategy: Role-based multi.main to handle CJK container creators
  if (config.variantTag === 'en-x-western') {
    // Container creators (editor, translator) need special handling
    // to get family-first formatting without CSL name-as-sort-order
    if (isContainerCreator(config.creatorRole) && config.hasCNE) {
      return config.originalLang;  // Force romanesque=1 → "Lin S."
    }

    // Primary creators (author, director, etc.) use 'en' for romanesque=2
    // This lets CSL name-as-sort-order control inversion
    return 'en';  // Romanesque=2 → "Du, W." with name-as-sort-order="all"
  }

  // Default: inherit
  return undefined;
}

/**
 * Build a name variant object
 *
 * Creates the complete multi._key entry with proper multi.main value.
 *
 * @param config - Variant configuration
 * @param family - Romanized family name
 * @param given - Romanized given name
 * @returns Name variant object ready for multi._key
 */
export function buildNameVariant(
  config: VariantConfig,
  family: string,
  given: string
): any {
  const multiMain = getVariantMultiMain(config);

  const variant: any = {
    family: family || '',
    given: given || ''
  };

  // Only add multi.main if we're overriding (not inheriting)
  if (multiMain) {
    variant.multi = {
      main: multiMain
    };
  }

  return variant;
}
