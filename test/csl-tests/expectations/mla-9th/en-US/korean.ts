/**
 * MLA 9th Edition CNE - Korean Source Expectations
 *
 * Expected formatted output for Korean sources following MLA 9th edition
 * style with CNE (Cite Non-English) enhancements.
 *
 * Format: Romanized + Original Script + [English Translation]
 *
 * Based on Yale University Library’s MLA citation guide:
 * https://guides.library.yale.edu/c.php?g=296262&p=1974230
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const koreanExpectations: Record<string, string> = {
  /**
   * Korean Book - Kang (1990)
   *
   * MLA Format:
   * Author Romanized Original. Title Romanized Original [Translation]. Publisher, Year.
   *
   * Note: Korean names in surname-first order
   */
  [FIXTURE_IDS.KO_KANG_1990_WONYUNG]:
    `Kang, U-bang. <i>Wŏnyung kwa chohwa: Han’guk kodae chogaksa ŭi wŏlli</i> [Synthesis and harmony: Principle of the history of ancient Korean sculpture]. Yŏrhwadang, 1990.`,

  /**
   * Korean Journal Article - Han (1991)
   *
   * MLA Format:
   * Author. “Article Title Romanized“ Original [Translation]. Journal Romanized Original Issue (Year): Pages.
   */
  [FIXTURE_IDS.KO_HAN_1991_KYONGHUNG]:
    `Han, T’ae-sik. “Kyŏnghŭng ŭi saengae e kwanhan chae koch’al” [Re-examination of the life of Kyŏnghŭng]. <i>Pulgyo Hakpo</i>, vol. 28, no. 1, 1991, pp. 187–213.`,

  /**
   * Korean Book Chapter - Ha (2000)
   *
   * MLA Format:
   * Author. “Chapter Title Romanized“ Original [Translation]. Book Title Romanized Original [Translation], Publisher, Year, pp. Pages.
   */
  [FIXTURE_IDS.KO_HA_2000_TONGSAM]:
    `Ha, In-su. “Tongsam-dong P’aech’ong chŏnghwa chiyŏk palgul sŏngkwa” [Result of the excavation on the shell mounds in Tongsam-dong purification region]. <i>Kogohak ŭl tonghae pon Kaya</i> [Kaya seen through archaeology], edited by Han’guk Kogo Hakhoe, Han’guk Kogo Hakhoe, 2000, pp. 111–33.`,

  /**
   * Korean Newspaper Article - Chu (2008)
   *
   * MLA Format:
   * Author. “Article Title Romanized“ Original [Translation]. Newspaper Romanized Original Day Month Year: Page.
   */
  [FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG]:
    `Chu, Yong-jung. “Mi sŏ kwangupyŏng palsaeng hamyŏn suip chungdan” [Will suspend the import if mad cow disease attacks in the United States]. <i>Chosŏn Ilbo</i>, 8 May 2008.`,
};
