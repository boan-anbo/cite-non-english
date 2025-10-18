# Juris-M Multilingual Name Handling - Learning Notes

## Purpose

This document tracks our investigation of how Juris-M (Multilingual Zotero) properly implements multilingual name handling, particularly:
- How the `multi.main` and `multi._key` structures are populated
- Database storage architecture for language variants
- Export mechanics to CSL-JSON format
- Potential improvements to CNE's current approach

## Background: Why We're Studying Juris-M

### Current CNE Approach (Acknowledged as "Hacky")

CNE currently handles non-English names by:
1. **Manually attaching Chinese translations** to the `given` field
2. **Setting `multi.main`** on every creator to control name ordering
   - Creators WITH CNE data → `multi.main = originalLanguage` (zh/ja/ko)
   - Creators WITHOUT CNE data → `multi.main = "en"`
3. **Hard-coding CSL variable values** in our custom CSL variant

**Problem**: We're not properly populating the `multi` structure the way Juris-M intended. We're working around the system rather than using it correctly.

### What Juris-M Offers

Juris-M was designed from the ground up for multilingual citations, with proper support for:
- Multiple language variants of the same field
- Per-field language tagging
- UI for adding/editing language variants
- Database schema for storing multilingual data
- Export to CSL-JSON with proper `multi` structure

**Goal**: Learn from Juris-M to potentially improve CNE's implementation.

## Juris-M Repository Information

- **Repository**: `https://github.com/Juris-M/zotero`
- **Branch**: `jurism-6.0.20` (latest available)
- **Status**: Minimally maintained (86 stars, 20 open issues)
- **Added as submodule**: `reference/juris-m/`

## Key Files Identified

### Multilingual Core Implementation

**Directory**: `reference/juris-m/chrome/content/zotero/xpcom/multilingual/`

1. **`multilingual/creator.js`** (5.8 KB)
   - Handles multilingual creator name variants
   - **TO INVESTIGATE**: How creator variants are stored and retrieved

2. **`multilingual/field.js`** (8.8 KB)
   - General multilingual field handling
   - **TO INVESTIGATE**: Field-level language variant management

3. **`multilingual/ui.js`** (6.0 KB)
   - UI logic for adding/editing language variants
   - **TO INVESTIGATE**: Right-click "Add Variant" workflow

4. **`multilingual/convert.js`** (8.1 KB)
   - Conversion logic (possibly between data formats?)
   - **TO INVESTIGATE**: Format conversion mechanics

5. **`multilingual/subtagRegistry.js`** (8.4 KB)
   - Language subtag registry (ISO codes, etc.)
   - **TO INVESTIGATE**: Language code handling

### Data and Export

1. **`xpcom/data/creators.js`**
   - Core creator data model
   - **TO INVESTIGATE**: Creator storage schema

2. **`xpcom/utilities_internal.js`** (3012 lines)
   - Likely contains `itemToCSLJSON` implementation
   - **TO INVESTIGATE**: CSL-JSON export logic for multilingual fields

3. **`xpcom/cite.js`**
   - Citation generation (calls `itemToCSLJSON` at line 670)
   - **TO INVESTIGATE**: Integration with citeproc-js

### Testing

1. **`test/tests/creatorsTest.js`**
   - Creator-related tests
   - **TO INVESTIGATE**: Test cases for multilingual creators

2. **`test/tests/utilities_internalTest.js`**
   - Tests for utilities_internal.js
   - **TO INVESTIGATE**: CSL-JSON export test cases

## User Workflow (from Documentation)

Based on Juris-M documentation:
1. User enters creator name in original language in "headline fields"
2. User right-clicks on field label
3. Selects "Add Variant"
4. Enters transliteration/translation for specific language
5. Juris-M stores multiple language versions
6. On export, Juris-M populates `multi` structure in CSL-JSON

## Key Questions to Answer

### 1. Database Storage
- How does Juris-M store language variants in the database?
- Schema differences from standard Zotero?
- Relationship between creator records and language variants?

### 2. Multi Structure Population
- How does Juris-M convert database storage to `multi.main` and `multi._key`?
- When/where does this conversion happen (export time? query time?)?
- What logic determines the "main" language vs. alternate language variants?

### 3. CSL-JSON Export
- Exact format of the `multi` object in exported CSL-JSON
- How are creator name variants structured in `multi._key`?
- Example of full CSL-JSON output with multilingual creators?

### 4. Language Tagging
- How does Juris-M determine/store the language code for each variant?
- ISO code handling (zh-CN vs. zh, etc.)?
- Fallback logic for missing language codes?

### 5. Integration with Citeproc-js
- Does Juris-M use stock citeproc-js or a modified version?
- Any preprocessing of CSL-JSON before passing to citeproc-js?
- How does the `multi` structure interact with CSL styles?

## Potential Improvements to CNE

### Current Limitations
1. **Manual string concatenation**: `given: "Weisheng 杜伟生"` mixes romanized and original
2. **No true variant structure**: Not using `multi._key` at all
3. **CSL style dependency**: Hard-coded Chinese characters in CSL variant
4. **Limited flexibility**: Can't easily swap between display modes (romanized only, original only, both)

### Possible Enhancements After Learning from Juris-M
1. **Proper multi structure**: Populate `multi._key` with separate language variants
   ```javascript
   {
     family: "Du",
     given: "Weisheng",
     multi: {
       main: "en",  // or "zh-Latn" for romanized
       _key: {
         "zh": {
           family: "杜",
           given: "伟生"
         },
         "en": {
           family: "Du",
           given: "Weisheng"
         }
       }
     }
   }
   ```

2. **Separate romanization from original**: Store as distinct variants rather than concatenating

3. **CSL-M style features**: Use CSL-M's multilingual style features instead of hard-coding

4. **Database schema consideration**: If CNE ever needs persistence, follow Juris-M's approach

## Investigation Plan

### Phase 1: Data Storage (NEXT)
1. Read `multilingual/creator.js` to understand creator variant data model
2. Read `xpcom/data/creators.js` for core creator storage
3. Search for database schema definitions (SQL files, schema.js, etc.)

### Phase 2: CSL-JSON Export
1. Read `xpcom/utilities_internal.js` to find `itemToCSLJSON` implementation
2. Trace how multilingual fields are converted to `multi` structure
3. Find example test cases in `utilities_internalTest.js`

### Phase 3: UI Workflow
1. Read `multilingual/ui.js` for "Add Variant" workflow
2. Understand how language codes are selected/stored
3. Map UI actions to data model changes

### Phase 4: Integration Analysis
1. Compare Juris-M's approach with CNE's current implementation
2. Document differences and advantages
3. Propose concrete improvements to CNE architecture

## Notes and Findings

### Finding 1: 2025-10-17 - Juris-M MultiCreator Data Structure

**File**: `reference/juris-m/chrome/content/zotero/xpcom/multilingual/creator.js`

**Discovery**: Juris-M implements a `Zotero.MultiCreator` wrapper object that manages multilingual creator variants.

**Structure**:
```javascript
Zotero.MultiCreator = function(parent, langTag){
  this.parent = parent;   // The main creator object
  this.main = langTag;    // Main language code (e.g., "zh-CN")
  this._key = {};         // Object storing alternative language versions
};
```

**Key Methods**:
- `setFields(fields, lang)`: Sets creator fields for a specific language
  - If `lang === this.main` or no lang: updates parent (main) creator
  - Otherwise: creates/updates entry in `this._key[lang]`
- `get(field, langs)`: Retrieves field value for specified language(s)
- `getCreator(langTag)`: Returns creator object for specific language
- `removeCreator(langTag)`: Removes a language variant
- `merge()`, `clone()`: Utilities for merging/cloning multilingual data

**Storage Logic**:
```javascript
// Setting main language (e.g., Chinese original)
multiCreator.setFields({
  firstName: "伟生",
  lastName: "杜"
}, "zh-CN");  // Updates parent creator directly

// Setting alternative language (e.g., romanized English)
multiCreator.setFields({
  firstName: "Weisheng",
  lastName: "Du"
}, "en");  // Stores in this._key["en"]
```

**Important Insight**: The `_key` structure here directly maps to the `multi._key` structure we use in CSL-JSON! The property names match exactly.

### Finding 2: 2025-10-17 - Database Schema for Multilingual Storage

**File**: `reference/juris-m/resource/schema/multilingual.sql`

**Discovery**: Juris-M extends Zotero's database schema with separate tables for multilingual data.

**Schema Structure**:

1. **`itemCreatorsMain` table** (lines 25-36):
   ```sql
   CREATE TABLE itemCreatorsMain (
     itemID INT,
     creatorID INT,
     creatorTypeID INT DEFAULT 1,
     orderIndex INT DEFAULT 0,
     languageTag TEXT,  -- ← Stores main language!
     PRIMARY KEY (itemID, creatorID, creatorTypeID, orderIndex)
   );
   ```
   - Extends the relationship between items and creators
   - Adds `languageTag` field to track main language of each creator
   - This is what populates `multi.main` in CSL-JSON!

2. **`itemCreatorsAlt` table** (lines 38-50):
   ```sql
   CREATE TABLE itemCreatorsAlt (
     itemID INT,
     creatorID INT,
     creatorTypeID INT DEFAULT 1,
     orderIndex INT DEFAULT 0,
     languageTag TEXT,  -- ← Language code for THIS variant
     PRIMARY KEY (itemID, creatorTypeID, orderIndex, languageTag)
   );
   ```
   - Stores **alternative language versions** of creators
   - Each row represents one language variant
   - Multiple rows per creator (one per language)
   - This is what populates `multi._key` in CSL-JSON!

3. **`itemDataMain` & `itemDataAlt` tables** (lines 52-73):
   - Same pattern for other fields (title, publication, etc.)
   - `itemDataMain`: tracks main language per field
   - `itemDataAlt`: stores alternative language versions

**Key Insight**: Juris-M's approach is **database-first**:
- Main language variant stored in standard `creators` table
- `itemCreatorsMain` links it with a `languageTag`
- Alternative variants stored in separate `itemCreatorsAlt` table
- Each alternative gets its own `creatorID` and `languageTag`

**Comparison with CNE**:
- CNE: Parses text from Extra field, builds `multi` structure on-the-fly during export
- Juris-M: Stores multilingual data in normalized database tables, assembles during query
- CNE advantage: No database changes needed, works with standard Zotero
- Juris-M advantage: Proper relational storage, better query performance, UI integration

### Finding 3: 2025-10-17 - CSL-JSON Export Architecture

**Status**: Need to locate the exact CSL-JSON export function that converts database records to `multi` structure.

**Key files to investigate**:
- `chrome/content/zotero/xpcom/cite.js` - calls `itemToCSLJSON` at line 670
- `chrome/content/zotero/xpcom/utilities_internal.js` - likely contains conversion logic
- Test files may show example outputs

**Question**: How does Juris-M query `itemCreatorsMain` and `itemCreatorsAlt` to build the CSL-JSON structure?

**Expected flow**:
1. Query `itemCreatorsMain` to get main creator + languageTag → `multi.main`
2. Query `itemCreatorsAlt` for all variants with matching itemID/orderIndex → `multi._key[languageTag]`
3. Assemble CSL-JSON with nested structure

**TODO**: Find the exact code that performs this assembly.

---

## References

- **Juris-M Documentation**: https://juris-m.readthedocs.io/en/latest/
- **CSL-M Documentation**: https://citeproc-js.readthedocs.io/en/latest/csl-m/
- **Juris-M Tutorial**: https://juris-m.readthedocs.io/en/latest/tutorial.html
- **CNE's current implementation**: `src/modules/cne/callbacks/enrichAuthorNames.ts`
- **Our multi.main documentation**: `docs/citeproc-name-ordering.md`
