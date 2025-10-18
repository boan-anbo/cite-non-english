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
    `Hua Linfu 华林甫. “Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu” 清代以来三峡地区水旱灾害的初步研究 [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]. <i>Zhongguo shehui kexue</i> 中国社会科学 1 (1999): 168–79. `,

  [FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011]:
    // TODO: Add expected output after running test
    ``,

  [FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI]:
    // TODO: Add expected output after running test
    ``,

  [FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG]:
    `Du Weisheng 杜伟生. “Dunhuang yishu yongzhi gaikuang ji qianxi” 敦煌遗书用纸概况及浅析 [An analysis and description of the use of paper in Dunhuang manuscripts]. In <i>Rongshe yu chuangxin: guoji Dunhuang xiangmu diliuci huiyi lunwenji</i> 融攝与创新: 国际敦煌项目第六次会议论文集 [Tradition and innovation: Proceedings of the 6th International Dunhuang Project conservation conference], edited by Lin Shitian 林世田 and Alastair Morrison. Beijing tushuguan chubanshe, 2007.`,

  [FIXTURE_IDS.ZHCN_SHA_2014_SHIKU]:
    // TODO: Add expected output after running test
    ``
};
