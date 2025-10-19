# CSL Engine Integration Points

**Investigation Date**: 2025-10-18
**Status**: ✅ Complete

## Summary

Found all locations where CSL engines are created/accessed in the CNE plugin codebase.

## Integration Points

### 1. Preview Dialog
**File**: `src/modules/cne/CnePreviewFactory.ts`
**Line**: 411
**Code**:
```typescript
const cslEngine = style.getCiteProc(locale, "html");
```

**Context**: User-triggered preview dialog for citation visualization

**Control Level**: ✅ **Full control** - We create the engine

**Integration Strategy**: After `getCiteProc()`, extract CNE-CONFIG from style and configure engine

### 2. Test Suite
**File**: `test/csl-tests/test-helpers.ts`
**Line**: 243
**Code**:
```typescript
const engine = style.getCiteProc(styleLocale, 'html');
```

**Context**: Automated tests for CSL rendering

**Control Level**: ✅ **Full control** - We create the engine

**Integration Strategy**: After `getCiteProc()`, configure engine before calling `updateItems()`

### 3. Document Citations (Word/LibreOffice)
**Location**: Zotero core (not in plugin code)
**Method**: Unknown - Zotero creates engines internally

**Control Level**: ❌ **No direct control** - Zotero creates engines

**Integration Strategy Options**:
- **A) Monkey-patch `style.getCiteProc()`**: Wrap method to inject configuration
- **B) Data-only approach**: Provide complete data, rely on default cite-lang-prefs
- **C) Defer**: Focus on preview/tests first, solve later if needed

**Recommendation**: Start with Option C (defer), implement for preview/tests first

## Architecture Pattern

**Common Pattern**:
```typescript
// 1. Get style object
const style = Zotero.Styles.get(styleId);

// 2. Create engine (Zotero internal)
const engine = style.getCiteProc(locale, format);

// 3. Register items
engine.updateItems(itemIds);

// 4. Generate output
const output = Zotero.Cite.makeFormattedBibliography(engine, format);
```

**Our Integration Point**: Between steps 2 and 3

```typescript
// 1. Get style object
const style = Zotero.Styles.get(styleId);

// 2. Create engine
const engine = style.getCiteProc(locale, format);

// 👉 3. INJECT CNE CONFIGURATION HERE
const cneConfig = extractCNEConfigFromStyle(style);
if (cneConfig) {
  configureCiteprocForCNE(engine, cneConfig);
}

// 4. Register items
engine.updateItems(itemIds);

// 5. Generate output
const output = Zotero.Cite.makeFormattedBibliography(engine, format);
```

## Data Flow

```
Style File (XML)
  ↓
style.getCiteProc() → CSL Engine Created
  ↓
extractCNEConfigFromStyle(style)
  ↓
Parse: "CNE-CONFIG: persons=translit,orig"
  ↓
configureCiteprocForCNE(engine, config)
  ↓
engine.setLangPrefsForCites({persons: ['translit', 'orig']})
  ↓
engine.updateItems(itemIds)
  ↓
sys.retrieveItem() → enrichAuthorNames() → multi._key populated
  ↓
Rendering with multi-slot selection
```

## Implementation Plan

### Phase 1: Preview & Tests (Controlled Scenarios)
1. Create `parseCNEConfig` module
2. Create `configureCiteproc` module
3. Integrate into:
   - `CnePreviewFactory.generateCitationPreview()` (after line 411)
   - `test-helpers.generateBibliography()` (after line 243)
4. Test and verify

### Phase 2: Document Citations (If Needed)
- Evaluate if monkey-patching `getCiteProc()` is necessary
- Implement if user workflow requires it
- Alternative: Accept that document citations use default behavior

## Notes

**Why we don't control document citation engines**:
- Zotero creates engines for Word/LibreOffice plugins internally
- No exposed hooks/events for engine creation
- Plugin can only intercept data (via `ItemToCSLJSONInterceptor`)

**Why this might be okay**:
- Most critical use case is bibliography (where multi-slot works)
- In-text citations are abbreviated anyway
- Users primarily care about final bibliography output

**If we need full control later**:
- Monkey-patch `Zotero.Style.prototype.getCiteProc`
- Wrap the method to inject configuration on every call
- More invasive but would work universally
