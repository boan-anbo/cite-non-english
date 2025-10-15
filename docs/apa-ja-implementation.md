# APA Japanese Style Implementation (apa-ja.csl)

## Overview

Created a Japanese variant of APA 7th edition citation style that adapts the formatting for Japanese-language academic papers.

## File Location

`/Users/boan/script/cite-non-english/tools/citeproc-js-server/csl/apa-ja.csl`

## Key Changes from Standard APA

### 1. Metadata
- **Title**: "American Psychological Association 7th edition (日本語)"
- **ID**: `http://www.zotero.org/styles/apa-ja`
- **Default Locale**: `ja`
- **Template Link**: Links to standard `apa` as parent

### 2. Japanese Locale Definitions (`<locale xml:lang="ja">`)

| Term | Japanese | Notes |
|------|----------|-------|
| no date | 日付なし | "No date available" |
| et-al | 他 | "And others" |
| and | ・ | Middle dot separator |
| editor | 編 | Editor |
| translator | 訳 | Translator |
| edition | 版 | Edition |
| volume | 巻 | Volume |
| page | 頁 | Page |
| in | 収録 | "Contained in" |
| retrieved | 取得 | Retrieved |
| from | から | From |
| open-quote | 「 | Opening quotation mark |
| close-quote | 」 | Closing quotation mark |
| open-inner-quote | 『 | Inner opening quote |
| close-inner-quote | 』 | Inner closing quote |

### 3. Title Formatting Changes

#### Modified Macros

1. **`booklike-title`**:
   - Removed `font-style="italic"`
   - Added `prefix="「" suffix="」"` for book titles

2. **`periodical-title`**:
   - Removed `font-style="italic"`
   - Added `prefix="「" suffix="」"` for article titles

3. **`title`** (main macro):
   - Webpages: Changed from italic to 「」
   - All other types: Use appropriate quotation marks

4. **`title-intext`**:
   - All title references in-text use 「」 instead of italics
   - Exception: legislation/regulation/treaty (no formatting)

5. **`reviewed-title` and `reviewed-title-intext`**:
   - Reviews use 「」 for reviewed work titles

6. **`container-periodical`**:
   - Journal/magazine names: Use 『』 (double quotation marks)
   - Volume/issue numbers: No italic formatting

7. **`container-booklike`**:
   - Container titles: Use 『』 prefix/suffix
   - Removed font-style="italic"

## Formatting Examples

### Before (English APA):
```
牟發松, 丹有江, & 魏俊傑. (日付なし). 中國行政區劃通史,十六国北朝卷 (周振鶴, 編; 1番目 版)
```
*Note: Title would be in italics*

### After (Japanese APA - apa-ja):
```
牟發松・丹有江・魏俊傑.(日付なし).「中國行政區劃通史,十六国北朝卷」(周振鶴,編; 1版)
```
*Note: Title uses 「」, no italics*

## Validation

- ✅ XML syntax validated with `xmllint`
- ✅ CSL structure conforms to CSL 1.0 specification
- ✅ Default locale set to Japanese
- ✅ All title macros modified for Japanese quotation marks
- ✅ Test file created: `/Users/boan/script/cite-non-english/test/csl-tests/test-apa-ja.ts`

## Testing

To test the style:

1. Start citeproc-js-server:
   ```bash
   cd tools/citeproc-js-server
   npm start
   ```

2. Run tests:
   ```bash
   npm test -- test/csl-tests/test-apa-ja.ts
   ```

## Future Improvements

1. **Contribute to CSL Style Repository**:
   - Create diff file for style-variant-builder
   - Submit to https://github.com/citation-style-language/style-variant-builder

2. **Additional Locale Terms**:
   - Consider adding more Japanese-specific terms as needed
   - Month names (currently using default)

3. **Author Name Formatting**:
   - Current: Uses middle dot (・) between author names
   - Alternative: Could use comma (、) depending on style preference

4. **Date Formatting**:
   - Consider Japanese date formats (e.g., "2025年10月15日")
   - Current implementation uses Western format with Japanese terms

## References

- APA 7th Edition Manual: https://apastyle.apa.org/
- CSL Specification: https://docs.citationstyles.org/
- Japanese Academic Citation Guidelines: Various Japanese academic institutions have adapted APA with similar modifications
- Style Variant Builder: https://github.com/citation-style-language/style-variant-builder

## Author

Created: 2025-10-15
Based on: APA 7th edition (2024-07-09 version)
