/**
 * APA 7th Edition CNE - Japanese Source Expectations
 *
 * Expected formatted output for Japanese sources following APA 7th edition
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

export const japaneseExpectations: Record<string, string> = {
  /**
   * Japanese Book - Abe & Kaneko (1983)
   *
   * APA Format:
   * Author. (Year). Title [Translation]. Publisher.
   */
  [FIXTURE_IDS.JA_ABE_1983_SAIGO]:
    `Abe, Y., & Kaneko, H. (1983). <i>Saigo no “Nihonjin”: Asakawa Kan’Ichi no shōgai</i> [The last “Japanese”: Life of Kan’ichi Asakawa]. Iwanami Shoten.`,

  /**
   * Japanese Journal Article - Kondō (2013)
   *
   * APA Format:
   * Author. (Year). Article title [Translation]. Journal Title, Volume(Issue), Pages.
   *
   * Note: Article titles are NOT italicized
   * Note: Journal title and volume are italicized
   */
  [FIXTURE_IDS.JA_KONDO_2013_YALE]:
    `Kondō, S. (2013). Yēru Daigaku Shozō Harima no Kuni Ōbe no Shō Kankei Monjo ni Tsuite [On Harima no Kuni Ōbe no Shō Kankei Monjo at Yale University Collection]. <i>Tokyō Daigaku Shiryō Hensanjo Kenkyū Kiyō</i>, <i>23</i>, 1–22.`,

  /**
   * Japanese Film - Ozu (1953)
   *
   * APA Format:
   * Director. (Year). Title [Translation] [Video recording]. Production Company.
   *
   * Note: This example doesn't have an English translation in the fixture
   */
  [FIXTURE_IDS.JA_OZU_1953_TOKYO]:
    `Ozu, Y. (Director). (1953). <i>Tōkyō Monogatari</i> [Video recording]. Shōchiku.`,

  /**
   * Japanese Book Chapter - Yoshimi (2012)
   *
   * APA Format:
   * Author. (Year). Chapter title [Translation]. In Editor (Ed.), Book title [Translation] (pp. Pages). Publisher.
   */
  [FIXTURE_IDS.JA_YOSHIMI_2012_MOHITOTSU]:
    `Yoshimi, S. (2012). Mōhitotsu no media to shite no hakurankai: Genshiryoku Heiwa Riyōhaku no juyō [Expo as another media: reception of Atoms for Peace]. In <i>Senryō suru me senryō suru koe: CIE/USIS eia to VOA rajio</i> [Occupying Eyes, Occupying Voices: CIE/USIS Films and VOA Radio in Asia during the Cold War] (pp. 291–315). Tōkyō Daigaku Shuppan.`,
};
