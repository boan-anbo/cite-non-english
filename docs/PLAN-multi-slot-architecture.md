# Plan: Multi-Slot Architecture for Style-Aware Name Rendering

**Date**: 2025-10-18
**Status**: 📋 Planned - Ready for Implementation
**Goal**: Enable CSL styles to declaratively control multilingual name display

---

## Problem Statement

**Current Limitation**:
- Chicago CNE needs: "Ozu Yasujirō 小津安二郎" (romanized + original)
- APA CNE needs: "Ozu, Y." (romanized only)
- Current solution: String concatenation in JavaScript (always shows both)

**Architecture Requirement**:
- Plugin must remain style-agnostic
- CSL styles should control their own display preferences
- No hardcoded style detection in plugin code

---

## Solution: CNE-CONFIG Metadata Convention

### Core Concept

**Styles declare their needs** via metadata → **Plugin reads and configures** → **Citeproc renders accordingly**

### Implementation Strategy

**1. Style Metadata Declaration**

Add `CNE-CONFIG:` marker to style's `<summary>` element:

```xml
<!-- Chicago CNE -->
<style xmlns="http://purl.org/net/xbiblio/csl" ...>
  <info>
    <title>Chicago Manual of Style 18th edition - CNE</title>
    <summary>CNE-CONFIG: persons=translit,orig titles=translit,orig</summary>
  </info>
  <!-- ... -->
</style>
```

```xml
<!-- APA CNE -->
<style xmlns="http://purl.org/net/xbiblio/csl" ...>
  <info>
    <title>APA 7th edition - CNE</title>
    <summary>CNE-CONFIG: persons=translit</summary>
  </info>
  <!-- ... -->
</style>
```

**Syntax**:
```
CNE-CONFIG: <field-type>=<slot1>[,<slot2>[,<slot3>]] [<field-type>=...]
```

**Field Types**: `persons`, `institutions`, `titles`, `journals`, `publishers`, `places`

**Slot Values**: `orig`, `translit`, `translat`

**Examples**:
- `persons=translit,orig` → Show romanized + original for names
- `persons=translit` → Show romanized only for names
- `persons=orig` → Show original only for names
- `titles=translit,orig journals=translit` → Multiple field configs

**2. Plugin Configuration Flow**

```
Engine Initialization
  ↓
Parse Style XML
  ↓
Extract CNE-CONFIG from <summary>
  ↓
Parse configuration string
  ↓
Call engine.setLangPrefsForCites(config)
  ↓
Ready for rendering
```

**Implementation Location**: New module or extend existing citeproc integration

**3. Data Population (enrichAuthorNames)**

**Key Change**: ALWAYS populate complete data, no conditional logic

```javascript
// ALWAYS do this for CNE items:
if (cneCreator.lastRomanized || cneCreator.firstRomanized) {
  // Main fields: romanized
  cslCreator.family = cneCreator.lastRomanized;
  cslCreator.given = cneCreator.firstRomanized;
}

if (cneCreator.lastOriginal || cneCreator.firstOriginal) {
  // multi._key: original script
  if (!cslCreator.multi) cslCreator.multi = {};
  if (!cslCreator.multi._key) cslCreator.multi._key = {};

  cslCreator.multi._key[originalLang] = {
    family: cneCreator.lastOriginal,
    given: cneCreator.firstOriginal
  };
}

// Set multi.main for name ordering
cslCreator.multi.main = originalLang;
```

**No More String Concatenation**: Remove lines 428-435 that concatenate original to given field

**4. Citeproc Rendering**

With `persons: ['translit', 'orig']` configured:
1. Primary slot: getName(name, 'locale-translit') → "Ozu Yasujirō"
2. Secondary slot: getName(name, 'locale-orig') → "小津 安二郎"
3. Combine with space: "Ozu Yasujirō 小津安二郎"

With `persons: ['translit']` configured:
1. Primary slot only: getName(name, 'locale-translit') → "Ozu Yasujirō"
2. No secondary slot
3. Output: "Ozu, Y." (after name truncation rules)

---

## Technical Implementation

### Module 1: CNE Config Parser

**File**: `src/modules/cne/config/parseCNEConfig.ts` (new)

**Purpose**: Extract and parse CNE-CONFIG from style metadata

```typescript
export interface CNEConfigOptions {
  persons?: string[];      // e.g., ['translit', 'orig']
  institutions?: string[];
  titles?: string[];
  journals?: string[];
  publishers?: string[];
  places?: string[];
}

/**
 * Parse CNE-CONFIG string from style metadata
 *
 * Example input: "persons=translit,orig titles=translit"
 * Returns: { persons: ['translit', 'orig'], titles: ['translit'] }
 */
export function parseCNEConfig(configString: string): CNEConfigOptions {
  // Implementation
}

/**
 * Extract CNE-CONFIG from style XML summary
 *
 * Searches for pattern: CNE-CONFIG: <config-string>
 */
export function extractCNEConfigFromStyle(styleXml: string): CNEConfigOptions | null {
  // Parse XML
  // Find <summary> element
  // Look for CNE-CONFIG: marker
  // Extract and parse config string
}
```

### Module 2: Citeproc Configuration

**File**: `src/modules/cne/integration/configureCiteproc.ts` (new or extend existing)

**Purpose**: Apply CNE config to citeproc engine

```typescript
import { CNEConfigOptions } from '../config/parseCNEConfig';

/**
 * Configure citeproc engine with CNE settings
 *
 * Must be called AFTER engine creation but BEFORE first rendering
 */
export function configureCiteprocForCNE(
  engine: any,  // CSL.Engine type
  config: CNEConfigOptions
): void {
  // Call engine.setLangPrefsForCites(config)

  // Optional: Configure citeAffixes if needed
  // engine.setLangPrefsForCiteAffixes(affixArray)

  // Configure language tags for transliteration
  // engine.setLangTagsForCslTransliteration(['ja-Latn', 'zh-Latn-pinyin', 'ko-Latn'])
}
```

### Module 3: Modify enrichAuthorNames

**File**: `src/modules/cne/callbacks/enrichAuthorNames.ts`

**Changes**:

1. **Remove string concatenation** (lines 423-435):
```typescript
// DELETE THIS:
const originalName = formatOriginalName(cneCreator);
if (originalName) {
  if (cslCreator.given) {
    cslCreator.given = `${cslCreator.given} ${originalName}`;
  } else {
    cslCreator.given = originalName;
  }
}
```

2. **Add multi._key population**:
```typescript
// ADD THIS:
if (cneCreator.lastOriginal || cneCreator.firstOriginal) {
  if (!cslCreator.multi) {
    cslCreator.multi = { main: originalLang };
  }
  if (!cslCreator.multi._key) {
    cslCreator.multi._key = {};
  }

  cslCreator.multi._key[originalLang] = {
    family: cneCreator.lastOriginal || '',
    given: cneCreator.firstOriginal || ''
  };
}
```

3. **Keep multi.main setting** (already exists, lines 365-373):
```typescript
// This part stays the same - essential for name ordering
if (!cslCreator.multi) {
  cslCreator.multi = {};
}
if (originalLang && !cslCreator.multi.main) {
  cslCreator.multi.main = originalLang;
}
```

### Module 4: Integration Point

**File**: Where citeproc engine is initialized (TBD - need to find this)

**Integration**:
```typescript
// After engine creation
const engine = new CSL.Engine(sys, styleXml, locale);

// Extract CNE config from style
const cneConfig = extractCNEConfigFromStyle(styleXml);

// Apply configuration if found
if (cneConfig) {
  configureCiteprocForCNE(engine, cneConfig);
}

// Now engine is configured and ready
return engine;
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Engine Initialization                                    │
│                                                              │
│  new CSL.Engine(sys, styleXml, locale)                      │
│    ↓                                                         │
│  extractCNEConfigFromStyle(styleXml)                        │
│    ↓                                                         │
│  Parse: "CNE-CONFIG: persons=translit,orig"                 │
│    ↓                                                         │
│  configureCiteprocForCNE(engine, {persons: ['translit',     │
│                                            'orig']})         │
│    ↓                                                         │
│  engine.setLangPrefsForCites({persons: ['translit',         │
│                                        'orig']})             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Item Retrieval & Enrichment                              │
│                                                              │
│  sys.retrieveItem(itemID)                                   │
│    ↓                                                         │
│  enrichAuthorNames(cslItem, zoteroItem, metadata)           │
│    ↓                                                         │
│  Populate CSL-JSON:                                          │
│  {                                                           │
│    family: "Ozu",              // Romanized                 │
│    given: "Yasujirō",                                       │
│    multi: {                                                  │
│      main: "ja",                                             │
│      _key: {                                                 │
│        'ja': {                 // Original                   │
│          family: "小津",                                     │
│          given: "安二郎"                                     │
│        }                                                     │
│      }                                                       │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Citeproc Rendering (Bibliography)                        │
│                                                              │
│  slot = {                                                    │
│    primary: 'locale-translit',    // From cite-lang-prefs   │
│    secondary: 'locale-orig'                                 │
│  }                                                           │
│    ↓                                                         │
│  getName(name, 'locale-translit')                           │
│    → Returns: {family: "Ozu", given: "Yasujirō"}           │
│    ↓                                                         │
│  getName(name, 'locale-orig')                               │
│    → Finds multi._key['ja']                                 │
│    → Returns: {family: "小津", given: "安二郎"}             │
│    ↓                                                         │
│  Combine with citeAffixes:                                  │
│    "Ozu Yasujirō" + " " + "小津安二郎"                      │
│    ↓                                                         │
│  Output: "Ozu Yasujirō 小津安二郎"                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefits

### Architectural

1. **✅ Style-Agnostic Plugin**: Plugin doesn't hardcode style names/IDs
2. **✅ Declarative Configuration**: Styles explicitly state their needs
3. **✅ Separation of Concerns**:
   - Plugin: Provides complete data
   - Style: Declares preferences
   - Citeproc: Renders accordingly
4. **✅ No Conditional Logic**: enrichAuthorNames always does the same thing
5. **✅ Extensible**: Easy to add new field types or slot combinations

### User Experience

1. **✅ Automatic**: Users don't configure anything
2. **✅ Correct**: Each style gets exactly what it needs
3. **✅ Consistent**: Behavior determined by style, not user settings

### Maintainability

1. **✅ Self-Documenting**: CNE-CONFIG in style makes intent explicit
2. **✅ Testable**: Can test different configs independently
3. **✅ Future-Proof**: New styles just add CNE-CONFIG metadata

---

## Limitations & Caveats

### 1. Bibliography-Only Multi-Slot

**Limitation**: Secondary/tertiary slots only render in bibliography, not in-text citations

**Impact**:
- In-text: `(Du 2007)` will use primary slot only
- Bibliography: Full multi-slot rendering works

**Workaround**: For in-text citations, citeproc uses abbreviated names anyway, so showing romanized-only is often appropriate.

**Future**: If CSL adds multi-slot for citations, this will automatically work.

### 2. Style Author Responsibility

**Requirement**: Style authors must add CNE-CONFIG to their metadata

**Mitigation**:
- Document clearly in CNE-STYLE-CONVENTION.md
- Provide examples and templates
- Most CNE styles are created by us anyway

### 3. Fallback Behavior

**Question**: What if style has no CNE-CONFIG?

**Answer**: Default to current behavior (string concatenation) or use safe default like `persons: ['translit']`

**Implementation**:
```typescript
if (!cneConfig) {
  // Option A: Default to romanized only (safe for most styles)
  cneConfig = { persons: ['translit'] };

  // Option B: Fall back to string concatenation
  // (keep current enrichAuthorNames behavior)
}
```

---

## Testing Strategy

### Test Cases

1. **Chicago CNE with CNE-CONFIG: persons=translit,orig**
   - Input: Japanese author with romanized + original
   - Expected bibliography: "Ozu Yasujirō 小津安二郎"
   - Expected citation: Abbreviated as appropriate

2. **APA CNE with CNE-CONFIG: persons=translit**
   - Input: Same Japanese author
   - Expected bibliography: "Ozu, Y."
   - Expected citation: "Ozu, 1953"

3. **Style without CNE-CONFIG**
   - Input: Japanese author
   - Expected: Fallback behavior (romanized only)

4. **Mixed authors (some CNE, some not)**
   - Input: Japanese author + Western author
   - Expected: CNE author gets multi._key, Western author doesn't
   - Both render correctly

5. **Invalid CNE-CONFIG syntax**
   - Input: Malformed config string
   - Expected: Graceful fallback, log warning

### Test Files

- `test/csl-tests/chicago-18th-multi-slot.test.ts` (new)
- `test/csl-tests/apa-7th-multi-slot.test.ts` (new)
- Update existing expectations to use multi._key structure

---

## Migration Strategy

### Phase 1: Infrastructure (This PR)

1. ✅ Document multi-slot architecture (done)
2. ⬜ Create CNE config parser module
3. ⬜ Create citeproc configuration module
4. ⬜ Find engine initialization point in plugin
5. ⬜ Integrate config extraction and application

### Phase 2: Data Population

1. ⬜ Modify enrichAuthorNames to populate multi._key
2. ⬜ Remove string concatenation
3. ⬜ Keep multi.main for name ordering
4. ⬜ Add unit tests for data structure

### Phase 3: Style Updates

1. ⬜ Add CNE-CONFIG to Chicago CNE styles
2. ⬜ Add CNE-CONFIG to APA CNE styles
3. ⬜ Update CNE-STYLE-CONVENTION.md with guidelines

### Phase 4: Testing & Validation

1. ⬜ Update test expectations for new data structure
2. ⬜ Run full test suite
3. ⬜ Visual verification with Zotero
4. ⬜ Test edge cases

### Phase 5: Documentation

1. ⬜ Update README with new architecture
2. ⬜ Document CNE-CONFIG syntax
3. ⬜ Add examples for style authors

---

## Open Questions

### Q1: Where is the engine initialized in the plugin?

**Need to find**: The code location where `new CSL.Engine()` is called

**Search for**:
- `new CSL.Engine`
- `createEngine`
- Citeproc integration module

### Q2: Should we support title/publisher multi-slot too?

**Current focus**: Names only (persons)

**Future**: Could extend to titles, publishers, etc. using same mechanism

**Decision**: Start with persons, add others if needed

### Q3: What's the fallback for styles without CNE-CONFIG?

**Options**:
- A) Default to `persons: ['translit']` (safe, romanized only)
- B) Keep string concatenation as fallback
- C) Require CNE-CONFIG (fail if missing)

**Recommendation**: Option A (safe default)

### Q4: How to handle language tag configuration?

**Current**: Hardcoded in enrichAuthorNames (e.g., 'ja', 'zh-CN')

**Question**: Should setLangTagsForCslTransliteration be configured too?

**Answer**: Probably not needed - using item's language code ('ja', 'zh-CN') as key works fine

---

## Success Criteria

**Definition of Done**:

1. ✅ Chicago CNE bibliography shows romanized + original
2. ✅ APA CNE bibliography shows romanized only
3. ✅ No hardcoded style detection in plugin
4. ✅ CNE-CONFIG metadata documented
5. ✅ All tests passing
6. ✅ Visual verification in Zotero

**Performance**: No performance regression (config parsing happens once at initialization)

**Compatibility**: Backward compatible (styles without CNE-CONFIG fall back gracefully)

---

## Related Documentation

- **Discovery**: `/docs/citeproc-multilingual-infrastructure.md`
- **Experiment A**: `/docs/multi-key-experiment.md`
- **Style Convention**: `/docs/CNE-STYLE-CONVENTION.md`
- **Name Ordering**: `/docs/citeproc-name-ordering.md`

---

## Future Enhancements

### 1. Extended Field Support

Beyond `persons`, support:
- `titles`: For book/article titles
- `publishers`: For publisher names
- `journals`: For journal titles

### 2. Per-Locale Configuration

```xml
<summary>
CNE-CONFIG-ja: persons=translit,orig
CNE-CONFIG-zh: persons=translit,orig
CNE-CONFIG-ko: persons=translit
</summary>
```

Different configs for different source languages.

### 3. GUI Configuration

If fallback to user preference is needed, provide Zotero preference UI:
```
Preferences > CNE > Default name display:
○ Romanized only
● Romanized + original script (recommended)
○ Original script only
```

But this should be last resort - prefer style-declared config.

---

**End of Plan Document**
