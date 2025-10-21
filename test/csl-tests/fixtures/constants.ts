/**
 * Shared constants for CSL test fixtures
 *
 * These IDs are used by both fixture definitions and test expectations
 * to ensure consistency and prevent typos.
 */

/**
 * All fixture IDs across languages
 * Used as keys in unified fixtures and expectations
 *
 * Naming convention: {LANG}_{AUTHOR}_{YEAR}_{KEYWORD}
 * - ZHCN: Chinese (Simplified)
 * - JA: Japanese
 * - KO: Korean
 */
export const FIXTURE_IDS = {
  // Chinese fixtures (zh-CN)
  ZHCN_HAO_1998_TANG: 'hao-1998-tang',
  ZHCN_HUA_1999_QINGDAI: 'hua-1999-qingdai',
  ZHCN_BEIJING_AIRUSHENG_2011: 'beijing-airusheng-2011',
  ZHCN_JIA_2010_ERSHISI: 'jia-2010-ershisi',
  ZHCN_DU_2007_DUNHUANG: 'du-2007-dunhuang',
  ZHCN_DU_2007_DUNHUANG_REV: 'du-2007-dunhuang-rev',  // Same as du-2007 but editors reversed (English first)
  ZHCN_SHA_2014_SHIKU: 'sha-2014-shiku',

  // Japanese fixtures (ja)
  JA_ABE_1983_SAIGO: 'abe-1983-saigo',
  JA_KONDO_2013_YALE: 'kondo-2013-yale',
  JA_OZU_1953_TOKYO: 'ozu-1953-tokyo',
  JA_YOSHIMI_2012_MOHITOTSU: 'yoshimi-2012-mohitotsu',

  // Korean fixtures (ko)
  KO_KANG_1990_WONYUNG: 'kang-1990-wonyung',
  KO_HAN_1991_KYONGHUNG: 'han-1991-kyonghung',
  KO_HA_2000_TONGSAM: 'ha-2000-tongsam',
  KO_CHU_2008_KWANGUPYONG: 'chu-2008-kwangupyong',

  // English fixtures (en) - for testing non-CNE behavior
  EN_PETRIDES_2004_CONVULSIVE: 'petrides-2004-convulsive',
} as const;

/**
 * Type for fixture ID values (the actual string IDs)
 */
export type FixtureId = typeof FIXTURE_IDS[keyof typeof FIXTURE_IDS];
