/**
 * MLA 9th Edition CNE - English Source Expectations
 *
 * Expected formatted output for English sources (baseline/control tests).
 * These test that the CNE style handles standard English sources correctly
 * without CNE-specific modifications.
 *
 * Based on MLA 9th edition standard formatting.
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const englishExpectations: Record<string, string> = {
  /**
   * English Book Chapter - Petrides et al. (2004)
   *
   * MLA Format:
   * Author, et al. “Chapter Title.“ Book Title, edited by Editors, Publisher, Year, pp. Pages.
   *
   * Note: This tests that CNE style handles standard English sources correctly
   * Note: Multiple authors: first author inverted, others in natural order
   * Note: Editors NOT inverted: “edited by S. N. Caroff, S. C. Mann, and A. Francis“
   */
  [FIXTURE_IDS.EN_PETRIDES_2004_CONVULSIVE]:
    `Petrides, Georgios, et al. “Convulsive Therapy.” <i>Catatonia: From Psychopathology to Neurobiology</i>, edited by Stanley N. Caroff et al., American Psychiatric Association Publishing, 2004.`,
};
