# Changelog

## [0.1.3] - 2026-04-27

### Fixed

- Chicago 18 Notes & Bibliography CNE now preserves publisher field fidelity:
  `cne-publisher-romanized` is preferred, then `cne-publisher-original`, then
  the native Zotero `publisher` field.
- Chicago 18 CNE no longer leaks Zotero's native `series` / `seriesNumber`
  into citations for CNE-managed items unless `cne-series-*` metadata is
  explicitly present.
- Style variant generation now assigns variants by generated diff headers
  instead of broad CSL metadata links, avoiding cross-template routing between
  related styles.

### Tested

- Verified on Zotero 9.0.1.
- `npm run build`
- `ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/Applications/Zotero.app/Contents/MacOS/zotero npm test`
  passes with 85 tests.

### Notes

- This release addresses Zotero 9 installation/use and the Chicago CNE
  publisher/series regression reported in Chinese Studies workflows.
- European-language aliases, localized place/name variants, mixed-language
  bibliography sorting, and CSL-m compatibility remain future work.
