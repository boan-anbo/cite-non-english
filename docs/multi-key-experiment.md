# Experiment A: multi._key Structure Test

**Date**: 2025-10-17
**Status**: ✅ COMPLETED - Hypothesis confirmed

## Objective

Test whether citeproc-js can automatically display both romanized and original script names using the `multi._key` structure, WITHOUT manual string concatenation in JavaScript.

## Hypothesis

**Hypothesis**: Using `multi._key` to store separate language variants will allow citeproc-js to automatically display both romanized + original simultaneously in standard CSL styles (Chicago, APA, MLA).

**Expected Result**: Only ONE language version displays (romanized OR original), not both.

**Rationale**: Based on citeproc-js source code analysis (lines 14240-14270), the processor SELECTS one language variant from `multi._key` based on `cite-lang-prefs` configuration, which defaults to `['orig']` in standard CSL styles.

## Methodology

### 1. Test Fixture Setup

Created experimental fixture: `ZHCN_WANG_2000_MULTIKEY_TEST` (Wang Xiaobo)

**Key features**:
- Added `cne-use-multi-key: true` flag in Extra field
- Stored romanized and original names separately (no string concatenation)
- Used same metadata structure as other fixtures

**Extra field content**:
```
cne-creator-0-last-original: 王
cne-creator-0-first-original: 小波
cne-creator-0-last-romanized: Wang
cne-creator-0-first-romanized: Xiaobo
cne-use-multi-key: true
cne-title-original: 黄金时代
cne-title-romanized: Huangjin shidai
cne-title-english: The Golden Age
cne-publisher-original: 花城出版社
cne-publisher-romanized: Huacheng chubanshe
```

### 2. Implementation Changes

**Modified `enrichAuthorNames.ts`** to detect `useMultiKey` flag:

```typescript
if (metadata.useMultiKey) {
  // Populate multi._key structure
  if (!cslCreator.multi._key) {
    cslCreator.multi._key = {};
  }

  // Set romanized as main (English locale)
  if (cneCreator.lastRomanized || cneCreator.firstRomanized) {
    cslCreator.family = cneCreator.lastRomanized || "";
    cslCreator.given = cneCreator.firstRomanized || "";
  }

  // Store original in multi._key
  if (cneCreator.lastOriginal || cneCreator.firstOriginal) {
    cslCreator.multi._key[originalLang] = {
      family: cneCreator.lastOriginal || "",
      given: cneCreator.firstOriginal || ""
    };
  }
}
```

**CSL-JSON Output Structure**:
```javascript
{
  author: [
    {
      family: "Wang",
      given: "Xiaobo",
      multi: {
        main: "zh-CN",
        _key: {
          "zh-CN": {
            family: "王",
            given: "小波"
          }
        }
      }
    }
  ]
}
```

### 3. Control Comparison

**Standard approach** (string concatenation):
```javascript
{
  family: "Wang",
  given: "Xiaobo 王小波",  // ← Concatenated
  multi: {
    main: "zh-CN"
  }
}
```

## Results

### Test Output

**Expected (if hypothesis correct)**:
```
Wang Xiaobo. <i>Huangjin shidai</i> 黄金时代 [The Golden Age]. 花城出版社, 2000.
```

**Actual Output**:
```
Wang Xiaobo. <i>Huangjin shidai</i> 黄金时代 [The Golden Age]. 花城出版社, 2000.
```

✅ **Test PASSED** - Output matches expected

### Key Findings

1. **Author name displays romanized ONLY**: "Wang Xiaobo" (not "Wang Xiaobo 王小波")
2. **No original script in author name**: The `multi._key["zh-CN"]` variant was NOT displayed
3. **Citeproc-js selected ONE variant**: As predicted, only the main (romanized) version appears

### Comparison with Standard Approach

| Aspect | multi._key Approach | String Concat Approach |
|--------|---------------------|------------------------|
| Author display | "Wang Xiaobo" | "Wang Xiaobo 王小波" |
| Data structure | Separate variants in `multi._key` | Single concatenated string |
| CSL style control | Citeproc-js selects variant | We control display |
| Flexibility | Can't show both in standard CSL | Shows both always |

## Conclusion

### Hypothesis Confirmed ✅

**The `multi._key` structure does NOT enable simultaneous display of romanized + original in standard CSL styles.**

**Why**:
- Citeproc-js's language selection logic (lines 14240-14257) **replaces** the entire name object with the selected variant
- Standard CSL styles have `cite-lang-prefs: ['orig']` which selects ONE language
- Multi-slot display (`['translit', 'orig']`) requires CSL-M styles, NOT standard Chicago/APA/MLA

### Validation of Current Approach

**Our "hacky" string concatenation approach is NOT optional - it's REQUIRED.**

**Reasoning**:
1. Standard CSL styles (Chicago, APA, MLA) do NOT support multi-slot name display
2. Users expect to see "Du Weisheng 杜伟生" (both languages simultaneously)
3. The only way to achieve this with standard CSL is string concatenation
4. Alternative (CSL-M styles) is not viable (see community discussion analysis)

### Why CSL-M Is Not an Option

From Zotero forums discussion (2023-2025):
- CSL-M is NOT part of CSL 1.0.2 standard
- Adam Smith (Zotero maintainer): "we wouldn't accept it to the repo"
- Juris-M project has sustainability concerns ("largely relies on one developer")
- Community consensus: Plugin approach with standard data is more sustainable

## Technical Explanation

### Citeproc-js Language Selection Logic

**Source**: `tools/citeproc-js-server/lib/citeproc.js` lines 14240-14270

```javascript
// Step 1: Try to find language variant in multi._key
if (slotLocaleset !== 'locale-orig') {
    foundTag = false;
    if (name.multi) {
        var langTags = this.state.opt[slotLocaleset];  // From cite-lang-prefs
        for (var i = 0, ilen = langTags.length; i < ilen; i += 1) {
            langTag = langTags[i];
            if (name.multi._key[langTag]) {
                foundTag = true;
                name = name.multi._key[langTag];  // ← REPLACES entire name!
                break;
            }
        }
    }
}

// Step 2: If not found, use multi.main
if (!foundTag) {
    if (name.multi && name.multi.main) {
        langTag = name.multi.main;
    }
}
```

**Key insight**: `name = name.multi._key[langTag]` **REPLACES** the name object, it doesn't append or combine variants.

### Why Multi-Slot Display Doesn't Work

**Standard CSL styles** configuration:
```javascript
this['cite-lang-prefs'] = {
    persons:['orig'],       // ← Only ONE slot!
    institutions:['orig'],
    titles:['orig'],
    // ... etc
};
```

**CSL-M styles** configuration (hypothetical):
```javascript
this['cite-lang-prefs'] = {
    persons:['translit', 'orig'],  // ← Multiple slots
    // This would show both romanized AND original
};
```

But CSL-M styles are:
- Not part of standard CSL
- Not accepted in official repository
- Require Juris-M fork (sustainability concerns)
- Not a viable long-term solution

## Implications for CNE

### Our Approach is Correct

1. **✅ Use standard CSL styles** (Chicago, APA, MLA)
2. **✅ Store data in Extra field** (no database changes)
3. **✅ String concatenation in JavaScript** (explicit display control)
4. **✅ Use `multi.main` for name ordering** (leverage citeproc-js bypass)

### What We're NOT Doing (and why)

1. **❌ Relying on `multi._key` for display**
   - Reason: Standard CSL doesn't support multi-slot display

2. **❌ Using CSL-M styles**
   - Reason: Not standardized, not sustainable, limited adoption

3. **❌ Modifying database schema**
   - Reason: Requires Juris-M fork, breaks compatibility with standard Zotero

### Future Considerations

**If CSL 2.0 adds native multilingual support**:
- We can migrate from string concatenation to `multi._key`
- Our data model already tracks separate romanized/original
- Code changes would be minimal (remove concatenation, populate `multi._key`)

**If Zotero adds UI for language variants**:
- We could potentially integrate with native UI
- But our Extra field approach would still work as fallback

## Documentation References

- **Citeproc-js source analysis**: `docs/citeproc-name-ordering.md`
- **Multi field compatibility**: `docs/multi-field-compatibility.md`
- **Juris-M learning notes**: `docs/juris-m-learning.md`
- **Community discussion**: Zotero forums "Multilingual Support integration" thread

## Test Files

- **Fixture**: `test/csl-tests/fixtures/unified-fixtures.ts` (ZHCN_WANG_2000_MULTIKEY_TEST)
- **Expectation**: `test/csl-tests/expectations/chicago-18th/en-US/chinese.ts`
- **Test case**: `test/csl-tests/chicago-18th.test.ts`
- **Implementation**: `src/modules/cne/callbacks/enrichAuthorNames.ts` (lines 364-402)

## Conclusion Summary

**Question**: Can we use `multi._key` instead of string concatenation?

**Answer**: **NO** - Not with standard CSL styles.

**Evidence**: This experiment empirically demonstrates that `multi._key` only enables **language selection**, not **simultaneous display** in standard CSL.

**Decision**: Continue with string concatenation approach, which is:
- ✅ Proven to work
- ✅ Compatible with all standard CSL styles
- ✅ Sustainable (no dependency on CSL-M or Juris-M)
- ✅ Explicit and predictable
- ✅ Meets user expectations

The "hacky" label was a misnomer - this is actually the **correct** and **only** viable approach for displaying multilingual names in standard CSL styles.
