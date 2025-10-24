/**
 * CNE Configuration Module
 *
 * Handles parsing and validation of CNE-CONFIG metadata from CSL styles,
 * and applies configuration to citeproc engines.
 */

export {
  parseCNEConfigString,
  extractCNEConfigFromStyleXml,
  extractCNEConfigFromStyle,
  getDefaultCNEConfig,
  isValidCNEConfig,
  type CNEConfigOptions,
  type SlotValue,
  type FieldType,
} from './parseCNEConfig';

export {
  configureCiteprocForCNE,
  setCiteAffixes,
  setTransliterationTags,
  installCneLangPrefPatch,
} from './configureCiteproc';
