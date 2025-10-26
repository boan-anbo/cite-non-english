# Juris-M Multilingual Architecture Analysis

## Executive Summary

### Quick Answers to Frank Bennett's Questions

**Q: Why does CNE need curated styles when Juris-M works with arbitrary styles?**

**A:** The term "arbitrary styles" is misleading. While Juris-M can work with standard CSL styles that use the `locale` attribute on `<layout>` elements, the critical difference is:

1. **Juris-M** is a complete fork of Zotero with native UI support for multilingual data entry
2. **Standard Zotero** has the citeproc infrastructure but NO UI for multilingual data
3. **CNE** must work as a plugin, storing data in the Extra field and manually injecting renderings

**Q: What does "arbitrary styles" mean?**

**A:** In Juris-M's context, "arbitrary" means that CSL style authors can add language-specific layouts using standard CSL syntax like `<layout locale="ja">`. Juris-M's modified environment automatically handles the complex multilingual rendering without requiring style-specific hacks.

**Q: Can CSL composers control multilingual output in Juris-M?**

**A:** Yes, through the `locale` attribute on `<layout>` elements. This creates language-specific citation formats.

**Q: Can this work in standard Zotero?**

**A:** Theoretically yes (the citeproc code is there), but practically NO because:
- No UI for entering multilingual data
- No way to populate `multi.main` and `multi._keys` structures
- No mechanism to trigger the multilingual processing

**Q: If Zotero can't, then CNE can't either?**

**A:** Correct for native support. CNE must use workarounds:
- Store data in Extra field using custom syntax
- Manually parse and inject multilingual data
- Modify styles to recognize CNE's data format

## Architecture Overview

### Juris-M's Three-Layer Multilingual System

```
┌─────────────────────────────────────────┐
│            USER INTERFACE               │
│  - Native fields for each language      │
│  - Original, Romanized, Translated tabs │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           DATA STORAGE                  │
│  - multi.main: primary language tag     │
│  - multi._keys: variant data by field   │
│  - Stored in Zotero database            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          RENDERING ENGINE               │
│  - Modified citeproc-js                 │
│  - cite-lang-prefs configuration        │
│  - Primary/Secondary/Tertiary slots     │
└─────────────────────────────────────────┘
```

### Standard Zotero's Limitation

```
┌─────────────────────────────────────────┐
│            USER INTERFACE               │
│  ❌ No multilingual fields              │
│  ❌ No language tabs                    │
│  ✓ Only Extra field available           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           DATA STORAGE                  │
│  ⚠️  multi structures exist in code     │
│  ❌ But cannot be populated via UI      │
│  ❌ Not saved to database                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          RENDERING ENGINE               │
│  ✓ Has multilingual code                │
│  ❌ But never receives multi data       │
│  ❌ Multilingual features dormant        │
└─────────────────────────────────────────┘
```

## Data Flow Analysis

### 1. Data Entry (Juris-M)

When a user enters multilingual data in Juris-M:

```javascript
// User enters Japanese title with romanization
Item.title = "環境政策の経済分析"  // Original
Item.multi._keys.title["ja-Latn"] = "Kankyō seisaku no keizai bunseki"  // Romanized
Item.multi._keys.title["en"] = "Economic Analysis of Environmental Policy"  // Translated
Item.multi.main.title = "ja"  // Primary language
```

### 2. Data Storage Structure

Juris-M stores this in SQLite database with serialized multilingual fields:

```javascript
// From multilingual.js in Juris-M
Zotero.Item.prototype.setMultiField = function (field, val, lang) {
    if (!lang) {
        this._multiBase[fieldID] = val;
    } else {
        if (!this._multiField[fieldID]) {
            this._multiField[fieldID] = {};
        }
        this._multiField[fieldID][lang] = val;
    }
    // Serializes to: #[length][codes]texts format
}
```

### 3. CSL Processing

When generating citations, Juris-M's citeproc:

```javascript
// From citeproc.js (lines 17735-17762)
/*
 * Renderings are placed in slots according to
 * state.opt['cite-lang-prefs'] arrays:
 * - persons, institutions, titles, journals, publishers, places
 * Each segment contains: 'orig', 'translit', or 'translat'
 */

// Default configuration
this['cite-lang-prefs'] = {
    persons: ['orig'],
    institutions: ['orig'],
    titles: ['orig'],
    journals: ['orig'],
    publishers: ['orig'],
    places: ['orig']
};
```

### 4. Slot-Based Rendering

The multilingual system uses three slots:

```javascript
// Primary slot (original language)
primary = Item.title;

// Secondary slot (transliteration)
if (Item.multi._keys.title["ja-Latn"]) {
    secondary = Item.multi._keys.title["ja-Latn"];
}

// Tertiary slot (translation)
if (Item.multi._keys.title["en"]) {
    tertiary = Item.multi._keys.title["en"];
}

// Output: 環境政策の経済分析 [Kankyō seisaku no keizai bunseki]
```

## CSL Style Control

### How CSL Styles Control Multilingual Output

#### 1. Using `locale` attribute on `<layout>` elements

```xml
<!-- Standard CSL style with multilingual support -->
<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0">
  <citation>
    <layout>
      <!-- Default layout for all languages -->
      <text variable="title"/>
    </layout>
    <layout locale="ja zh">
      <!-- Special layout for Japanese and Chinese -->
      <text variable="title"/>
      <text variable="title" form="transliterated" prefix=" [" suffix="]"/>
    </layout>
  </citation>
</style>
```

#### 2. Internal Conversion to Conditionals

Juris-M converts the `locale` attribute to conditional logic internally:

```javascript
// From citeproc.js (lines 11533-11547)
if (this.locale_raw) {
    if (!state.build.layout_locale_flag) {
        // Converts to cs:choose and cs:if
        var choose_tok = new CSL.Token("choose", CSL.START);
        my_tok.name = "if";
        CSL.Attributes["@locale-internal"].call(my_tok, state, this.locale_raw);
    } else {
        // Subsequent locales become cs:else-if
        my_tok.name = "else-if";
        CSL.Attributes["@locale-internal"].call(my_tok, state, this.locale_raw);
    }
}
```

This means a style with `<layout locale="ja">` becomes:

```xml
<!-- Internal representation -->
<choose>
  <if locale="ja">
    <!-- Japanese-specific rendering -->
  </if>
  <else>
    <!-- Default rendering -->
  </else>
</choose>
```

## Comparison: Juris-M vs Standard Zotero vs CNE

| Feature | Juris-M | Standard Zotero | CNE Plugin |
|---------|---------|-----------------|------------|
| **UI for multilingual data** | ✅ Native tabs | ❌ None | ✅ Via Extra field |
| **Data storage** | ✅ multi.main/._keys | ⚠️ Structure exists, unused | ✅ In Extra field |
| **Citeproc support** | ✅ Modified version | ✅ Has code, but inactive | ❌ Must inject manually |
| **CSL locale attribute** | ✅ Works | ⚠️ Code exists, no data | ❌ Not applicable |
| **Arbitrary styles** | ✅ With locale attr | ❌ No data to process | ❌ Needs modification |
| **cite-lang-prefs** | ✅ Configurable | ⚠️ Exists but unused | ❌ Must implement |

## Why CNE Needs Curated Styles

### 1. Data Storage Constraints

CNE must store multilingual data in Extra field:

```
// CNE format in Extra field
title-original: 環境政策の経済分析
title-romanized: Kankyō seisaku no keizai bunseki
title-translated: Economic Analysis of Environmental Policy
```

Standard CSL styles don't know about these fields.

### 2. No Access to Multilingual Pipeline

CNE cannot:
- Populate `multi.main` and `multi._keys` structures
- Trigger citeproc's multilingual processing
- Use `locale` attributes in CSL styles

### 3. Manual Injection Required

CNE must:
1. Parse data from Extra field
2. Intercept citation generation
3. Manually inject multilingual renderings
4. Modify styles to use CNE-specific variables

Example of CNE-curated style:

```xml
<!-- CNE-modified style -->
<text variable="title-original"/>
<text variable="title-romanized" prefix=" [" suffix="]"/>

<!-- Instead of Juris-M's approach -->
<text variable="title"/>
<text variable="title" form="transliterated" prefix=" [" suffix="]"/>
```

## Special Case: Korean Language

### Discovery: Korean Is NOT Specially Handled

From citeproc.js line 13745 (both Juris-M and standard Zotero):

```javascript
if (["ja", "zh"].indexOf(top_locale) > -1) {
    ret = 1;  // Special name ordering for Japanese and Chinese only
}
```

**Korean ("ko") is excluded** from special handling despite being a CJK language. This means:
- Korean names follow Western ordering (given-family)
- No automatic family-name-first formatting
- Must be handled explicitly in styles or configuration

## Technical Deep Dive

### 1. The "Shoehorning" Frank Bennett Mentioned

Frank's comment about "shoehorning in bracketed, parenthetical, or comma-delimited variants" refers to how Juris-M automatically injects secondary and tertiary language variants:

```javascript
// Automatic formatting of multilingual variants
// Primary: 環境政策の経済分析
// Secondary (bracketed): [Kankyō seisaku no keizai bunseki]
// Tertiary (parenthetical): (Economic Analysis of Environmental Policy)
```

### 2. Why This Works in Juris-M but Not Zotero

Key code from Juris-M's itemToCSLJSON:

```javascript
// Juris-M can access multilingual data
if (Item.multi && Item.multi._keys[field]) {
    for (var lang in Item.multi._keys[field]) {
        // Process each language variant
        cslItem[field + "-" + lang] = Item.multi._keys[field][lang];
    }
}
```

Standard Zotero has similar code but:
- No UI populates Item.multi
- CSL processor never receives multilingual data
- Features remain dormant

### 3. The cite-lang-prefs Configuration

This controls which variants appear in which slots:

```javascript
// Example configuration for Japanese citations
state.opt['cite-lang-prefs'] = {
    persons: ['orig', 'translit'],      // Names: original + romanized
    titles: ['orig', 'translit'],       // Titles: original + romanized
    publishers: ['translat'],            // Publishers: translated only
    places: ['orig', 'translat']        // Places: original + translated
};
```

## Conclusions

### 1. Frank Bennett's "Arbitrary Styles" Claim

**Partially true but misleading:**
- True: Juris-M can process standard CSL styles with `locale` attributes
- Misleading: Requires Juris-M's complete ecosystem (UI + data + processor)
- Not portable to standard Zotero

### 2. Why CNE Cannot Achieve the Same

**Fundamental constraints:**
1. **No native UI** - Must use Extra field workaround
2. **No data pipeline** - Cannot populate multi structures
3. **No processor access** - Cannot trigger multilingual features
4. **Must curate styles** - Standard styles unaware of CNE's data format

### 3. The Core Architecture Difference

**Juris-M**: Complete vertical integration
- Modified UI → Modified database → Modified processor → Modified styles

**CNE**: Plugin-based workaround
- Extra field hack → Custom parsing → Manual injection → Curated styles

### 4. Korean Language Oversight

The exclusion of Korean from special CJK handling (only "ja" and "zh" are recognized) represents a significant oversight in both Juris-M and standard Zotero's citeproc implementation.

## Recommendations for CNE

1. **Continue style curation** - It's the only viable approach as a plugin
2. **Document the limitations** - Users should understand why CNE needs special styles
3. **Consider Korean handling** - Implement special logic since citeproc doesn't
4. **Advocate for native support** - Long-term solution requires Zotero changes

## Final Answer to Frank Bennett

**CNE needs curated styles because:**
1. It operates as a plugin, not a fork
2. It cannot access Zotero's dormant multilingual infrastructure
3. It must store data in Extra field, not native multilingual fields
4. Standard CSL styles cannot see or use CNE's data format

**Juris-M's "arbitrary styles" work only within Juris-M's complete ecosystem**, not in standard Zotero where CNE must operate.