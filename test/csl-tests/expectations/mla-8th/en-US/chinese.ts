/**
 * MLA 8th Edition CNE - Chinese Source Expectations
 *
 * Expected formatted output for Chinese sources following MLA 9th edition
 * style with CNE (Cite Non-English) enhancements.
 *
 * Format: Romanized + Original Script + [English Translation]
 *
 * MLA style includes BOTH romanization AND original script (unlike APA).
 * Names appear in surname-first order without comma reversal.
 *
 * Based on Yale University Library’s MLA citation guide:
 * https://guides.library.yale.edu/c.php?g=296262&p=1974230
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const chineseExpectations: Record<string, string> = {
  /**
   * Chinese Book - Hao (1998)
   *
   * MLA Format:
   * Author Romanized Original. Title Romanized Original [Translation]. Publisher, Year.
   *
   * Note: No comma after surname in Asian names (surname-first order)
   * Note: Italics on romanized title only, not original script
   */
  [FIXTURE_IDS.ZHCN_HAO_1998_TANG]:
    `Hao, Chunwen 郝春文. <i>Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo</i> 唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song]. Zhongguo shehui kexue chubanshe, 1998.`,

  /**
   * Chinese Journal Article - Hua (1999)
   *
   * MLA Format:
   * Author. “Article Title Romanized“ Original [Translation]. Journal Romanized Original Issue (Year): Pages.
   *
   * Note: Article titles in quotation marks
   * Note: Journal title italicized (romanized part only)
   */
  [FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI]:
    `Hua, Linfu 华林甫. “Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu” 清代以来三峡地区水旱灾害的初步研究 [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]. <i>Zhongguo shehui kexue</i> 中国社会科学, vol. 1, 1999, pp. 168–79.`,

  /**
   * Chinese Database - Beijing Airusheng (2011)
   *
   * MLA 8 Format (different from MLA 9):
   * Organization. Title Romanized Original [Translation]. Publisher, Year. Web.
   * Note: MLA 8 uses italics for database titles, not quotes
   */
  [FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011]:
    `Beijing Airusheng shuzihua jishu yanjiu zhongxin 北京爱如生数字化技术研究中心. <i>Zhongguo jiben guji ku</i> 中国基本古籍库 [Database of Chinese Classic Ancient Books]. Beijing Airusheng shuzihua jishu yanjiu zhongxin, 2011, <a href="http://server.wenzibase.com/dblist.jsp">http://server.wenzibase.com/dblist.jsp</a>.`,

  /**
   * Chinese Film - Jia (2010)
   *
   * MLA 8 Format (different from MLA 9):
   * Title Romanized Original [Translation]. Directed by Director Romanized Original, Distributor, Year.
   * Note: MLA 8 does not include "Film." label
   */
  [FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI]:
    `<i>Ershisi cheng ji</i> 二十四城记 [24 City]. Directed by Zhangke Jia 贾樟柯, Cinema Guild, 2010.`,

  /**
   * Chinese Book Chapter - Du (2007)
   *
   * MLA Format:
   * Author. “Chapter Title Romanized“ Original [Translation]. Book Title Romanized Original [Translation], edited by Editors, Publisher, Year, pp. Pages.
   */
  [FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG]:
    `Du, Weisheng 杜伟生. “Dunhuang yishu yongzhi gaikuang ji qianxi” 敦煌遗书用纸概况及浅析 [An analysis and description of the use of paper in Dunhuang manuscripts]. <i>Rongshe yu chuangxin: guoji Dunhuang xiangmu diliuci huiyi lunwenji</i> 融攝与创新: 国际敦煌项目第六次会议论文集 [Tradition and innovation: Proceedings of the 6th International Dunhuang Project conservation conference], edited by Lin Shitian 林世田 and Alastair Morrison, Beijing tushuguan chubanshe, 2007, pp. 67–84.`,

  /**
   * Chinese Newspaper Article - Sha (2014)
   *
   * MLA Format:
   * Author. “Article Title Romanized“ Original [Translation]. Newspaper Romanized Original Day Month Year: Page.
   */
  [FIXTURE_IDS.ZHCN_SHA_2014_SHIKU]:
    `Sha, Wutian 沙武田. “Shiku kaogu kaipi Dunghuangxue yanjiu xinlingyu” 石窟考古开辟敦煌学研究新领域 [Cave archeology to open a new field for Dunhuang studies]. <i>Zhongguo shehui kexuebao</i> 中国社会科学报, 8 Jan. 2014.`,
};
