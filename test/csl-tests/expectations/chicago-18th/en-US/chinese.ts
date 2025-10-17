import { FIXTURE_IDS } from '../../../fixtures/constants';

/**
 * Expected bibliography output for Chinese fixtures
 * Chicago 18th Edition (Notes and Bibliography) - CNE variant
 * Style locale: en-US
 *
 * Each entry contains the EXACT expected HTML string for that fixture.
 * These expectations are used for precise unit testing with exact string matching.
 *
 * TODO: Run tests in UPDATE mode to generate actual output, then copy here
 */

export const chineseExpectations: Record<string, string> = {
  [FIXTURE_IDS.ZHCN_HAO_1998_TANG]:
    // TODO: Add expected output after running test
    ``,

  [FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI]:
    // TDD: Expected output with romanized journal title italicized (not original)
    `<div class="csl-entry" style="margin-bottom: 1em;">Hua Linfu 华林甫. "Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu" 清代以来三峡地区水旱灾害的初步研究 [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]. <i>Zhongguo shehui kexue</i> 中国社会科学 1 (1999): 168–79.</div>`,

  [FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011]:
    // TODO: Add expected output after running test
    ``,

  [FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI]:
    // TODO: Add expected output after running test
    ``,

  [FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG]:
    // TODO: Add expected output after running test
    ``,

  [FIXTURE_IDS.ZHCN_SHA_2014_SHIKU]:
    // TODO: Add expected output after running test
    ``
};
