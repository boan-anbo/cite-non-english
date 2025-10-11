# Preventing Title Casing for Non-English Titles in Zotero

**Source:** https://www.zotero.org/support/kb/preventing_title_casing_for_non-english_titles

## Overview

Zotero and citation styles handle title casing differently based on the language of the item. This document explains how to prevent automatic title casing for non-English titles.

## Key Recommendations

**Always specify the language field for each item in your Zotero library.**

## Language Code Guidelines

### Two-Letter Codes (Preferred)
- `de` - German
- `fr` - French
- `ja` - Japanese
- `zh` - Chinese
- `ko` - Korean
- `en` - English

### Four-Letter Codes (Also Acceptable)
- `de-DE` - German (Germany)
- `ja-JP` - Japanese (Japan)
- `zh-CN` - Chinese (China)
- `zh-TW` - Chinese (Taiwan)
- `ko-KR` - Korean (Korea)

### English Variants
- `en` - English (generic)
- `en-GB` - English (British)
- `en-US` - English (American)

## Important Principles

1. **Store titles in sentence case**
   - Titles should always be stored in sentence case in Zotero
   - Zotero can automatically transform titles to title case when needed
   - Reverse transformation (title case → sentence case) is NOT reliably possible

2. **Language specification prevents automatic title casing**
   - When a language field is set, Zotero knows not to apply title casing
   - This is crucial for citation styles like Chicago Manual of Style
   - Helps maintain proper formatting across different citation styles

3. **Consistency is key**
   - Consistently mark the language field for all items
   - Ensures accurate bibliographic formatting
   - Prevents unintended title transformations

## Technical Details

### Citation Style Language (CSL) Support

CSL is the underlying system that Zotero uses for citation formatting. Language codes follow CSL standards.

**Reference for locale codes:**
https://github.com/citation-style-language/locales/wiki

### How It Works

1. Zotero reads the `language` field from each item
2. When formatting citations, it checks if the language is English
3. For non-English items:
   - Title casing rules are NOT applied
   - Original capitalization is preserved
4. For English items (or items without a language field):
   - Citation style determines if title case should be applied
   - Automatic transformation may occur

## Best Practices for CNE Citations

For our CNE citation plugin, this means:

1. **Store the original language code**
   - Use the `originalLanguage` field in our CNE metadata
   - Map to Zotero's standard `language` field

2. **Common CNE language codes:**
   - `zh-CN` - Simplified Chinese (Mainland China)
   - `zh-TW` - Traditional Chinese (Taiwan)
   - `ja-JP` - Japanese
   - `ko-KR` - Korean

3. **Integration strategy:**
   - When CNE fields are populated, automatically set or suggest the language field
   - Provide UI hints to help users select the correct language code
   - Document the importance of language field for users

## Examples

### Correct Usage

**German title:**
```
Title: "Die Grundlagen der Quantenmechanik"
Language: de
```
Result: Title casing will NOT be applied

**Japanese title:**
```
Title: "日本仏教綜合研究"
Language: ja-JP
```
Result: Original capitalization preserved

### Incorrect Usage

**No language specified:**
```
Title: "Die Grundlagen der Quantenmechanik"
Language: [empty]
```
Result: May be incorrectly title-cased to "Die Grundlagen Der Quantenmechanik"

## Related Resources

- [CSL Locale Codes](https://github.com/citation-style-language/locales/wiki)
- [Zotero Documentation](https://www.zotero.org/support/)
- [Citation Style Language Specification](https://citationstyles.org/)
