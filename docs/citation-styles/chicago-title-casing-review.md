# Chicago native casing: v0.1.9 repair and evidence

Reviewed 2026-09-06 against v0.1.8/main
`7f47368862bc89d6bb07354167bf2d74c17e7cc0`. The abandoned experimental
checkout is not the baseline.

## Problem and original design

[Issue 17](https://github.com/boan-anbo/cite-non-english/issues/17) reports an
English article stored in sentence case. Standard Chicago renders “Positive and
Problematic Aspects”; CNE Chicago left it as “Positive and problematic aspects”.
Users should keep native titles in sentence case and let each style format them.
The [CSL specification](https://docs.citationstyles.org/en/v1.0.2/specification.html#text-case)
explains why converting stored title case back to sentence case cannot reliably
preserve proper nouns.

CNE romanization deliberately preserves entered capitalization, including proper
nouns such as `Sanxia` in the existing Chinese fixtures. That remains unchanged.
The defect was replacing native variable output with a selector macro while
leaving `text-case` on the macro invocation. The tested citeproc engines do not
apply that attribute through the macro. This structure was already present in
the earliest production Chicago file at `8a85b27` (2025-10-15); it is not a new
upgrade fallback requirement.

The existing English fixture had already-cased titles and tested creator
formatting. It could not detect sentence-to-title-case conversion failures.

## Repair boundary

- All three Chicago variants apply the existing native item-title casing rules
  directly at variable output, including shortened notes. Branches deliberately
  using sentence case retain their upstream behavior.
- Notes & Bibliography and Shortened Notes & Bibliography also restore native
  container/journal and series title casing, and bibliography publisher
  capitalize-first. Publisher output in notes keeps its existing casing rule.
- Native patent titles explicitly honor upstream `form="short"`. This repairs
  short-title selection as well as capitalization. Tests use opposing full and
  short titles and compare both bibliography order and successive citations
  against retained upstream styles.
- CNE field selection priority, entered variants, and native-series suppression
  for CNE-managed items remain unchanged. No new fallback, alias, global casing
  transform, or runtime hook is added.

Author-Date already matched native upstream behavior for the four adjacent
fields below. It does not contain the two notes variants' CNE field selectors;
this release does not add those capabilities to Author-Date.

## Adjacent native fields

Each comparison uses an already-cased item Title, `en-US`, no CNE metadata, and
varies one field. The expected full output comes from the corresponding retained
upstream template. The table records v0.1.8 failures; all listed comparisons pass
with the repair, in bibliography and successive citation output.

| Native input field and value                 | Upstream field rendering     | N/B before | Shortened N/B before | Author-Date before |
| -------------------------------------------- | ---------------------------- | ---------- | -------------------- | ------------------ |
| Journal: `Journal of Buddhist ethics`        | `Journal of Buddhist Ethics` | Gap        | Gap                  | Matches            |
| Chapter's book: `History of modern Buddhism` | `History of Modern Buddhism` | Gap        | Matches              | Matches            |
| Series: `Studies in modern religion`         | `Studies in Modern Religion` | Gap        | Gap                  | Matches            |
| Publisher: `example university press`        | `Example university press`   | Gap        | Gap                  | Matches            |

## Validation and practical effect

- Before the adjacent-field repair, the expanded native regression run had
  **189 passing and 7 failing tests**, with all failures confined to those fields.
- After repair, **205 tests passed**, including explicit CNE field casing and
  selection checks for both notes variants. The scratch profile was seeded with
  all seven v0.1.8 styles; the startup check confirmed replacement with current
  bundled contents before fixture setup. Existing fixtures and expectations
  were not rewritten.
- Tests cover the reported article, native title item types, `en-US`, `en`,
  `English`, French, missing Language, explicit romanization with English item
  language, shortened notes, patent short titles, and bibliography sorting.
- For an English-default style, missing Language follows CSL's existing English
  treatment. A native French title marked `fr` retains its casing. There is no
  new CNE language inference.

The repair changes rendered references, not stored Title or Extra fields. The
existing installer updates bundled CNE styles when installed content differs.
After upgrading and refreshing a document, many native English titles may
therefore change together. Explicit CNE romanization keeps its entered casing.

Integration validation uses Zotero 10.0. The reporter's exact 10.0.1 environment
and a Word document refresh were not exercised. This is bounded regression
coverage, not a claim of complete Chicago parity across all item types and fields.
