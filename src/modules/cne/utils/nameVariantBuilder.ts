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

  /** Force comma separator in romanized name (for CJK names that default to space) */
  forceComma?: boolean;
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
  // ============================================================================
  // 'en' variant: CJK Romanization Without Commas (Chicago/MLA style)
  // ============================================================================
  //
  // GOAL: Display romanized CJK names in family-first order WITHOUT comma
  // Examples: "Hao Chunwen", "Abe Yoshio", "Kang U-bang" (not "Hao, Chunwen")
  //
  // CITEPROC BUG: Korean romanization gets commas due to incomplete language list
  //
  // Background: Citeproc-js _isRomanesque() function (lines 13771-13779) checks
  // if romanesque names should be downgraded to "mixed content" (romanesque=1)
  // when item has Asian language code:
  //
  //   if (ret == 2) {  // Pure romanesque (Latin characters)
  //     if (["ja", "zh"].indexOf(top_locale) > -1) {  // ← BUG: 'ko' missing!
  //       ret = 1;  // Downgrade to mixed content → family-first, no comma
  //     }
  //   }
  //
  // This causes inconsistent behavior:
  // - Chinese: multi.main='zh' → downgraded → romanesque=1 → "Hao Chunwen" ✓
  // - Japanese: multi.main='ja' → downgraded → romanesque=1 → "Abe Yoshio" ✓
  // - Korean: multi.main='ko' → NOT downgraded → romanesque=2 → "Kang, U-bang" ✗
  //
  // WORKAROUND: Use 'zh' for ALL CJK romanized names
  //
  // By setting multi.main='zh' for all CJK romanizations (Chinese, Japanese, AND
  // Korean), we force citeproc to trigger the downgrade mechanism, ensuring
  // consistent family-first formatting without commas across all CJK languages.
  //
  // IMPORTANT DISCLAIMER - Political/Cultural Sensitivity:
  //
  // Using 'zh' (Chinese) as the language tag for Korean romanization is
  // SEMANTICALLY INCORRECT and potentially politically sensitive. This is purely
  // a technical workaround for a citeproc-js bug, NOT a statement about linguistic
  // or cultural relationships between languages.
  //
  // - For Japanese: More acceptable since Japanese uses Chinese characters (kanji)
  // - For Korean: Purely technical hack; does NOT imply Korean is "Chinese-based"
  //
  // This workaround is necessary for functional correctness (consistent formatting)
  // but should be removed if citeproc-js is ever fixed to include 'ko' in the
  // language downgrade list.
  //
  // Technical justification: The multi.main value here controls NAME FORMATTING
  // BEHAVIOR only (comma vs no-comma), not linguistic or cultural classification.
  // ============================================================================
  if (config.variantTag === 'en') {
    if (config.hasCNE) {
      // Use 'zh' for ALL CJK to trigger citeproc's romanesque downgrade
      // (See detailed explanation above for why this is necessary)
      return 'zh';  // Force romanesque=1 for all CJK → "Kang U-bang" (no comma)
    }
    return 'en';  // Non-CNE creators stay romanesque=2 → "John Smith"
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
 * Creates the complete multi._key entry with proper multi.main value and
 * optional comma injection for per-author comma control.
 *
 * ## Comma Injection Strategy
 *
 * Problem: Citeproc-js hardcodes comma behavior based on romanesque level:
 * - romanesque=1 (multi.main='zh'): family-first, NO comma → "Du Weisheng"
 * - romanesque=2 (multi.main='en'): CSL-controlled → depends on style
 *
 * For CJK names with force-comma option, we need commas across ALL styles
 * (including Chicago/MLA that lack name-as-sort-order attribute).
 *
 * Solution: Inject comma directly into the given name string:
 * - Normal: { family: "Du", given: "Weisheng" } → "Du Weisheng"
 * - Force-comma: { family: "Du", given: ", Weisheng" } → "Du, Weisheng"
 *
 * This works because:
 * - We keep romanesque=1 (family-first ordering)
 * - Comma becomes part of the string data (citeproc just concatenates)
 * - Works in ALL citation styles (Chicago, MLA, APA, etc.)
 *
 * Trade-off: This is a string manipulation hack, but it's the only way to
 * achieve style-independent comma control without modifying citeproc-js.
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

  // COMMA INJECTION: For CJK names with force-comma option
  //
  // Inject comma suffix to family name to bypass citeproc's hardcoded
  // no-comma behavior for romanesque=1 (multi.main='zh'/'ja'/'ko').
  //
  // Strategy: Append comma to family name instead of prepending to given.
  // Citeproc concatenates: family + " " + given
  // So "Kim," + " " + "Minsoo" = "Kim, Minsoo" ✓
  let processedFamily = family;
  if (config.forceComma && family) {
    processedFamily = `${family},`;  // Append comma to family name
  }

  const variant: any = {
    family: processedFamily || '',
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
