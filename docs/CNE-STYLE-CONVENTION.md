# CNE Style Modification Convention

**Version:** 1.0
**Last Updated:** 2025-10-18
**Reference Implementation:** `chicago-notes-bibliography-cne.csl`

## Overview

This document defines the standard convention for adding CNE (Cite Non-English) support to any upstream CSL (Citation Style Language) style. CNE enables proper citation of non-English sources by displaying:

1. **Romanized forms** (primary display)
2. **Original script** (parallel display)
3. **English translation** (parallel display in brackets)

**Example Output:**
```
Hao Chunwen 郝春文. Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang
during the late Tang, Five Dynasties and early Song]. Zhongguo shehui kexue chubanshe, 1998.
```

## Core Principle

**Separation of Concerns:**
- CNE modifications are isolated in clearly-named helper macros with `cne-` prefix
- Original style logic remains unchanged
- All CNE-specific code is easily identifiable via `grep "cne-"`

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

## Modification Pattern

### Step 1: Add CNE Helper Macros

Insert all 7 CNE helper macros after the `title-primary-short` macro definition, before the "3.2. Description" section:

```xml
  </macro>
  <!-- CNE Helper: Select full title variable -->
  <macro name="cne-title-select">
    ...
  </macro>
  <!-- ... all 7 macros ... -->
  <!-- 3.2. Description -->
```

### Step 2: Replace Title Variable References

**Pattern:** Replace `variable="title"` with `macro="cne-title-select"` in display macros

**Before (Upstream):**
```xml
<macro name="title-primary">
  <choose>
    <if type="patent">
      <text form="short" text-case="capitalize-first" variable="title"/>
    </if>
    ...
  </choose>
</macro>
```

**After (CNE):**
```xml
<macro name="title-primary">
  <choose>
    <if type="patent">
      <text form="short" text-case="capitalize-first" macro="cne-title-select"/>
    </if>
    ...
  </choose>
</macro>
```

**Important:** Only replace in macros that **display** titles, not in logic/testing macros.

### Step 3: Add Supplements Alongside Titles

**Pattern:** Wrap title display in group with supplements

**Before (Upstream):**
```xml
<text macro="title-primary"/>
```

**After (CNE):**
```xml
<group delimiter=" ">
  <text macro="title-primary"/>
  <text macro="cne-title-supplements"/>
</group>
```

**Typical locations in Chicago styles:**
- Bibliography entries
- Note citations
- Monographic title displays

### Step 4: Replace Container Title References

**Pattern:** Replace `variable="container-title"` with `macro="cne-container-title-select"`

**Before:**
```xml
<text font-style="italic" text-case="title" variable="container-title"/>
```

**After:**
```xml
<group delimiter=" ">
  <text font-style="italic" text-case="title" macro="cne-container-title-select"/>
  <text macro="cne-container-title-supplements"/>
</group>
```

### Step 5: Replace Publisher References

**Pattern:** Replace `variable="publisher"` with `macro="cne-publisher-select"`

**Before:**
```xml
<text variable="publisher"/>
```

**After:**
```xml
<text macro="cne-publisher-select"/>
```

### Step 6: Update Style Metadata

Update the `<info>` section:

```xml
<info>
  <title>Chicago Manual of Style 18th edition (notes and bibliography) - CNE</title>
  <title-short>CMOS CNE</title-short>
  <id>http://www.zotero.org/styles/chicago-notes-bibliography-cne</id>
  <link href="http://www.zotero.org/styles/chicago-notes-bibliography-cne" rel="self"/>
  <link href="http://www.zotero.org/styles/chicago-notes-bibliography" rel="template"/>
  <link href="https://www.chicagomanualofstyle.org/" rel="documentation"/>
  <author>
    <name>Andrew Dunning</name>
    <uri>https://orcid.org/0000-0003-0464-5036</uri>
  </author>
  <contributor>
    <name>Bo An</name>
    <uri>https://github.com/boan-anbo/cite-non-english</uri>
  </contributor>
  ...
  <summary>Chicago-style source citations (with Bluebook for legal citations),
           notes and bibliography system, with CNE (Cite Non-English) field support
           for displaying original non-English titles</summary>
  <updated>2025-10-14T09:00:00+00:00</updated>
  ...
</info>
```

Add CNE comment after Style Variant Builder comment:
```xml
<!-- This file was generated by the Style Variant Builder -->
<!-- CNE (Cite Non-English) variant based on Chicago Manual of Style 18th edition -->
```

## Complete Workflow

### 1. Preparation

```bash
# Copy upstream style to CNE directory
cp styles/upstream/chicago-notes-bibliography.csl \
   styles/cne/chicago-notes-bibliography-cne.csl
```

### 2. Add CNE Macros

Insert the 7 standard CNE helper macros at the appropriate location (after `title-primary-short` macro).

### 3. Systematic Replacement

**Find all locations to modify:**
```bash
# Find title variable usage
grep -n 'variable="title"' styles/cne/chicago-notes-bibliography-cne.csl

# Find container-title variable usage
grep -n 'variable="container-title"' styles/cne/chicago-notes-bibliography-cne.csl

# Find publisher variable usage
grep -n 'variable="publisher"' styles/cne/chicago-notes-bibliography-cne.csl
```

**For each location, determine:**
1. Is this a display macro? (Yes → replace with CNE macro)
2. Is this a logic/test macro? (Yes → keep original variable)
3. Does this need supplements? (Title/container-title display → Yes)

### 4. Manual Review Required

**Critical macros to review carefully:**

In Chicago styles, these macros typically need modification:
- `title-primary`
- `title-primary-short`
- `title-and-part-title-bib`
- `title-and-part-title-note`
- `title-monographic-bib`
- `title-monographic-note`
- `source-serial-name`
- `source-monographic-title-bib`
- `source-monographic-title-note`

**Do NOT modify:**
- Variable checks: `<if variable="title">`
- Fallback logic
- Sort macros
- Date macros

### 5. Update Metadata

- Update `<title>` to include " - CNE"
- Update `<id>` to use CNE URL
- Add contributor section
- Update summary to mention CNE support

### 6. Verification

```bash
# Verify all CNE macros are present
grep -c "macro name=\"cne-" styles/cne/chicago-notes-bibliography-cne.csl
# Should output: 7

# Verify no old patterns remain (if refactoring)
grep "title-select-variable\|container-title-select-variable" \
     styles/cne/chicago-notes-bibliography-cne.csl
# Should output nothing

# Run tests
npm test
# Should pass all tests with CNE data
```

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
- v1.0 (2025-10-18): Initial version based on chicago-notes-bibliography-cne.csl
