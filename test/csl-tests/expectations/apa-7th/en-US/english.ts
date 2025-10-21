/**
 * APA 7th Edition - English Source Expectations
 *
 * Expected formatted output for English sources following APA 7th edition style.
 * These test the baseline behavior without CNE enhancements to ensure our
 * abstraction doesn't break standard English name formatting.
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const englishExpectations: Record<string, string> = {
  /**
   * English Book Chapter - Petrides et al. (2004)
   *
   * APA Format:
   * Authors: All inverted with commas (name-as-sort-order="all")
   * Editors: Direct order, no inversion (no name-as-sort-order for container editors)
   *
   * Tests that English editors stay in direct order: "S. N. Caroff, S. C. Mann, & A. Francis"
   * NOT inverted: "Caroff, S. N., Mann, S. C., & Francis, A."
   */
  [FIXTURE_IDS.EN_PETRIDES_2004_CONVULSIVE]:
    `Petrides, G., Malur, C., &amp; Fink, M. (2004). Convulsive Therapy. In S. N. Caroff, S. C. Mann, &amp; A. Francis (Eds.), <i>Catatonia: From Psychopathology to Neurobiology</i>. American Psychiatric Association Publishing.`,
};
