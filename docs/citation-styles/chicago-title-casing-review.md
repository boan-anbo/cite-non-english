# Chicago title casing: scope and evidence

Reviewed 2026-09-06 against release/main `7f47368862bc89d6bb07354167bf2d74c17e7cc0`
and the local title patch at `86c4ccc04fe80e7dea9ba4af2024a281da3903a9`.
The abandoned experimental checkout is not the baseline.

## What issue 17 reports

[Issue 17](https://github.com/boan-anbo/cite-non-english/issues/17) concerns an
ordinary English journal article. Its native Zotero Title is stored in sentence
case. Standard Chicago renders the opening as “Positive and Problematic Aspects”;
CNE Chicago leaves it as “Positive and problematic aspects”. Both `English` and
`en-US` were tried in the native Language field.

Storing sentence case is appropriate: the style chooses output casing. The
[CSL specification](https://docs.citationstyles.org/en/v1.0.2/specification.html#text-case)
explains why converting stored title case back to sentence case cannot reliably
preserve proper nouns. Users should not have to rewrite library data to switch
between APA and Chicago.

## Original design and the defect

The existing README explicitly distinguishes `Qingdai yilai Sanxia ...` from
English title casing. The CJK fixtures preserve entered romanization, including
proper nouns. That behavior is intentional.

Chicago's upstream title branches apply `text-case` directly to a native variable.
The CNE adaptation replaced that variable with a selector macro, retaining the
attribute on the macro call. In the tested citeproc engines this does not apply
the upstream casing to the selected native value. The same structure is already
present in the earliest production Chicago file at `8a85b27` (2025-10-15). This
establishes an old implementation defect; it does not prove which historical
Zotero versions exhibited it.

The existing English fixture uses `Convulsive Therapy` and `Catatonia: From
Psychopathology to Neurobiology`, both already cased. Its comment identifies
non-CNE creator formatting as its purpose. It cannot detect this conversion gap.
Existing fixture expectations remain unchanged; generated HTML snapshots are
documentation, not the regression oracle.

## What the current title patch changes

The three Chicago variants restore native item-title casing at the variable
output, while keeping the existing field-selection condition. Explicit CNE
romanization, original-script supplements, and translations keep their entered
casing. No new fallback or missing-field substitution is introduced.

The patch covers full titles and shortened-note titles, preserving the upstream
branches that deliberately do not use title case. A separate detail deserves
review: the native patent branch now also honors upstream `form="short"`, which
was previously ineffective on the selector call. A CSL probe with distinct full
and short patent titles confirms this changes which native string appears. It
should be an explicit scope decision, not described as capitalization alone.

The existing native sort-key path calls title-rendering macros, so unchanged
sort declarations alone would not prove unchanged sorting. Existing sorting
tests still pass; the patent short-title edge has not been checked for sorting.

The patch changes CSL output, not stored Title or Extra fields. Runtime source,
the APA CSL, and existing fixtures/expectations are unchanged. Curated-style
installation already compares bundled and installed content, so a future plugin
release can update installed CNE styles. Regenerating references can therefore
change many English titles at once.

Missing Language is another affected case: under these English-default styles,
CSL treats an unspecified language as English. The standalone probe confirms
native titles then gain title case. Explicit CNE romanization still retains its
casing, and a native French title marked `fr` remains unchanged. This follows the
[existing CSL language rule](https://docs.citationstyles.org/en/v1.0.2/specification.html#non-english-items),
not a new CNE language inference.

## Additional native-field gaps confirmed during review

These gaps exist on the release baseline and remain after the current title
patch. Each diagnostic uses an already-cased item Title, `en-US`, no CNE metadata,
and varies only the field listed below. Comparison is with the corresponding
retained upstream template, not a newly authored expected bibliography.

| Native input field and value                 | Upstream rendering of that field | N/B | Shortened N/B | Author-date |
| -------------------------------------------- | -------------------------------- | --- | ------------- | ----------- |
| Journal: `Journal of Buddhist ethics`        | `Journal of Buddhist Ethics`     | Gap | Gap           | Matches     |
| Chapter's book: `History of modern Buddhism` | `History of Modern Buddhism`     | Gap | Matches       | Matches     |
| Series: `Studies in modern religion`         | `Studies in Modern Religion`     | Gap | Gap           | Matches     |
| Publisher: `example university press`        | `Example university press`       | Gap | Gap           | Matches     |

The publisher difference is capitalization of the first character, not title
case. These are bibliography observations; this matrix does not certify every
container/series/publisher note branch or CNE field combination.

## Validation and limits

- The retained suite passes all 178 checks, including the reported article,
  native title comparisons across item types, `en`/`English`/`fr`, CNE
  romanization, and successive note titles.
- An additional temporary Zotero diagnostic compared the four adjacent fields
  across all three styles: 5 matched, 7 failed. The combined run was **183 passed,
  7 failed**, with all failures confined to the new diagnostic. The seven gaps
  are unresolved; removing the temporary diagnostic is not a fix.
- A separate citeproc-js 1.4.61 comparison of release, patched, and upstream CSL
  confirmed that these adjacent gaps predate the patch. It also checked missing
  Language, protected `nocase` text, explicit romanization, and patent short
  titles. That probe bypasses Zotero's CNE conversion hooks.
- Integration runs used Zotero **10.0**, not the reporter's 10.0.1. No Word
  document refresh was exercised. This is not an exhaustive Chicago audit.

Local review evidence is retained at `/tmp/cne-chicago-impact-zotero.log`,
`/tmp/cne-chicago-impact-probe.test.ts`, and `/tmp/cne-chicago-impact.json`.
The temporary diagnostic was removed from the normal suite after recording its
results; existing assertions were not weakened or rewritten.

## Recommended repair boundary

Treat the title fix as a restoration of existing native Chicago rules. Make the
patent short-form consequence explicit before accepting its scope. For the
adjacent fields, establish both native upstream output and existing CNE variant
output before applying the same correction to each affected branch. Preserve
each field's present selection priority; do not add aliases, fallback chains,
global title casing, or new runtime hooks.

The current patch addresses the reported item title. It does **not** establish
complete native Chicago parity, and the expanded diagnostic must not be reported
as passing. No publication or GitHub issue closure has been performed.
