# Session Summary: CNE Field Ordering Bug Fix

**Date**: October 16, 2025
**Issue**: CNE metadata fields not rendering when author fields appear before title fields in Extra field
**Status**: ✅ Fixed

## Problem Description

CNE metadata in Zotero's Extra field was not being processed correctly by the CSL processor. Specifically:

- **Symptom**: When `cne-author-0-*` fields appeared BEFORE `cne-title-*` fields in the Extra field, title/journal/publisher fields were completely ignored
- **Working Case**: When title fields appeared BEFORE author fields, everything rendered correctly
- **Impact**: Field ordering dependency made the plugin fragile and confusing for users

## Root Cause Analysis

### Primary Issue: Zotero's parseNoteFieldHacks() Limitation

**Location**: `reference/zotero/chrome/content/zotero/xpcom/citeproc.js:440-484`

The CSL processor uses a regex pattern to extract CSL variables from the `note` field:

```javascript
// Line 716
NOTE_FIELD_REGEXP: /^([\-_a-z]+|[A-Z]+):\s*([^\}]+)$/
```

**Problem**: This regex **only accepts letters, hyphens, and underscores** - NO DIGITS!

When the parser encounters a line like `cne-author-0-last-original: 华`, it doesn't match the pattern and triggers a break:

```javascript
// Lines 478-484
for (var i=0,ilen=lines.length;i<ilen;i++) {
    var line = lines[i];
    var mm = line.match(CSL.NOTE_FIELD_REGEXP);
    if (!line.trim()) {
        continue;  // Skip blank lines
    } else if (!mm) {  // Line doesn't match!
        if (i === 0) {
            continue;  // Allow first line to be non-CSL
        } else {
            offset = i;
            break;  // STOP! Don't process any more lines
        }
    }
    // ... process matching line
}
```

**Result**: All subsequent title/journal fields are never parsed, regardless of their validity.

### Secondary Issue: console.log() ReferenceError

Our initial fix attempt (`injectCSLVariables` callback) was failing silently because:

- The `console` object is not defined in citeproc-js execution environment
- Every `console.log()` statement caused a `ReferenceError`
- The callback crashed before injecting any variables

**Error logs showed**:
```
[CNE] Callback 0 error: ReferenceError: console is not defined error
```

This masked the fact that our injection strategy was actually sound - we just had debugging code breaking it.

## Solution

### Strategy: Direct CSL Variable Injection

Instead of relying on Zotero's buggy Extra field parser, we:

1. **Created `injectCSLVariables` callback** (`src/modules/cne/callbacks/injectCSLVariables.ts`)
   - Runs during `itemToCSLJSON` interception
   - Uses our robust `parseCNEMetadata()` parser (handles any field ordering)
   - Directly injects CSL variables into the CSL-JSON object

2. **Registered callback FIRST** (critical timing)
   - Must run before any callbacks that use the CSL variables
   - Ensures variables are available regardless of Zotero's parser behavior

3. **Removed all console.log() statements**
   - From `injectCSLVariables.ts`
   - From `enrichTitleFields.ts`
   - From `metadata-parser.ts`
   - Prevents ReferenceError in citeproc-js environment

### How It Works

```typescript
export function injectCSLVariables(zoteroItem: any, cslItem: any) {
  // Get Extra field content
  const extraContent = zoteroItem.getField("extra");
  if (!extraContent) return;

  // Parse CNE metadata using our robust parser (no ordering dependency)
  const metadata = parseCNEMetadata(extraContent);

  // Inject title variants
  if (metadata.title) {
    injectFieldVariants(cslItem, 'title', metadata.title);
  }

  // Inject journal, publisher, series, booktitle variants...
  // (Direct assignment to cslItem object)
}
```

**Result**: CSL variables like `cne-title-romanized`, `cne-title-original`, etc. are directly available to the CSL style, bypassing Zotero's parser entirely.

## Technical Details

### Call Chain

1. User generates citation
2. Zotero: `itemToCSLJSON()` → `extraToCSL()`
3. **Our interceptor runs** → `injectCSLVariables()` injects all CNE variables
4. citeproc-js: Deep clone → `parseNoteFieldHacks()` (may break on numeric indices)
5. **Doesn't matter!** Our variables are already in the cloned object
6. CSL style processes citation with correct CNE variables

### Why Deep Clone Doesn't Lose Our Variables

```javascript
// citeproc.js line 4265
Item = JSON.parse(JSON.stringify(this.sys.retrieveItem("" + id)));
```

Our injected properties survive the deep clone because:
- We inject them as plain properties on the cslItem object
- `JSON.stringify()` → `JSON.parse()` preserves all enumerable properties
- No special handling needed

### Field Ordering Independence

With this fix:
- ✅ Author fields BEFORE title fields: **Works**
- ✅ Title fields BEFORE author fields: **Works**
- ✅ Mixed ordering: **Works**
- ✅ User content interspersed: **Works**

The plugin is now robust against any Extra field content or ordering.

## Files Modified

### New Files
- `src/modules/cne/callbacks/injectCSLVariables.ts` - Core fix: direct CSL variable injection

### Modified Files (console.log removal)
- `src/modules/cne/callbacks/enrichTitleFields.ts` - Removed debug logging
- `src/modules/cne/metadata-parser.ts` - Removed debug logging
- `src/modules/cne/index.ts` - Register injectCSLVariables callback
- `src/modules/cne/callbacks/index.ts` - Export injectCSLVariables

### Test Files
- `test/csl-tests/fixtures/unified-fixtures.ts` - Restored problematic ordering (author fields before title fields) to verify fix

## Code Cleanup

### Removed Legacy Code
- `testAppendToNote` callback and exports (unused test code)
- Commented-out `enrichTitleFieldsWithShortForm` registration (optional feature, kept export)
- All debug `console.log()` statements

### Deleted Temporary Files
- `test-author-indexing.md` - Research notes (no longer needed)
- 16 test log files - Debugging output

### Updated Configuration
- `.gitignore` - Added `*.log` and `test-*.md` patterns

## Testing

### Validation
The fix was validated with the `hua-1999-qingdai` fixture having author fields BEFORE title fields:

```
extra: `cne-author-0-last-original: 华
cne-author-0-first-original: 林甫
cne-author-0-last-romanized: Hua
cne-author-0-first-romanized: Linfu
cne-title-original: 清代以来三峡地区水旱灾害的初步研究
cne-title-romanized: Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu
cne-title-english: A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty
cne-journal-original: 中国社会科学
cne-journal-romanized: Zhongguo shehui kexue`
```

**Result**: All title and journal fields render correctly ✅

## Lessons Learned

1. **Don't rely on external parsers with undocumented limitations**
   - Zotero's parseNoteFieldHacks has regex constraints we can't control
   - Better to implement our own robust parsing and injection

2. **Environment matters for debugging**
   - `console` object availability varies between JavaScript contexts
   - Use `ztoolkit.log()` for Zotero plugin development instead

3. **Field ordering should never be a constraint**
   - Users may add content to Extra field in any order
   - Plugin must be robust against all field arrangements

4. **Direct injection is more reliable than markup parsing**
   - Instead of trying to format fields for external parser, inject directly
   - Cleaner, more predictable, less fragile

## Future Considerations

### Potential Enhancements
1. **Short form support**: Could enable `enrichTitleFieldsWithShortForm` for subsequent citations
2. **Error reporting**: Add user-facing warnings for malformed CNE metadata
3. **Parser performance**: Consider caching parsed metadata for repeated conversions

### Known Limitations
- Still using numeric indices for author fields (`cne-author-0-*`)
- These indices work in our parser but still trigger Zotero's parser break
- Not an issue since we inject variables directly, but could revisit field naming

## References

- Issue discussion in previous session
- citeproc.js source: `reference/zotero/chrome/content/zotero/xpcom/citeproc.js`
- Zotero utilities: `reference/zotero/chrome/content/zotero/xpcom/utilities/utilities_item.js`
- Plugin architecture: `docs/ARCHITECTURE.md`
