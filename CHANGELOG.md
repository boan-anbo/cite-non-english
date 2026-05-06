# Changelog

## [0.1.7] - 2026-05-06

### Added

- Added a bundled Chicago 18 CNE style for **shortened notes and
  bibliography**:
  `Chicago Manual of Style 18th edition (shortened notes and bibliography) -
CNE`.
- Added CNE style configuration support for citation-only name slots. The new
  shortened-notes style keeps bibliography names as romanized + original script
  while rendering notes with romanized names only.

### Fixed

- Chicago shortened-note citations can now avoid original-script author names in
  notes while keeping full CNE bibliography entries. For example, the Dong
  Jianxia report case renders shortened notes like `Dong, “Jindai Shandong
kaibu,” 27` while the bibliography still renders `Dong Jianxia 董建霞` and the
  full romanized/original/translated title.
- The bundled Chicago shortened-notes CNE style is now generated from the
  current official Zotero `chicago-shortened-notes-bibliography` style instead
  of mirroring CNE's main Chicago notes template. This preserves upstream
  shortened-note behavior while layering CNE metadata, sorting, title,
  publisher, series, and legal-field support on top.
- `cne-title-romanized-short` is now parsed as the canonical Extra-field key
  for short romanized titles, with existing `cne-title-romanizedShort` data
  still accepted for compatibility.
- Added regression coverage for the existing Chicago notes style so first notes
  still include original script and subsequent notes still shorten to
  romanized-only author/title form.

## [0.1.6] - 2026-04-28

### Fixed

- Chicago 18 Author-Date CNE now renders ordinary CNE title fields in
  bibliography entries, matching the bundled Chicago notes style. For example,
  Japanese book and chapter titles now render romanized title, original script,
  and English translation such as `Saigo no “Nihonjin”: Asakawa Kan’Ichi no
shōgai` + `最後の「日本人」: 朝河貫一の生涯` + `[The last “Japanese”:
Life of Kan’ichi Asakawa]`.
- Chicago 18 Author-Date CNE now uses the documented Chicago CJK name default:
  surname-first romanization without Western comma inversion, e.g. `Abe Yoshio
阿部善雄`, `Kondō Shigekazu 近藤成一`, and `Hao Chunwen 郝春文`, instead of
  `Abe, Yoshio` / `Kondō, Shigekazu`.
- Per-creator `force-comma` overrides are preserved for CJK names that need
  Western-style comma formatting, e.g. `Kim, Minsoo 김민수`.
- Plain English items in Chicago 18 Author-Date continue to use normal Chicago
  Western name formatting, e.g. `Petrides, Georgios, Chitra Malur, and Max
Fink`.

### Tested

- Verified on Zotero 9.
- `npm run lint:check`
- `npm run build`
- `ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/Applications/Zotero.app/Contents/MacOS/zotero npm test`
  passes with 124 tests.

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
