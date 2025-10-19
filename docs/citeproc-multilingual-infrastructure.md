# Citeproc-js Multilingual Rendering Infrastructure

**Investigation Date**: 2025-10-18
**Status**: ✅ Complete Discovery
**Source**: `tools/citeproc-js-server/lib/citeproc.js`

## Executive Summary

Deep investigation into citeproc-js revealed a **complete multi-slot rendering system** for displaying multiple language variants simultaneously. This infrastructure was built for CSL-M (Multilingual CSL) but works in regular Zotero with proper configuration.

**Key Discovery**: Citeproc-js CAN display both romanized and original script names simultaneously using the multi-slot system, IF properly configured via JavaScript APIs.

**Critical Limitation**: NO CSL XML syntax exists to configure this from style files - it requires JavaScript API calls at engine initialization.

---

## Core Architecture

### 1. The Three-Slot System

**Concept**: Each field type (persons, institutions, titles, etc.) can render up to THREE language variants:

```javascript
cite-lang-prefs = {
  persons: ['translit', 'orig'],     // Primary + Secondary slots
  institutions: ['orig'],             // Primary slot only
  titles: ['translit', 'orig', 'translat'], // All three slots
  // ...
}
```

**Slot Mapping** (lines 13405-13413):
```javascript
var slotnames = ["primary", "secondary", "tertiary"];
for (var k = 0, klen = slotnames.length; k < klen; k += 1) {
    if (localesets[k]) {
        slot[slotnames[k]] = 'locale-' + localesets[k];
    }
}
```

**Values**:
- `'orig'` → `'locale-orig'` → Uses main fields (family, given)
- `'translit'` → `'locale-translit'` → Searches `multi._key` for romanized variant
- `'translat'` → `'locale-translat'` → Searches `multi._key` for translated variant

### 2. Language Variant Selection

**Location**: Lines 14240-14270

**Algorithm**:
```javascript
CSL.NameOutput.prototype.getName = function (name, slotLocaleset, fallback, stopOrig) {
    // If not 'locale-orig', try to find variant in multi._key
    if (slotLocaleset !== 'locale-orig') {
        if (name.multi) {
            var langTags = this.state.opt[slotLocaleset]; // e.g., state.opt['locale-translit']
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
    // If not found or 'locale-orig', use main fields
    return name;
}
```

**Critical Insight**: `name = name.multi._key[langTag]` **REPLACES** the name object, it doesn't append or combine. The combination happens later in the multi-slot rendering.

### 3. Multi-Slot Rendering (Personal Names)

**Location**: Lines 13701-13750

**Process**:

1. **Fetch each slot** (lines 13704-13718):
```javascript
var res = this.getName(name, slot.primary, true);
var primary = this._renderOnePersonalName(res.name, pos, i, j);

var secondary = false;
if (slot.secondary) {
    res = this.getName(name, slot.secondary, false, res.usedOrig);
    if (res.name) {
        secondary = this._renderOnePersonalName(res.name, pos, i, j);
    }
}

var tertiary = false;
if (slot.tertiary) {
    res = this.getName(name, slot.tertiary, false, res.usedOrig);
    if (res.name) {
        tertiary = this._renderOnePersonalName(res.name, pos, i, j);
    }
}
```

2. **Combine with affixes** (lines 13722-13750):
```javascript
if (secondary || tertiary) {
    this.state.output.openLevel("empty");

    // Primary
    this.state.output.append(primary);

    // Secondary with prefix/suffix
    var secondary_tok = new CSL.Token();
    secondary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.secondary].prefix;
    secondary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.secondary].suffix;
    if (!secondary_tok.strings.prefix) {
        secondary_tok.strings.prefix = " ";  // Default: space
    }
    this.state.output.append(secondary, secondary_tok);

    // Tertiary with prefix/suffix
    var tertiary_tok = new CSL.Token();
    tertiary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.tertiary].prefix;
    tertiary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.tertiary].suffix;
    this.state.output.append(tertiary, tertiary_tok);

    personblob = this.state.output.pop();
}
```

**Output Example**:
```
Primary: "Ozu Yasujirō"
Secondary: " 小津安二郎"  (space prefix from citeAffixes)
Result: "Ozu Yasujirō 小津安二郎"
```

---

## Configuration APIs

### 1. Set Language Preferences for Citations

**API**: `engine.setLangPrefsForCites(obj, conv)`
**Location**: Lines 5000-5041

**Purpose**: Configure which language variants to display for each field type.

**Example Usage**:
```javascript
engine.setLangPrefsForCites({
    persons: ['translit', 'orig'],      // Show romanized + original for names
    institutions: ['orig'],              // Show original only for institutions
    titles: ['translit', 'orig'],        // Show romanized + original for titles
    journals: ['translit'],              // Show romanized only for journals
    publishers: ['orig'],                // Show original only for publishers
    places: ['orig']                     // Show original only for places
});
```

**Implementation**:
```javascript
CSL.Engine.prototype.setLangPrefsForCites = function (obj, conv) {
    var opt = this.opt['cite-lang-prefs'];
    var segments = ['Persons', 'Institutions', 'Titles', 'Journals', 'Publishers', 'Places'];

    for (var i = 0, ilen = segments.length; i < ilen; i += 1) {
        var clientSegment = conv(segments[i]);  // Normalize case
        var citeprocSegment = segments[i].toLowerCase();

        if (!obj[clientSegment]) continue;

        // Normalize order: secondary before tertiary
        // Replace existing settings
        var lst = opt[citeprocSegment];
        while (lst.length) {
            lst.pop();
        }
        for (var j = 0, jlen = obj[clientSegment].length; j < jlen; j += 1) {
            lst.push(obj[clientSegment][j]);
        }
    }
};
```

**Default Configuration** (lines 6497-6505):
```javascript
this['cite-lang-prefs'] = {
    persons: ['orig'],        // Only original (no multi-slot)
    institutions: ['orig'],
    titles: ['orig'],
    journals: ['orig'],
    publishers: ['orig'],
    places: ['orig'],
    number: ['orig']
};
```

### 2. Set Citation Affixes

**API**: `engine.setLangPrefsForCiteAffixes(affixList)`
**Location**: Lines 5043-5073

**Purpose**: Configure prefix/suffix for secondary and tertiary language variants.

**Structure** (lines 6381-6466):
```javascript
this.citeAffixes = {
    persons: {
        "locale-orig": { prefix: "", suffix: "" },
        "locale-translit": { prefix: "", suffix: "" },
        "locale-translat": { prefix: "", suffix: "" }
    },
    institutions: { /* same structure */ },
    titles: { /* same structure */ },
    journals: { /* same structure */ },
    publishers: { /* same structure */ },
    places: { /* same structure */ }
};
```

**Example Usage**:
```javascript
// 48-element array: [prefix, suffix] pairs for all combinations
// Order: persons×3, institutions×3, titles×3, journals×3, publishers×3, places×3
// Forms: translit, orig, translit, translat (repeated for each field type)
var affixes = [
    // persons
    '', '',    // locale-translit prefix/suffix
    '', '',    // locale-orig prefix/suffix
    '', '',    // locale-translit prefix/suffix
    '', '',    // locale-translat prefix/suffix

    // institutions (same pattern)
    '', '', '', '', '', '', '', '',

    // titles (same pattern)
    '', '', '', '', '', '', '', '',

    // journals (same pattern)
    '', '', '', '', '', '', '', '',

    // publishers (same pattern)
    '', '', '', '', '', '', '', '',

    // places (same pattern)
    '', '', '', '', '', '', '', ''
];

engine.setLangPrefsForCiteAffixes(affixes);
```

**Default Behavior**: If prefix is empty, defaults to single space ` ` (line 13733).

### 3. Set Language Tags for Transliteration/Translation

**APIs**:
- `engine.setLangTagsForCslTransliteration(tags)` - Lines 4978-4987
- `engine.setLangTagsForCslTranslation(tags)` - Lines 4989-4998

**Purpose**: Specify which language codes to search in `multi._key` for romanized/translated variants.

**Example Usage**:
```javascript
// Set which language tags represent "transliteration"
engine.setLangTagsForCslTransliteration(['ja-Latn', 'zh-Latn-pinyin', 'ko-Latn']);

// Set which language tags represent "translation"
engine.setLangTagsForCslTranslation(['en', 'en-US']);
```

**Implementation**:
```javascript
CSL.Engine.prototype.setLangTagsForCslTransliteration = function (tags) {
    this.opt['locale-translit'] = [];
    if (tags) {
        for (var i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-translit'].push(tags[i]);
        }
    }
    this.opt['locale-translit'].sort(this.getSortFunc());
};
```

**Default Configuration**:
```javascript
this["locale-translit"] = [];  // Empty by default
this["locale-translat"] = [];  // Empty by default
```

---

## Critical Limitations

### 1. Secondary/Tertiary Slots Only in Bibliography

**Location**: Lines 13672-13679

**Code**:
```javascript
if (this.state.tmp.sort_key_flag
    || (this.state.tmp.area !== "bibliography"
        && !(this.state.tmp.area === "citation"
             && this.state.opt.xclass === "note"
             && this.item && !this.item.position))) {

    slot.secondary = false;  // ← Disabled in regular citations!
    slot.tertiary = false;
}
```

**Impact**:
- **In-text citations**: Only `slot.primary` is used
- **Bibliography**: All three slots (`primary`, `secondary`, `tertiary`) can render
- **Note citations (first occurrence)**: All three slots can render

**Implication for CNE**: Multi-slot rendering won't work for in-text author-date citations like `(Du 2007)` - only in bibliography entries.

### 2. No CSL XML Syntax for Configuration

**Exhaustive Search Results** (2025-10-18):
- ❌ No `@cite-lang-prefs` attribute
- ❌ No `@babel-locale` attribute
- ❌ No `@lang-prefs` attribute
- ❌ No CSL element to configure multi-slot rendering
- ❌ No CSL-M XML syntax for cite-lang-prefs (confirmed via codebase search)

**Only Configuration Method**: JavaScript API calls (`setLangPrefsForCites`, etc.)

**Implication**: The plugin/engine must call these APIs - CSL styles cannot self-configure.

### 3. CSL-M Multi-Layout vs Multi-Slot

**Multi-Layout** (lines 16497-16530):
- CSL-M feature: Multiple `<layout locale="...">` elements
- **Purpose**: Different formatting for different item languages
- **Works in regular Zotero** (confirmed by Adam Smith on forums)
- **Example**:
  ```xml
  <bibliography>
    <layout locale="ja zh-CN ko">
      <!-- Layout for Japanese/Chinese/Korean items -->
    </layout>
    <layout>
      <!-- Default layout for other languages -->
    </layout>
  </bibliography>
  ```

**Multi-Slot** (this document's focus):
- CSL-M feature: Multiple language variants in single layout
- **Purpose**: Display romanized + original simultaneously
- **Requires**: JavaScript API configuration
- **Example output**: "Du Weisheng 杜伟生"

**Key Distinction**:
- Multi-layout = **which macros run** (style-level)
- Multi-slot = **which variants display** (data-level)

---

## Data Structure Requirements

### CSL-JSON with multi._key

**Structure**:
```javascript
{
  "author": [
    {
      "family": "Ozu",           // Primary variant (romanized)
      "given": "Yasujirō",
      "multi": {
        "main": "ja",            // Original language code
        "_key": {
          "ja": {                // Original script variant
            "family": "小津",
            "given": "安二郎"
          },
          "en": {                // English variant (if exists)
            "family": "Ozu",
            "given": "Yasujiro"
          }
        }
      }
    }
  ],
  "title": "Tōkyō Monogatari",
  "title-short": "Tōkyō",
  "multi": {
    "main": "ja",
    "_keys": {
      "title": {
        "ja": "東京物語",
        "en": "Tokyo Story"
      }
    }
  }
}
```

### Name multi._key vs Title multi._keys

**Names**: Each name object has its own `multi._key`
```javascript
{
  family: "Du",
  given: "Weisheng",
  multi: {
    main: "zh-CN",
    _key: {
      "zh-CN": {family: "杜", given: "伟生"}
    }
  }
}
```

**Titles/Fields**: Item-level `multi._keys` with field names as keys
```javascript
{
  title: "Huangjin shidai",
  multi: {
    main: "zh-CN",
    _keys: {
      title: {
        "zh-CN": "黄金时代",
        "en": "The Golden Age"
      },
      publisher: {
        "zh-CN": "花城出版社",
        "en": "Huacheng Publishing House"
      }
    }
  }
}
```

---

## Rendering Flow Diagram

```
User Data (Zotero Item)
  ↓
Plugin Callback (enrichAuthorNames)
  ↓
CSL-JSON with multi._key populated
  ↓
Citeproc Engine Initialization
  ↓
setLangPrefsForCites({persons: ['translit', 'orig']})
  ↓
Citation/Bibliography Rendering
  ↓
For each author:
  ├─ getName(name, 'locale-translit') → Returns romanized variant
  ├─ getName(name, 'locale-orig') → Returns original variant
  └─ Combine with citeAffixes spacing
  ↓
Output: "Du Weisheng 杜伟生"
```

---

## Comparison: Current Approach vs Multi-Slot

### Current CNE Approach (String Concatenation)

**Data**:
```javascript
{
  family: "Du",
  given: "Weisheng 杜伟生",  // ← Concatenated in JavaScript
  multi: {main: "zh-CN"}
}
```

**Pros**:
- ✅ Works in ALL contexts (citations, bibliography, notes)
- ✅ No configuration needed
- ✅ Predictable output
- ✅ Style-agnostic

**Cons**:
- ❌ Can't selectively hide original script
- ❌ Fixed format (always romanized + original)

### Multi-Slot Approach

**Data**:
```javascript
{
  family: "Du",
  given: "Weisheng",
  multi: {
    main: "zh-CN",
    _key: {
      "zh-CN": {family: "杜", given: "伟生"}
    }
  }
}
```

**Configuration**:
```javascript
// Chicago: Show both
engine.setLangPrefsForCites({persons: ['translit', 'orig']});

// APA: Show romanized only
engine.setLangPrefsForCites({persons: ['translit']});
```

**Pros**:
- ✅ Flexible (different formats possible)
- ✅ Separates data from presentation
- ✅ Leverages built-in citeproc infrastructure

**Cons**:
- ❌ Only works in bibliography (not in-text citations)
- ❌ Requires JavaScript configuration (plugin must know which config)
- ❌ No CSL XML control

---

## Architectural Implications for CNE

### The Configuration Problem

**Question**: How does the plugin know which cite-lang-prefs configuration to use?

**Options**:

1. **Style Detection** (You wanted to avoid)
   - Plugin detects style ID/name
   - Calls appropriate `setLangPrefsForCites()`
   - Con: Plugin must be style-aware

2. **User Preference**
   - User selects: "Display original script in names: Yes/No"
   - Plugin configures accordingly
   - Con: User must manually align with chosen style

3. **Convention-Based**
   - Plugin provides BOTH formats (main + multi._key)
   - Styles document expected configuration
   - Con: Still requires user/plugin to configure engine

4. **Dual Rendering Modes**
   - Use string concatenation for citations (always works)
   - Use multi-slot for bibliography (configurable)
   - Con: Inconsistent between citation and bibliography

### Why String Concatenation Remains Viable

Given the limitations discovered:

1. **Multi-slot doesn't work in citations** (only bibliography)
2. **No CSL XML configuration** (requires plugin intervention)
3. **Plugin must decide configuration** (style detection or user preference)

**Conclusion**: String concatenation is still the **most robust** approach for **consistent** display across all citation contexts.

---

## Future Possibilities

### If CSL 2.0 Adds cite-lang-prefs Attributes

**Hypothetical CSL XML**:
```xml
<style>
  <info>
    <title>Chicago CNE</title>
    <cite-lang-prefs persons="translit orig" titles="translit orig"/>
  </info>
  <!-- ... -->
</style>
```

**Impact**:
- Styles could self-configure multi-slot rendering
- Plugin just populates `multi._key` with all variants
- No style detection needed

**Current Status**: No such feature exists or is planned (as of 2025-01).

### If Zotero Adds Native Multilingual UI

**Scenario**: Zotero adds built-in fields for romanization/translation

**Impact**:
- CNE plugin could become obsolete (or complementary)
- But Extra field approach would still work as fallback

**Current Status**: No indication from Zotero team (as of 2025-01).

---

## Key Takeaways

1. **Multi-slot infrastructure EXISTS** in citeproc-js and is fully functional
2. **Bibliography-only limitation** makes it unsuitable for in-text citations
3. **No CSL XML configuration** means plugin MUST decide configuration strategy
4. **String concatenation approach** is still the most practical for consistent cross-context display
5. **Multi-layout feature** (CSL-M) is separate and works in regular Zotero
6. **All configuration requires JavaScript APIs** - styles cannot self-configure multilingual rendering

---

## Code Reference Index

### Critical Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `CSL.NameOutput.prototype.getName` | Lines 14209-14270 | Selects language variant from multi._key |
| `CSL.NameOutput.prototype._renderPersonalName` | Lines 13701-13750 | Combines primary/secondary/tertiary slots |
| `CSL.Engine.prototype.setLangPrefsForCites` | Lines 5000-5041 | Configure multi-slot rendering |
| `CSL.Engine.prototype.setLangPrefsForCiteAffixes` | Lines 5043-5073 | Configure slot spacing |
| `CSL.Engine.prototype.setLangTagsForCslTransliteration` | Lines 4978-4987 | Set romanization language tags |

### Critical Data Structures

| Structure | Location | Purpose |
|-----------|----------|---------|
| `cite-lang-prefs` | Lines 6497-6505 | Default single-slot configuration |
| `citeAffixes` | Lines 6381-6466 | Prefix/suffix for all slots |
| `locale-translit` / `locale-translat` | Lines 6379-6380 | Language tag arrays |
| `slot` object | Lines 13403, 13660, 18245 | Runtime slot configuration |

### Critical Control Flow

| Logic | Location | Impact |
|-------|----------|--------|
| Bibliography-only check | Lines 13672-13679 | Disables secondary/tertiary in citations |
| Slot mapping loop | Lines 13405-13413 | Converts cite-lang-prefs to locale-* slots |
| Variant selection | Lines 14240-14270 | Searches multi._key for matching language |
| Affix application | Lines 13728-13750 | Adds spacing between slot outputs |

---

## Related Documentation

- **Experiment A**: `/docs/multi-key-experiment.md` - Initial multi._key testing (2025-10-17)
- **Name Ordering**: `/docs/citeproc-name-ordering.md` - multi.main investigation
- **CNE Convention**: `/docs/CNE-STYLE-CONVENTION.md` - Style modification guidelines

---

## Investigation Credits

- **Date**: 2025-10-18
- **Researcher**: Claude (Anthropic) + User (Bo An)
- **Method**: Systematic citeproc-js source code analysis + forum research
- **Key Forum Source**: Adam Smith (Zotero maintainer) - forums.zotero.org/discussion/109616
