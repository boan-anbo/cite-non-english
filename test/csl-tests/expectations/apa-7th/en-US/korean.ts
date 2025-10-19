/**
 * APA 7th Edition CNE - Korean Source Expectations
 *
 * Expected formatted output for Korean sources following APA 7th edition
 * style with CNE (Cite Non-English) enhancements.
 *
 * Format: Romanized + [English Translation]
 *
 * APA style does NOT include original script (unlike Chicago style).
 * Only romanized form and English translation in brackets are shown.
 *
 * Based on Yale University Library's citation guide:
 * https://guides.library.yale.edu/c.php?g=296262&p=1974231
 *
 * Note: Korean sources in the fixtures use romanized text as the main title,
 * which is common for Korean materials as Hangul is often romanized for
 * international citations.
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const koreanExpectations: Record<string, string> = {
  /**
   * Korean Book - Kang (1990)
   *
   * APA Format:
   * Author. (Year). Title [Translation]. Publisher.
   */
  [FIXTURE_IDS.KO_KANG_1990_WONYUNG]:
    `Kang, U. (1990). <i>Wŏnyung kwa chohwa: Han’guk kodae chogaksa ŭi wŏlli</i> [Synthesis and harmony: Principle of the history of ancient Korean sculpture]. Yŏrhwadang.`,

  /**
   * Korean Journal Article - Han (1991)
   *
   * APA Format:
   * Author. (Year). Article title [Translation]. Journal Title, Volume(Issue), Pages.
   *
   * Note: Article titles are NOT italicized
   * Note: Journal title and volume are italicized
   */
  [FIXTURE_IDS.KO_HAN_1991_KYONGHUNG]:
    `Han, T. (1991). Kyŏnghŭng ŭi saengae e kwanhan chae koch’al [Re-examination of the life of Kyŏnghŭng]. <i>Pulgyo hakpo</i>, <i>28</i>(1), 187–213.`,

  /**
   * Korean Book Chapter - Ha (2000)
   *
   * APA Format:
   * Author. (Year). Chapter title [Translation]. In Editor (Ed.), Book title [Translation] (pp. Pages). Publisher.
   */
  [FIXTURE_IDS.KO_HA_2000_TONGSAM]:
    `Ha, I. (2000). Tongsam-dong P’aech’ong chŏnghwa chiyŏk palgul sŏngkwa [Result of the excavation on the shell mounds in Tongsam-dong purification region]. In Han’guk Kogo Hakhoe (Ed.), <i>Kogohak ŭl tonghae pon Kaya</i> [Kaya seen through archaeology] (pp. 111–133). Han’guk Kogo Hakhoe.`,

  /**
   * Korean Newspaper Article - Chu (2008)
   *
   * APA Format:
   * Author. (Year, Month Day). Article title [Translation]. Newspaper Title, Page.
   */
  [FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG]:
    `Chu, Y. (2008, May 8). Mi sŏ kwangupyŏng palsaeng hamyŏn suip chungdan [Will suspend the import if mad cow disease attacks in the United States]. <i>Chosŏn Ilbo</i>.`,
};
