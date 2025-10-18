# Citeproc-js Name Ordering Control

## Overview

This document explains a critical implementation detail in CNE's creator name handling: how we override citeproc-js's automatic name ordering behavior to ensure predictable formatting of mixed Asian and Western creator names.

## The Problem

### Background: Citeproc-js's Language-Based Name Ordering

Citeproc-js (the CSL processor used by Zotero) automatically applies **Asian name ordering** (family-first, no comma) to ALL creators in an item when that item has an Asian language code (`zh`, `ja`, `ko`), **regardless of whether those creators are actually Asian names**.

### Example of the Bug

Consider this Chinese book with three creators:
- **杜伟生 (Du Weisheng)** - Chinese author (has CNE data)
- **林世田 (Lin Shitian)** - Chinese editor (has CNE data)
- **Alastair Morrison** - Western editor (NO CNE data)

**Without our fix:**
```
Du Weisheng 杜伟生... edited by Lin Shitian 林世田 and Morrison Alastair
```

**With our fix:**
```
Du Weisheng 杜伟生... edited by Lin Shitian 林世田 and Alastair Morrison
```

Notice Morrison's name was incorrectly formatted as "Morrison Alastair" (Asian ordering) even though he has no CNE data and is a Western name.

### Root Cause in Citeproc-js Source Code

The bug originates in **citeproc-js** source code at `tools/citeproc-js-server/lib/citeproc.js`, lines 13771-13779, in the `_isRomanesque()` function:

```javascript
var top_locale;
if (ret == 2) {  // If name is pure romanesque (Western)
    if (name.multi && name.multi.main) {
        top_locale = name.multi.main.slice(0, 2);
    } else if (this.Item.language) {
        top_locale = this.Item.language.slice(0, 2);  // Gets "zh" from "zh-CN"
    }
    if (["ja", "zh"].indexOf(top_locale) > -1) {
        ret = 1;  // ❌ BUG: Downgrades to "mixed content"
    }
}
```

**What happens:**
1. Citeproc-js detects "Morrison Alastair" is purely romanesque (Western name) → `ret = 2`
2. But then checks: "Is this item in Japanese or Chinese?" → Yes, `language: 'zh-CN'`
3. So it downgrades to `ret = 1` (mixed content)
4. Mixed content triggers family-first ordering at line 13835 → "Morrison Alastair"

This is a **design flaw** in citeproc-js: it assumes ALL names in Asian-language items should use Asian ordering, which is incorrect for international collaborations with Western co-authors/editors.

## Our Solution

### What is `multi`?

The `multi` object is part of **citeproc-js's multilingual support system** (used by Juris-M/Multilingual Zotero). It's NOT part of standard CSL-JSON, but rather a citeproc-js extension for handling multilingual citations.

**Structure:**
```javascript
// In CSL-JSON creator object
{
  family: "Morrison",
  given: "Alastair",
  multi: {
    main: "en",           // Primary language of this name
    _key: {               // Alternative language versions
      "zh": {...},        // Chinese version of the name
      "ja": {...}         // Japanese version of the name
    }
  }
}
```

**Usage in citeproc-js** (see `lib/citeproc.js` lines 14240-14270):
1. First checks `name.multi._key[langTag]` for alternative language versions
2. Falls back to `name.multi.main` for the name's primary language
3. Finally falls back to `item.language` for the item's language

### Strategy: Per-Name Language Override via multi.main

Citeproc-js provides an escape hatch: if a name has `name.multi.main` set, it will use that language code **instead of** the item's language field (see lines 13772-13773 and 14262-14265).

We exploit this by setting `multi.main` on **every creator** in the CSL-JSON:

```typescript
// For creators WITH CNE data (Asian names)
cslCreator.multi = {
  main: originalLang  // e.g., "zh-CN", "ja-JP", "ko-KR"
};

// For creators WITHOUT CNE data (Western names)
cslCreator.multi = {
  main: "en"  // Forces Western ordering
};
```

### Implementation

The logic is implemented in `src/modules/cne/callbacks/enrichAuthorNames.ts`:

```typescript
// Get the original language code for CNE creators
const originalLang = metadata.originalLanguage || zoteroItem.getField("language") || "zh";

// Process each creator
for (let i = 0; i < creators.length; i++) {
  const cslCreator = value[i];
  const cneCreator = metadata.authors[metadataIndex];
  metadataIndex++;

  // Check if this creator has CNE data
  const hasCneData = cneCreator &&
    (cneCreator.lastRomanized || cneCreator.firstRomanized ||
     cneCreator.lastOriginal || cneCreator.firstOriginal);

  if (hasCneData) {
    // Asian name with CNE data → use original language for Asian ordering
    if (!cslCreator.multi) {
      cslCreator.multi = {};
    }
    cslCreator.multi.main = originalLang;
  } else {
    // Western name without CNE data → force English for Western ordering
    if (!cslCreator.multi) {
      cslCreator.multi = {};
    }
    cslCreator.multi.main = "en";
  }

  // Skip enrichment for creators without CNE data
  if (!hasCneData) {
    continue;
  }

  // ... enrichment logic for CNE creators ...
}
```

### Design Philosophy

Our approach provides **full predictability**:

- **If a creator has CNE data** → We manage it with Asian ordering
- **If a creator has NO CNE data** → We explicitly mark it as English to preserve Western ordering

This is simple, explicit, and gives us complete control over every creator's formatting, regardless of the item's language field.

## Testing

### Test Case: Du 2007 Dunhuang

The Du entry in our test suite demonstrates this feature:

**Fixture** (`test/csl-tests/fixtures/unified-fixtures.ts`):
```typescript
[FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG]: {
  itemType: 'bookSection',
  language: 'zh-CN',
  creators: [
    { firstName: '伟生', lastName: '杜', creatorType: 'author' },      // Index 0
    { firstName: 'Shitian', lastName: 'Lin', creatorType: 'editor' },  // Index 1
    { firstName: 'Alastair', lastName: 'Morrison', creatorType: 'editor' }  // Index 2
  ],
  extra: `cne-creator-0-last-original: 杜
cne-creator-0-first-original: 伟生
cne-creator-0-last-romanized: Du
cne-creator-0-first-romanized: Weisheng
cne-creator-1-last-original: 林
cne-creator-1-first-original: 世田
cne-creator-1-last-romanized: Lin
cne-creator-1-first-romanized: Shitian`
  // NOTE: No cne-creator-2-* fields for Morrison!
}
```

**Expected Output**:
```
Du Weisheng 杜伟生. "Dunhuang yishu yongzhi gaikuang ji qianxi"...
edited by Lin Shitian 林世田 and Alastair Morrison.
```

**What happens:**
- Du (index 0): Has CNE data → `multi.main = "zh-CN"` → "Du Weisheng 杜伟生" (Asian order)
- Lin (index 1): Has CNE data → `multi.main = "zh-CN"` → "Lin Shitian 林世田" (Asian order)
- Morrison (index 2): NO CNE data → `multi.main = "en"` → "Alastair Morrison" (Western order)

## Alternative Solutions (Not Used)

### Alternative 1: Remove Language Field
Don't set `language: 'zh-CN'` on items.

**Rejected because:** The language field provides other benefits (language-specific quotation marks, date formatting, etc.) and is semantically correct for the item.

### Alternative 2: Patch Citeproc-js Locally
Modify citeproc-js source code to skip the language downgrade (lines 13777-13779).

**Rejected because:** We'd need to maintain a fork of citeproc-js and sync updates. The `multi.main` override is cleaner and works with stock citeproc-js.

### Alternative 3: CSL Style Conditionals
Try to detect Western names in the CSL style itself.

**Rejected because:** CSL lacks the logic to distinguish Asian from Western names, and CSL styles cannot access per-creator metadata to make such decisions.

## References

### Citeproc-js Source

**File**: `tools/citeproc-js-server/lib/citeproc.js`

- **`_isRomanesque()` function** (lines 13759-13783): Detects whether a name is romanesque/Western
  - Line 13772-13773: Checks `name.multi.main` for name's primary language
  - Lines 13771-13779: Language-based downgrade bug (applies Asian ordering to Western names)

- **Name rendering logic** (lines 13785-13860): Formats names based on romanesque status
  - Line 13832-13834: Non-romanesque (Asian) names rendered with no spaces
  - Line 13835-13837: Mixed/family-first names rendered as "Family Given"

- **Multi-language name selection** (lines 14240-14270): Chooses which language version of a name to use
  - Line 14246: Checks `name.multi._key[langTag]` for alternative versions
  - Line 14262-14263: Falls back to `name.multi.main` for primary language
  - Line 14264-14265: Falls back to `item.language` if no multi

### Our Implementation

**File**: `src/modules/cne/callbacks/enrichAuthorNames.ts`

- **Multi.main override logic** (lines 234-272): Sets language on every creator
  - Lines 258-264: CNE creators → use original language (Asian ordering)
  - Lines 266-271: Non-CNE creators → force English (Western ordering)

### Test Case

**File**: `test/csl-tests/fixtures/unified-fixtures.ts`

- **Du entry** (`ZHCN_DU_2007_DUNHUANG`): Mixed Chinese and Western creators

### External References

- **Juris-M/Multilingual Zotero**: The `multi` object is part of Juris-M's multilingual support
  - GitHub: https://github.com/Juris-M/citeproc-js
  - Documentation: https://citeproc-js.readthedocs.io/en/latest/csl-m/
  - Note: `multi.main` and `multi._key` are NOT part of standard CSL-JSON spec

## Summary

By setting `name.multi.main` on every creator, we gain explicit control over name ordering:
- **CNE creators**: Use original language → Asian ordering
- **Non-CNE creators**: Use English → Western ordering

This simple, predictable approach overrides citeproc-js's flawed assumption that all creators in Asian-language items should use Asian name ordering.
