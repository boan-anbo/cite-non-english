# CNE Style Modification Convention

**Version:** 2.2
**Last Updated:** 2025-10-21
**Build System:** Style Variant Builder (located in `styles/` directory)
**Reference Implementation:** `styles/diffs/chicago-notes-bibliography-cne.diff`

## Overview

This document defines the standard workflow for creating CNE (Cite Non-English) variants of upstream CSL (Citation Style Language) styles using the **Style Variant Builder** system. CNE enables proper citation of non-English sources by displaying:

1. **Romanized forms** (primary display)
2. **Original script** (parallel display)
3. **English translation** (parallel display in brackets)

**Example Output:**
```
Hao Chunwen 郝春文. Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang
during the late Tang, Five Dynasties and early Song]. Zhongguo shehui kexue chubanshe, 1998.
```

## Core Principles

### 1. Use Style Variant Builder for Maintainability
All CNE variants MUST be managed through the Style Variant Builder workflow located in `tools/style-variant-builder/`. This provides:
- **Template-based management**: Single CNE template per style family
- **Diff-based tracking**: Small patch files for variant-specific changes
- **Automatic macro pruning**: Removes unused macros from final output
- **Version tracking**: Clear linkage to upstream style versions

### 2. Separation of Concerns
- CNE modifications are isolated in clearly-named helper macros with `cne-` prefix
- Original style logic remains unchanged
- All CNE-specific code is easily identifiable via `grep "cne-"`

### 3. Base on Specific Upstream Versions
- Always use specific upstream versions (e.g., `apa-7th-2024-07-09.csl`)
- **Never** use bare templates that lack version-specific features
- Track upstream version in filenames: `cne-{style}-{edition}-{variant}-{upstream-date}.csl`

## CRITICAL: Actual Build System Location

**⚠️  IMPORTANT UPDATE:** The actual Style Variant Builder implementation is located in `styles/` directory, NOT `tools/style-variant-builder/`.

### Actual Directory Structure

```
styles/
├── templates/         # Base upstream templates (NO CNE modifications)
├── diffs/            # Diff files (SOURCE OF TRUTH for all CNE modifications)
├── development/      # Generated files (template + diff applied)
├── output/           # Final variants (development + macro pruning)
├── cne/              # Production files (manually copied from output/)
├── upstream/         # Pristine upstream styles
├── Makefile          # Build automation
└── README.md         # Workflow documentation
```

### The Source of Truth: Diff Files

**CRITICAL PRINCIPLE**: The **diff files** (`styles/diffs/*.diff`) contain ALL CNE modifications including:
- CNE macro **definitions** (all 7 macros)
- CNE macro **invocations** (wrapping title-primary, etc.)
- Metadata changes (title, ID, CNE-CONFIG, self-links)

**NEVER manually edit:**
- ❌ `development/` files (auto-generated from template + diff)
- ❌ `output/` files (auto-generated with macro pruning)

**Safe to edit:**
- ✅ `diffs/` files (source of truth)
- ✅ `templates/` files (upstream bases)
- ✅ `cne/` files (for minor tweaks like self-links ONLY - then commit immediately)

### Common Mistake to Avoid

**❌ WRONG WORKFLOW:**
```bash
# Edit development file directly
vim styles/development/chicago-notes-bibliography-cne.csl

# Generate diff from modified development file
make diffs  # ← This OVERWRITES the good diff!

# Build final
make  # ← Builds from bad diff, loses CNE macros

# Result: CNE macros disappear, tests fail
```

**✅ CORRECT WORKFLOW:**

**For updating metadata only (like self-links):**
```bash
# Option 1: Edit diff file directly with sed
cd styles/diffs
sed -i '' 's|old-url|new-url|' chicago-notes-bibliography-cne.diff

# Option 2: Edit final cne/ files directly (for simple changes)
cd styles/cne
sed -i '' 's|old-url|new-url|' *.csl
# Then commit immediately without regenerating!
```

**For modifying CNE functionality:**
```bash
# 1. Edit diff file to add/modify CNE macros
vim styles/diffs/chicago-notes-bibliography-cne.diff

# 2. Regenerate development from template + diff
make dev

# 3. Build final with macro pruning
make

# 4. Copy to production
cp styles/output/chicago-notes-bibliography/chicago-notes-bibliography-cne.csl styles/cne/

# 5. Test
npm test
```

### Build Commands

```bash
cd styles

# Regenerate development files from templates + diffs
make dev

# Build final output with macro pruning
make

# Both steps together
make dev && make

# Clean generated files
make clean
```

## CNE Helper Macros

We add exactly **7 standard helper macros** to every CNE style variant. These macros follow a consistent naming pattern: `cne-{element}-{action}`

### 1. Title Selection Macros

#### `cne-title-select`
**Purpose:** Select the appropriate title variable (romanized if available, otherwise standard)

```xml
<macro name="cne-title-select">
  <choose>
    <if variable="cne-title-romanized">
      <text variable="cne-title-romanized"/>
    </if>
    <else>
      <text variable="title"/>
    </else>
  </choose>
</macro>
```

#### `cne-title-select-short`
**Purpose:** Select short title with romanized support

```xml
<macro name="cne-title-select-short">
  <choose>
    <if variable="cne-title-romanized">
      <!-- CNE mode: try short romanized, fallback to full -->
      <choose>
        <if variable="cne-title-romanized-short">
          <text variable="cne-title-romanized-short"/>
        </if>
        <else>
          <text variable="cne-title-romanized"/>
        </else>
      </choose>
    </if>
    <else>
      <!-- Standard: use title with auto-shortening -->
      <text form="short" variable="title"/>
    </else>
  </choose>
</macro>
```

#### `cne-title-supplements`
**Purpose:** Add original script and English translation alongside romanized title

```xml
<macro name="cne-title-supplements">
  <choose>
    <if variable="cne-title-romanized">
      <group delimiter=" ">
        <text variable="cne-title-original"/>
        <text prefix="[" suffix="]" variable="cne-title-english"/>
      </group>
    </if>
  </choose>
</macro>
```

### 2. Container Title Selection Macros

#### `cne-container-title-select`
**Purpose:** Select container title (journal/book) with CNE support

```xml
<macro name="cne-container-title-select">
  <choose>
    <if variable="cne-container-title-romanized">
      <text variable="cne-container-title-romanized"/>
    </if>
    <else-if variable="cne-journal-romanized">
      <text variable="cne-journal-romanized"/>
    </else-if>
    <else>
      <text variable="container-title"/>
    </else>
  </choose>
</macro>
```

#### `cne-container-title-select-short`
**Purpose:** Short container title with CNE support

```xml
<macro name="cne-container-title-select-short">
  <choose>
    <if variable="cne-container-title-romanized">
      <!-- CNE mode: try short romanized, fallback to full -->
      <choose>
        <if variable="cne-container-title-romanized-short">
          <text variable="cne-container-title-romanized-short"/>
        </if>
        <else>
          <text variable="cne-container-title-romanized"/>
        </else>
      </choose>
    </if>
    <else-if variable="cne-journal-romanized">
      <!-- CNE mode: try short romanized, fallback to full -->
      <choose>
        <if variable="cne-journal-romanized-short">
          <text variable="cne-journal-romanized-short"/>
        </if>
        <else>
          <text variable="cne-journal-romanized"/>
        </else>
      </choose>
    </else-if>
    <else>
      <!-- Standard: use container-title with auto-shortening -->
      <text form="short" variable="container-title"/>
    </else>
  </choose>
</macro>
```

#### `cne-container-title-supplements`
**Purpose:** Add original and English translation for container titles

```xml
<macro name="cne-container-title-supplements">
  <choose>
    <if variable="cne-container-title-romanized">
      <group delimiter=" ">
        <text variable="cne-container-title-original"/>
        <text prefix="[" suffix="]" variable="cne-container-title-english"/>
      </group>
    </if>
    <else-if variable="cne-journal-romanized">
      <text variable="cne-journal-original"/>
    </else-if>
  </choose>
</macro>
```

### 3. Publisher Selection Macro

#### `cne-publisher-select`
**Purpose:** Select publisher with romanized support

```xml
<macro name="cne-publisher-select">
  <choose>
    <if variable="cne-publisher-romanized">
      <text variable="cne-publisher-romanized"/>
    </if>
    <else>
      <text variable="publisher"/>
    </else>
  </choose>
</macro>
```

## CNE-CONFIG Metadata Convention

**Version:** 2.1
**Introduced:** 2025-10-18
**Updated:** 2025-10-19 (added `romanizedFormatting` for comma control)
**Purpose:** Enable style-specific control of multi-slot rendering and formatting for creator names

### Overview

CNE styles MUST declare their language variant display preferences using the `CNE-CONFIG` metadata marker in the style's `<summary>` element. This tells the CNE plugin how to configure citeproc-js's multi-slot rendering system for that specific style.

**Key Insight:** Different citation styles have different requirements:
- **Chicago Manual of Style**: Display romanized + original script ("Du Weisheng 杜伟生")
- **APA Style**: Display romanized only ("Du, W.")

The CNE-CONFIG convention allows each style to declare its preferences WITHOUT requiring the plugin to hardcode style detection.

### Architecture: Multi-Slot Rendering System

CNE uses citeproc-js's built-in multi-slot rendering system:

1. **Data Layer** (Plugin responsibility):
   - Main fields (family/given) → Romanized version
   - multi._key[language] → Original script version
   - Plugin ALWAYS populates complete data

2. **Configuration Layer** (Style declaration):
   - Style declares: "I want romanized + original" via CNE-CONFIG
   - Plugin reads CNE-CONFIG and configures citeproc

3. **Rendering Layer** (Citeproc-js):
   - Uses cite-lang-prefs configuration to select which variants to display
   - Renders primary slot (romanized) and secondary slot (original) if configured

### Syntax

Add CNE-CONFIG to the `<summary>` element:

```xml
<info>
  <title>Style Name - CNE</title>
  <summary>Description of the style
CNE-CONFIG: persons=translit,orig titles=translit,orig</summary>
  <updated>2025-10-18T00:00:00+00:00</updated>
</info>
```

**Format:**
```
CNE-CONFIG: <field-type>=<slot1>[,<slot2>[,<slot3>]] [<field-type>=...]
```

**Field Types:**
- `persons` - Personal/corporate names (authors, editors, directors, etc.)
- `institutions` - Institutional names
- `titles` - Book/article titles
- `journals` - Journal titles
- `publishers` - Publisher names
- `places` - Place names

**Slot Values:**
- `orig` - Original script (uses main fields or falls back to multi._key)
- `translit` - Transliteration/romanization (searches multi._key for romanized variants)
- `translat` - Translation (searches multi._key for translated variants)

**Slot Mechanism:**
- First slot → Primary (always rendered)
- Second slot → Secondary (rendered in bibliography only)
- Third slot → Tertiary (rendered in bibliography only)

### Romanized Name Formatting Control (`nameFormatting`)

**Version:** 2.1
**Introduced:** 2025-10-20
**Problem Solved:** Conflicting comma requirements between Chicago and APA styles for romanized CJK names

#### The Problem: Comma Formatting Conflict

Different citation styles have fundamentally different requirements for romanized CJK name formatting:

- **Chicago Manual of Style**: Romanized CJK names format with **no commas** (family-first, Asian convention)
  - Example: "Hao Chunwen" not "Hao, Chunwen"
  - Rationale: Preserves Asian name ordering conventions even in romanization

- **APA Style 7th Edition**: Romanized CJK names format **with commas** (inverted, Western convention)
  - Example: "Hao, C." not "Hao C."
  - Rationale: APA requires all author names to follow Western formatting with sort-order commas
  - Source: Yale University Library guide, https://guides.library.yale.edu/c.php?g=296262&p=1974231

**The Architectural Challenge:** Both styles use the **same romanized data** from Zotero items, but require **different formatting**. This cannot be solved at the CSL macro level because name formatting is controlled by citeproc-js's internal romanesque detection system.

#### Root Cause: Citeproc's `_isRomanesque()` Function

Citeproc-js determines name formatting using the `_isRomanesque()` function (lines 13771-13779):

```javascript
// Simplified from citeproc.js
function _isRomanesque(name) {
  var romanesque = 2; // Default: pure romanesque (respects CSL formatting)

  // Downgrade if mixed content detected
  if (name.multi && name.multi.main) {
    var langTag = name.multi.main;
    if (langTag === 'ja' || langTag === 'zh' || langTag === 'ko') {
      romanesque = 1; // Mixed content: family-first, NO comma
    }
  }

  return romanesque;
}
```

**Key Behavior:**
- `romanesque = 2` (pure romanesque): Respects CSL `name-as-sort-order` attribute → commas when requested
- `romanesque = 1` (mixed content): Hardcoded family-first with **no commas**, ignoring CSL settings
- `romanesque = 0` (pure CJK): Family-first, no space, no comma

**The Problem:** When `multi.main='ja'/'zh'`, citeproc downgrades to romanesque=1, formatting as "Family Given" (no comma) regardless of APA's `name-as-sort-order="all"` CSL attribute.

**Historical Context:** This behavior was intentionally hardcoded by Frank Bennett (citeproc-js author) to match Chicago Manual of Style's requirements for romanized CJK names. See: https://forums.zotero.org/discussion/38335/

#### The Solution: Dual Romanized Variants

CNE creates **two romanized variants** with different `multi.main` values:

1. **Native Formatting** (for Chicago): `multi._key['en']`
   - Does NOT set `multi.main` → inherits item.language='ja'/'zh'
   - Triggers romanesque=1 → "Family Given" (no comma)

2. **Western Formatting** (for APA): `multi._key['en-x-western']`
   - Sets `multi.main='en'` → treated as pure English
   - Maintains romanesque=2 → respects CSL `name-as-sort-order` → commas

The `nameFormatting.romanizedCJK.separator` field in CNE-CONFIG selects which variant to use via citeproc's `setLangTagsForCslTransliteration()` API.

#### JSON Format (Required for nameFormatting)

**Version 2.1 Syntax (Modular):**
```json
{
  "persons": ["translit", "orig"],
  "nameFormatting": {
    "romanizedCJK": {
      "order": "last-name-first",
      "separator": "space"
    }
  }
}
```

**Fields:**
- `persons`, `institutions`: Arrays of slot values (`orig`, `translit`, `translat`)
- `nameFormatting`: Object containing formatting options
  - `romanizedCJK`: Object specifying how romanized CJK names format
    - `order`: `"last-name-first"` or `"first-name-first"` (default: `"last-name-first"`)
    - `separator`: `"space"` or `"comma"` (default: `"space"`)

#### nameFormatting.romanizedCJK Values

**order:**
- `"last-name-first"` (default): Family name comes first (e.g., "Hao Chunwen", "Hao, C.")
- `"first-name-first"`: Given name comes first (e.g., "Chunwen Hao" - rarely used)

**separator:**
- `"space"` (default): Space separator → "Hao Chunwen" (family-first, no comma)
  - Uses `multi._key['en']` variant (no `multi.main`)
  - Triggers romanesque=1 → ignores CSL `name-as-sort-order`
  - **Use for:** Chicago Manual of Style, styles preserving Asian name conventions

- `"comma"`: Comma separator → "Hao, C." (inverted with comma)
  - Uses `multi._key['en-x-western']` variant (with `multi.main='en'`)
  - Triggers romanesque=2 → respects CSL `name-as-sort-order`
  - **Use for:** APA Style, styles requiring Western comma formatting for all names

#### Design Philosophy

The new modular format:
- ✅ Avoids cultural assumptions (not "native" vs "western", but "space" vs "comma")
- ✅ Self-explanatory (describes observable format)
- ✅ Modular (order and separator controlled independently)
- ✅ Extensible (can add `originalCJK` spacing, etc. in future)
- ✅ Implementation-agnostic (hides citeproc details from style authors)

### Examples by Style

#### Chicago Manual of Style (Notes & Bibliography)

```xml
<summary>Chicago-style source citations, notes and bibliography system, with CNE support
CNE-CONFIG: {"persons":["translit","orig"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"space"}}}</summary>
```

**Configuration:**
- `persons: ["translit","orig"]` → Display romanized + original script for names
- `romanizedFormatting: "native"` → Use Asian formatting (no commas)

**Result:**
- Names: "Hao Chunwen 郝春文" (family-first, no comma)
- Titles: Romanized + original (handled by CNE title macros)

#### Chicago Manual of Style (Author-Date)

```xml
<summary>Chicago-style source citations, author-date system, with CNE support
CNE-CONFIG: {"persons":["translit","orig"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"space"}}}</summary>
```

**Result:** Same as notes-bibliography variant

#### APA 7th Edition

```xml
<summary>APA 7th edition with CNE support
CNE-CONFIG: {"persons":["translit"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"comma"}}}</summary>
```

**Configuration:**
- `persons: ["translit"]` → Display romanized only (no original script)
- `romanizedFormatting: "western"` → Use Western formatting (with commas)

**Result:**
- Names: "Hao, C." (inverted with comma)
- Titles: Romanized + [English translation] (handled by CNE title macros, original script omitted per APA guidelines)

**Why these settings?**
- APA requires commas for ALL author names, including romanized CJK names (Yale guide)
- APA shows only romanized forms in bibliography, not original script
- English translations in brackets are shown for non-English titles

### Implementation Details

#### How the Plugin Uses CNE-CONFIG

1. **At Engine Initialization:**
   ```typescript
   // After creating citeproc engine
   const engine = style.getCiteProc(locale, format);

   // Extract and apply CNE-CONFIG
   const cneConfig = extractCNEConfigFromStyle(style);
   // Returns: { persons: ['translit', 'orig'], titles: ['translit', 'orig'] }

   configureCiteprocForCNE(engine, cneConfig);
   // Calls: engine.setLangPrefsForCites(cneConfig)
   ```

2. **Data Population (enrichAuthorNames callback):**
   ```typescript
   // DUAL-VARIANT ARCHITECTURE (v2.0)
   // Creates TWO romanized variants to support different formatting needs

   // 1. Set ORIGINAL in main fields (for 'orig' slot)
   if (cneCreator.lastOriginal) {
     cslCreator.family = cneCreator.lastOriginal;
     cslCreator.given = cneCreator.firstOriginal;
   }

   // 2. Create DUAL romanized variants (for 'translit' slot)
   if (cneCreator.lastRomanized || cneCreator.firstRomanized) {
     // Variant 1: NATIVE formatting (no commas) - for Chicago
     cslCreator.multi._key['en'] = {
       family: cneCreator.lastRomanized || '',
       given: cneCreator.firstRomanized || ''
       // NO multi.main - inherits item.language='ja'/'zh', gets romanesque=1
     };

     // Variant 2: WESTERN formatting (commas) - for APA
     cslCreator.multi._key['en-x-western'] = {
       family: cneCreator.lastRomanized || '',
       given: cneCreator.firstRomanized || '',
       multi: {
         main: 'en'  // Forces romanesque=2, respects CSL formatting
       }
     };
   }
   ```

3. **Engine Configuration (configureCiteproc):**
   ```typescript
   // Select which romanized variant to use based on romanizedFormatting
   const romanizedFormatting = config.romanizedFormatting || 'native';
   const translitTags = romanizedFormatting === 'western'
     ? ['en-x-western']  // APA: use western variant
     : ['en'];           // Chicago: use native variant

   // Tell citeproc which language tags to use for 'translit' slot
   engine.setLangTagsForCslTransliteration(translitTags);
   ```

4. **Rendering:**
   - Citeproc-js selects which variants to display based on cite-lang-prefs + transliteration tags
   - Chicago (translit,orig + native) → "Hao Chunwen 郝春文" (romanized + original, no comma)
   - APA (translit + western) → "Hao, C." (romanized only, with comma)

#### Integration Points

CNE-CONFIG extraction and configuration happens at:
- `src/modules/cne/CnePreviewFactory.ts` (line 420) - Preview dialog
- `test/csl-tests/test-helpers.ts` (line 252) - Test suite

See `/docs/ENGINE-INTEGRATION-POINTS.md` for technical details.

### Default Behavior

If a CNE style has no CNE-CONFIG metadata:
- Plugin uses safe default: `{ persons: ['translit'], titles: ['translit'], ... }`
- Displays romanized only (matches APA convention)
- Prevents unexpected original script display in styles that don't want it

### Validation

The plugin validates CNE-CONFIG at runtime:
- Unknown field types → Error (valid: persons, institutions, titles, journals, publishers, places)
- Unknown slot values → Error (valid: orig, translit, translat)
- Too many slots (>3) → Error
- Invalid syntax → Falls back to default config

See `src/modules/cne/config/parseCNEConfig.ts` for validation logic.

### Maintenance Guidelines

When creating or updating CNE style variants:

1. **Determine style requirements:**
   - Review official style guide examples for non-English sources
   - Check if original script should display for author names
   - Check if romanized CJK names should have commas (Western) or not (Asian)
   - Check if original script should display for titles

2. **Add appropriate CNE-CONFIG (JSON format required for v2.0):**
   - **Chicago-like styles:**
     ```json
     {"persons":["translit","orig"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"space"}}}
     ```
     Displays: "Hao Chunwen 郝春文" (romanized + original, no comma)

   - **APA-like styles:**
     ```json
     {"persons":["translit"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"comma"}}}
     ```
     Displays: "Hao, C." (romanized only, with comma)

   - **Custom requirements:** Mix and match slot values and formatting as needed

3. **Test thoroughly:**
   - **Critical:** Verify romanized CJK names format correctly (comma vs no-comma)
   - Verify original script displays when expected
   - Verify titles display correctly (romanized + original + translation)
   - Check both bibliography and citation formats
   - Test with Chinese, Japanese, and Korean sources

### Future-Proofing: Semantic Abstraction Layer

**Key Architectural Principle:** CNE-CONFIG provides a **semantic** interface that is independent of citeproc implementation details.

#### Separation of Concerns

```
Style Authors → CNE-CONFIG (semantic) → parseCNEConfig → configureCiteproc → Citeproc-js
                    ↑                                           ↓
                 STABLE                                    CAN CHANGE
```

**User-Facing API (Stable):**
```json
{"persons":["translit","orig"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"space"}}}
```

Describes **WHAT** the style wants (romanized + original, Asian formatting) without specifying **HOW** to achieve it.

**Internal Implementation (Can Evolve):**
- Today: Dual variants with different `multi.main` values
- Tomorrow: Could use different mechanism if citeproc changes
- Future: Could support entirely different citation processors

#### Benefits

1. **Citeproc Updates:** If citeproc-js adds new APIs or changes behavior, we update `configureCiteproc.ts` without breaking existing styles
2. **Processor Independence:** Could support CSL-Java, citeproc-rs, or other processors with same CNE-CONFIG
3. **Gradual Migration:** If citeproc fixes underlying issues, we can simplify implementation gradually
4. **New Requirements:** Can add new formatting options to CNE-CONFIG while maintaining backward compatibility

This is **dependency inversion** - high-level policy (CNE-CONFIG) doesn't depend on low-level details (citeproc internals).

### Technical References

- **Architecture documentation:** `/docs/PLAN-multi-slot-architecture.md`
- **Citeproc infrastructure:** `/docs/citeproc-multilingual-infrastructure.md`
- **Integration points:** `/docs/ENGINE-INTEGRATION-POINTS.md`
- **Parser implementation:** `/src/modules/cne/config/parseCNEConfig.ts`
- **Configuration implementation:** `/src/modules/cne/config/configureCiteproc.ts`

## Style Variant Builder Workflow

This section describes the **recommended workflow** for creating and maintaining CNE style variants using the Style Variant Builder system. This approach ensures maintainability, version tracking, and easy updates from upstream.

### File Structure Overview

```
tools/style-variant-builder/
├── templates/                                 # CNE templates (one per style family)
│   ├── cne-chicago-template.csl              # Chicago CNE template with 7 macros
│   └── cne-apa-template.csl                  # APA CNE template (to be created)
├── dev/                                       # Development files (.gitignored)
│   ├── cne-chicago-18th-notes-bibliography-2025-09-07.csl
│   ├── cne-chicago-18th-author-date-2025-09-07.csl
│   └── cne-apa-7th-2024-07-09.csl            # Development work happens here
├── diffs/                                     # Generated diff files (committed)
│   ├── cne-chicago-18th-notes-bibliography-2025-09-07.diff
│   ├── cne-chicago-18th-author-date-2025-09-07.diff
│   └── cne-apa-7th-2024-07-09.diff
├── out/                                       # Build output (.gitignored)
│   └── cne-chicago-18th-notes-bibliography-2025-09-07.csl
└── Makefile                                   # Build automation

styles/
├── upstream/                                  # Original upstream styles (committed)
│   ├── chicago-18th-notes-bibliography-2025-09-07.csl
│   ├── chicago-18th-author-date-2025-09-07.csl
│   └── apa-7th-2024-07-09.csl
└── cne/                                       # Final CNE styles (committed)
    ├── cne-chicago-18th-notes-bibliography-2025-09-07.csl
    ├── cne-chicago-18th-author-date-2025-09-07.csl
    └── cne-apa-7th-2024-07-09.csl
```

### Step-by-Step Workflow

#### 1. Download Specific Upstream Version

Always use **specific dated versions** from the CSL repository, never bare templates.

```bash
# Navigate to upstream styles directory
cd styles/upstream/

# Download the specific version you want to base CNE on
# Example: APA 7th edition from 2024-07-09
curl -o apa-7th-2024-07-09.csl \
  'https://raw.githubusercontent.com/citation-style-language/styles/master/apa.csl'

# Verify the version and date in the file
grep -A2 "<title>American" apa-7th-2024-07-09.csl
grep "<updated>" apa-7th-2024-07-09.csl
```

**Why specific versions?** Each edition (e.g., APA 7th, Chicago 18th) includes version-specific features and fixes that bare templates lack.

#### 2. Create CNE Template (One-Time Setup)

Create a CNE template in `tools/style-variant-builder/templates/` with all 7 CNE helper macros.

```bash
cd tools/style-variant-builder/templates/

# Copy upstream to create initial template
cp ../../../styles/upstream/apa-7th-2024-07-09.csl cne-apa-template.csl

# Edit metadata
# - Change title to "American Psychological Association 7th edition CNE (template)"
# - Change ID to "http://www.zotero.org/styles/cne-apa-template"
# - Add CNE contributor information
```

**Note:** Templates are version-agnostic and reusable across variants of the same style family.

#### 3. Create Development File

Copy the template to the `dev/` directory with version tracking in the filename.

```bash
cd tools/style-variant-builder/

# Copy template to dev/ with full version tracking
cp templates/cne-apa-template.csl dev/cne-apa-7th-2024-07-09.csl
```

**Naming convention:** `cne-{style}-{edition}-{variant}-{upstream-date}.csl`
- `{style}`: e.g., "apa", "chicago"
- `{edition}`: e.g., "7th", "18th"
- `{variant}`: e.g., "notes-bibliography", "author-date" (omit for single-variant styles)
- `{upstream-date}`: e.g., "2024-07-09" from upstream file

#### 4. Apply CNE Transformations

Systematically apply CNE modifications using sed or manual editing.

**Automated approach (recommended for initial setup):**

```bash
cd tools/style-variant-builder/

# Example sed commands for title transformations
DEV_FILE="dev/cne-apa-7th-2024-07-09.csl"

# Replace variable="title" with macro="cne-title-select" in display contexts
sed -i '' 's/variable="title"/macro="cne-title-select"/g' "$DEV_FILE"

# Wrap title displays with supplements
sed -i '' 's/<text macro="title-primary"\/>/<group delimiter=" "><text macro="title-primary"\/><text macro="cne-title-supplements"\/><\/group>/g' "$DEV_FILE"

# Replace container-title
sed -i '' 's/variable="container-title"/macro="cne-container-title-select"/g' "$DEV_FILE"

# Replace publisher
sed -i '' 's/variable="publisher"/macro="cne-publisher-select"/g' "$DEV_FILE"
```

**Manual approach (required for complex styles):**

1. Open `dev/cne-apa-7th-2024-07-09.csl` in editor
2. Find all `variable="title"` locations
3. For **display macros**: Replace with `macro="cne-title-select"` + add supplements
4. For **logic macros**: Keep original `variable="title"`
5. Repeat for container-title and publisher
6. Update metadata (title, ID, contributor, summary)

**Critical locations to review:**
- Title display macros (varies by style)
- Container title display macros
- Publisher display
- Bibliography entries
- Note/citation formats

#### 5. Generate Diff

Once transformations are complete, generate a diff file capturing changes from template.

```bash
cd tools/style-variant-builder/

# Generate diff (creates diffs/cne-apa-7th-2024-07-09.diff)
make diffs
```

**What the diff contains:**
- All changes from template to variant-specific CNE style
- Metadata updates (title, ID, etc.)
- CNE macro additions and invocations
- Upstream style-specific modifications

**Diff file is committed:** This small file (typically <200KB) is the source of truth.

#### 6. Build Final Style

Build the final CNE style from template + diff.

```bash
cd tools/style-variant-builder/

# Build all styles (creates out/*.csl)
make

# Or build specific style
make out/cne-apa-7th-2024-07-09.csl
```

**Build process:**
1. Starts with template (includes all 7 CNE macros)
2. Applies diff to create variant-specific version
3. **Automatically prunes unused macros** (removes macros not invoked)
4. Outputs to `out/` directory

**Output file characteristics:**
- Contains only the CNE macros actually used
- Fully self-contained and valid CSL
- Ready for distribution

#### 7. Copy to Distribution Directory

Copy the built style to the final location.

```bash
# From tools/style-variant-builder/
cp out/cne-apa-7th-2024-07-09.csl ../../styles/cne/
```

**Final location:** `styles/cne/cne-apa-7th-2024-07-09.csl` (committed to git)

#### 8. Test and Verify

```bash
# Verify CNE macros are present
grep -c 'macro name="cne-' styles/cne/cne-apa-7th-2024-07-09.csl

# List all CNE invocations
grep -n 'macro="cne-' styles/cne/cne-apa-7th-2024-07-09.csl

# Run test suite
npm test

# Generate snapshots
npm run test:snapshots:update
```

### What to Commit vs. Gitignore

**Commit to git:**
- `styles/upstream/*.csl` - Specific upstream versions
- `tools/style-variant-builder/templates/*.csl` - CNE templates
- `tools/style-variant-builder/diffs/*.diff` - Generated diffs (source of truth)
- `styles/cne/*.csl` - Final distribution files

**Gitignored (.gitignore):**
- `tools/style-variant-builder/dev/*.csl` - Working files (regenerable from template + diff)
- `tools/style-variant-builder/out/*.csl` - Build output (regenerable with `make`)

**Why this separation?**
- Diff files are small (<200KB) and capture all changes
- Development files are large (>200KB) and can be regenerated
- Reduces repository size while maintaining full history

### Updating from Upstream

When upstream style receives updates:

```bash
# 1. Download new upstream version
cd styles/upstream/
curl -o apa-7th-2025-03-15.csl \
  'https://raw.githubusercontent.com/citation-style-language/styles/master/apa.csl'

# 2. Compare with previous version
diff apa-7th-2024-07-09.csl apa-7th-2025-03-15.csl

# 3. Update template if needed (rare - only for major structural changes)
cd ../tools/style-variant-builder/templates/
# Manually review if template needs updates based on upstream changes

# 4. Create new development file from template
cd ..
cp templates/cne-apa-template.csl dev/cne-apa-7th-2025-03-15.csl

# 5. Re-apply CNE transformations
# (Use sed commands or manual edits)

# 6. Generate new diff
make diffs

# 7. Build new style
make

# 8. Copy to distribution
cp out/cne-apa-7th-2025-03-15.csl ../../styles/cne/

# 9. Update tests if needed
# 10. Commit all changes
git add styles/upstream/apa-7th-2025-03-15.csl
git add tools/style-variant-builder/diffs/cne-apa-7th-2025-03-15.diff
git add styles/cne/cne-apa-7th-2025-03-15.csl
git commit -m "feat: Update APA CNE to upstream 2025-03-15"
```

### Makefile Targets

The Style Variant Builder includes helpful Make targets:

```bash
# Generate all diffs from dev/ files
make diffs

# Build all styles from templates + diffs
make

# Build specific style
make out/cne-apa-7th-2024-07-09.csl

# Clean build artifacts
make clean

# Full rebuild
make clean all
```

### Benefits of This Workflow

1. **Maintainability:** Small diff files are easy to review and maintain
2. **Version tracking:** Clear linkage to upstream versions via filenames
3. **Automatic macro pruning:** Final styles only include used macros
4. **Reproducibility:** Anyone can rebuild from template + diff
5. **Git-friendly:** Small diffs instead of large style files in history
6. **Family management:** One template supports multiple variants


## Testing Requirements

### 1. Test Fixtures

Create test fixtures with CNE fields for each language supported:

```typescript
export const chineseBook: CNETestFixture = {
  id: 'hao-1998-tang',
  itemType: 'book',
  title: 'Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo',
  extra: `cne-title-romanized: Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
cne-title-original: 唐后期五代宋初敦煌僧尼的社会生活
cne-title-english: The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song
cne-author-0-last-romanized: Hao
cne-author-0-first-romanized: Chunwen
cne-author-0-last-original: 郝
cne-author-0-first-original: 春文
cne-publisher-romanized: Zhongguo shehui kexue chubanshe`,
  // ... other fields
};
```

### 2. Expected Output

Define expected formatted output:

```typescript
export const chineseExpectations: Record<string, string> = {
  'hao-1998-tang':
    `Hao Chunwen 郝春文. <i>Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo</i> 唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song]. Zhongguo shehui kexue chubanshe, 1998.`
};
```

### 3. Test Structure

```typescript
describe('Chicago 18th Edition - CNE (en-US)', function() {
  describe('Chinese materials', function() {
    it('should format hao-1998-tang correctly', function() {
      const entry = extractCslEntry(bibliography, ALL_FIXTURES.zhcnHao1998Tang);
      assertEqualWithDiff(entry, chineseExpectations['hao-1998-tang']);
    });
  });
});
```

## Naming Conventions

### CNE Variables (in Zotero Extra field)

All CNE variables use kebab-case with `cne-` prefix:

**Title variables:**
- `cne-title-romanized`
- `cne-title-romanized-short`
- `cne-title-original`
- `cne-title-english`

**Container title variables:**
- `cne-container-title-romanized`
- `cne-container-title-romanized-short`
- `cne-container-title-original`
- `cne-container-title-english`

**Journal variables (legacy support):**
- `cne-journal-romanized`
- `cne-journal-romanized-short`
- `cne-journal-original`

**Creator variables:**
- `cne-author-{N}-last-romanized`
- `cne-author-{N}-first-romanized`
- `cne-author-{N}-last-original`
- `cne-author-{N}-first-original`

**Publisher variables:**
- `cne-publisher-romanized`

### CNE Macros (in CSL file)

All CNE macros use `cne-{element}-{action}` pattern:

**Selection macros:** Choose between CNE and standard variables
- `cne-title-select`
- `cne-title-select-short`
- `cne-container-title-select`
- `cne-container-title-select-short`
- `cne-publisher-select`

**Supplement macros:** Add original + translation
- `cne-title-supplements`
- `cne-container-title-supplements`

## Common Patterns by Style Type

### Notes and Bibliography Styles

**Bibliography entry pattern:**
```xml
<group delimiter=" ">
  <text macro="title-primary"/>
  <text macro="cne-title-supplements"/>
</group>
```

**Note citation pattern:**
```xml
<group delimiter=" ">
  <text macro="title-primary"/>
  <text macro="cne-title-supplements"/>
</group>
```

### Author-Date Styles

**Bibliography entry pattern:**
```xml
<group delimiter=" ">
  <text macro="title-primary"/>
  <text macro="cne-title-supplements"/>
</group>
```

**In-text citation:**
Uses short forms, romanization only (no supplements in parenthetical citations).

## File Organization

```
styles/
├── upstream/                          # Original CSL styles
│   ├── chicago-18th-notes-bibliography-2025-09-07.csl
│   └── chicago-18th-author-date-2025-09-07.csl
└── cne/                              # CNE variants
    ├── chicago-notes-bibliography-cne.csl
    └── chicago-author-date-cne.csl

test/
└── csl-tests/
    ├── fixtures/
    │   ├── chinese.ts                # Chinese test fixtures
    │   ├── japanese.ts               # Japanese test fixtures
    │   └── korean.ts                 # Korean test fixtures
    ├── expectations/
    │   └── chicago-18th/
    │       └── en-US/
    │           ├── chinese.ts        # Expected Chinese output
    │           ├── japanese.ts       # Expected Japanese output
    │           └── korean.ts         # Expected Korean output
    └── chicago-18th.test.ts          # Test runner

snapshots/
└── chicago-notes-bibliography-cne/
    └── en-US/
        ├── all-languages-bibliography.html
        └── all-languages-notes.html
```

## Quality Checklist

Before finalizing a CNE style variant:

- [ ] All 7 CNE helper macros added
- [ ] All macros use `cne-` prefix consistently
- [ ] Title displays use `cne-title-select` + `cne-title-supplements`
- [ ] Container title displays use `cne-container-title-select` + supplements
- [ ] Publisher uses `cne-publisher-select`
- [ ] Metadata updated (title, ID, contributor, summary)
- [ ] Comments added explaining CNE modifications
- [ ] All tests pass
- [ ] Snapshots generated for both bibliography and notes formats
- [ ] Output manually verified against Yale guide or similar
- [ ] `grep "cne-"` shows only expected CNE modifications

## Maintenance

### Updating from Upstream

When upstream style updates:

1. **Identify changes:**
   ```bash
   diff styles/upstream/old.csl styles/upstream/new.csl
   ```

2. **Review CNE implications:**
   - Do changes affect title/container-title/publisher display?
   - Are new macros added that need CNE support?

3. **Apply selective updates:**
   - Copy upstream changes to CNE file
   - Re-apply CNE modifications where needed
   - Verify with `grep "cne-"` that all CNE code intact

4. **Test thoroughly:**
   - Run full test suite
   - Regenerate snapshots
   - Manual verification

### Version Tracking

- Keep upstream styles with date stamps: `chicago-18th-notes-bibliography-2025-09-07.csl`
- Update CNE style `<updated>` date when modified
- Document upstream version in git commit message

## Reference Implementation

**File:** `styles/cne/chicago-notes-bibliography-cne.csl`

**Statistics:**
- 7 CNE helper macros
- 44 CNE macro invocations
- ~100 lines of CNE-specific code
- Fully backward compatible with non-CNE items

**Verification Commands:**
```bash
# Count CNE macros
grep -c "macro name=\"cne-" styles/cne/chicago-notes-bibliography-cne.csl

# List all CNE macro invocations
grep -n "macro=\"cne-" styles/cne/chicago-notes-bibliography-cne.csl

# Show all CNE-specific code
grep -B2 -A2 "cne-" styles/cne/chicago-notes-bibliography-cne.csl
```

## Future Extensions

This convention can be extended to support:
- **Additional fields:** Part-title, volume-title, event-title, etc.
- **Additional languages:** Any language requiring romanization
- **Additional metadata:** Multiple romanization systems, pronunciation guides
- **Author name handling:** More sophisticated name formatting (currently handled via Zotero plugin)

---

**Document History:**
- v2.0 (2025-10-18): Updated to reflect Style Variant Builder workflow; added comprehensive step-by-step guide; marked manual approach as legacy reference
- v1.0 (2025-10-18): Initial version based on chicago-notes-bibliography-cne.csl
