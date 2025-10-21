/**
 * APA 7th Edition CNE - Chinese Source Expectations
 *
 * Expected formatted output for Chinese sources following APA 7th edition
 * style with CNE (Cite Non-English) enhancements.
 *
 * Format: Romanized + [English Translation]
 *
 * APA style does NOT include original script (unlike Chicago style).
 * Only romanized form and English translation in brackets are shown.
 *
 * Based on Yale University Library's citation guide:
 * https://guides.library.yale.edu/c.php?g=296262&p=1974231
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const chineseExpectations: Record<string, string> = {
  /**
   * Chinese Book - Hao (1998)
   *
   * APA Format:
   * Author. (Year). Title [Translation]. Publisher.
   *
   * Note: APA 7th edition no longer requires location for publishers
   */
  [FIXTURE_IDS.ZHCN_HAO_1998_TANG]:
    `Hao, C. (1998). <i>Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo</i> [The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song]. Zhongguo shehui kexue chubanshe.`,

  /**
   * Chinese Journal Article - Hua (1999)
   *
   * APA Format:
   * Author. (Year). Article title [Translation]. Journal Title, Volume(Issue), Pages.
   *
   * Note: Article titles are NOT italicized in APA
   * Note: Journal title and volume are italicized
   */
  [FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI]:
    `Hua, L. (1999). Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]. <i>Zhongguo shehui kexue</i>, <i>1</i>, 168–179.`,

  /**
   * Chinese Database - Beijing Airusheng (2011)
   *
   * APA Format:
   * Author/Organization. (Year). Title [Translation] [Dataset]. Publisher. URL
   */
  [FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011]:
    `Beijing Airusheng shuzihua jishu yanjiu zhongxin. (2011). <i>Zhongguo jiben guji ku</i> [Database of Chinese Classic Ancient Books] [Dataset]. Beijing Airusheng shuzihua jishu yanjiu zhongxin. <a href="http://server.wenzibase.com/dblist.jsp">http://server.wenzibase.com/dblist.jsp</a>`,

  /**
   * Chinese Film - Jia (2010)
   *
   * APA Format:
   * Director. (Year). Title [Translation] [Film]. Production Company.
   */
  [FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI]:
    `Jia, Z. (Director). (2010). <i>Ershisi cheng ji</i> [24 City] [Film]. Cinema Guild.`,

  /**
   * Chinese Book Chapter - Du (2007)
   *
   * APA Format:
   * Author. (Year). Chapter title [Translation]. In Editor (Ed.), Book title [Translation] (pp. Pages). Publisher.
   */
  [FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG]:
    `Du, W. (2007). Dunhuang yishu yongzhi gaikuang ji qianxi [An analysis and description of the use of paper in Dunhuang manuscripts]. In Lin S. & A. Morrison (Eds.), <i>Rongshe yu chuangxin: guoji Dunhuang xiangmu diliuci huiyi lunwenji</i> [Tradition and innovation: Proceedings of the 6th International Dunhuang Project conservation conference] (pp. 67–84). Beijing tushuguan chubanshe.`,

  /**
   * Chinese Newspaper Article - Sha (2014)
   *
   * APA Format:
   * Author. (Year, Month Day). Article title [Translation]. Newspaper Title, Page.
   */
  [FIXTURE_IDS.ZHCN_SHA_2014_SHIKU]:
    `Sha, W. (2014, January 8). Shiku kaogu kaipi Dunghuangxue yanjiu xinlingyu [Cave archeology to open a new field for Dunhuang studies]. <i>Zhongguo shehui kexuebao</i>.`,
};
