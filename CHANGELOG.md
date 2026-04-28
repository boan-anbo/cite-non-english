# Changelog

## [0.1.5] - 2026-04-28

### Fixed

- Legislation/statute items, including Zotero's German UI type `Gesetz`, now
  render CNE title fields in bundled Chicago 18 Notes & Bibliography, Chicago
  18 Author-Date, and APA 7th CNE styles.
- Legislation/statute items now render a CNE issuing body/creator prefix only
  when `cne-creator-*` metadata is present, preserving native legal rendering
  for statute items without CNE creator metadata.

### Tested

- Verified on Zotero 9.
- `npm run lint:check`
- `npm run build`
- `ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/Applications/Zotero.app/Contents/MacOS/zotero npm test`
  passes with 120 tests.

## [0.1.4] - 2026-04-27

### Fixed

- Bibliographies in bundled CNE styles now sort mixed English and CJK entries
  together by CNE romanized creator/title keys instead of grouping non-English
  entries after English entries.
- CNE sorting now falls back to each base style's native primary-creator sort
  when the primary creator has no CNE romanization, so a romanized secondary
  editor/translator cannot override a native English author.
- No-creator CNE items now sort by `cne-title-romanized` when available.
- Narrow CNE item-pane fields now use responsive placeholder examples and stack
  creator name inputs before placeholders wrap awkwardly.

### Tested

- Verified on Zotero 9.0.1.
- `npm run lint:check`
- `npm run build`
- `ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/Applications/Zotero.app/Contents/MacOS/zotero npm test`
  passes with 109 tests.

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
