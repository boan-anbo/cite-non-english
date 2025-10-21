/**
 * Chicago 18th Edition - English Source Expectations
 *
 * Expected formatted output for English sources following Chicago 18th edition style.
 * These test the baseline behavior without CNE enhancements.
 */

import { FIXTURE_IDS } from '../../../fixtures/constants';

export const englishExpectations: Record<string, string> = {
  /**
   * English Book Chapter - Petrides et al. (2004)
   *
   * Chicago Format:
   * Authors: Direct order in bibliography
   * Editors: Direct order, "edited by First Last"
   */
  [FIXTURE_IDS.EN_PETRIDES_2004_CONVULSIVE]:
    `Petrides, Georgios, Chitra Malur, and Max Fink. “Convulsive Therapy.” In <i>Catatonia: From Psychopathology to Neurobiology</i>, edited by Stanley N. Caroff, Stephan C. Mann, and Andrew Francis. American Psychiatric Association Publishing, 2004.`,
};
