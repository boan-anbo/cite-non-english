# Zotero itemToCSLJSON Analysis

## Executive Summary

**Conclusion**: ✅ `Zotero.Utilities.Item.itemToCSLJSON()` is the **single function** used for all CSL-JSON conversions in Zotero. Patching this function will affect all citation scenarios.

## Function Location

**File**: `chrome/content/zotero/xpcom/utilities/utilities_item.js` (from `zotero/utilities` submodule)

**Line**: 51

**Full Path**: `Zotero.Utilities.Item.itemToCSLJSON(zoteroItem)`

## All Usages Found

### 1. **Citation/Bibliography Generation** (cite.js:660)
```javascript
// Zotero.Cite.System.retrieveItem() - called by citeproc-js
var cslItem = Zotero.Utilities.Item.itemToCSLJSON(zoteroItem);
```
**Context**: This is the callback function used by citeproc-js to retrieve item data. Used for:
- Citation preview in item pane
- Bibliography generation
- Quick bibliography
- Any CSL-based citation rendering

### 2. **Word Processor Integration** (integration.js:3294)
```javascript
// Items may be in libraries that haven't been loaded, and retrieveItem() is synchronous, so load
// all data (as required by toJSON(), which is used by itemToExportFormat(), which is used by
// itemToCSLJSON()) now
```
**Context**: Word/LibreOffice plugin uses the same `Zotero.Cite.System.retrieveItem()` path.

### 3. **Editor Instance** (editorInstance.js - 5 usages)

**Line 355**: Inline citation in note editor
```javascript
let itemData = Zotero.Utilities.Item.itemToCSLJSON(item);
let citation = {
    citationItems: [{
        uris: [Zotero.URI.getItemURI(item)],
        itemData
    }],
```

**Line 635**: Parent item citation
```javascript
citationItem.itemData = Zotero.Utilities.Item.itemToCSLJSON(item);
```

**Line 689**: Update citation items
```javascript
let itemData = Zotero.Utilities.Item.itemToCSLJSON(item);
citationItems.push({ uris, itemData });
```

**Line 1154**: New item insertion
```javascript
citationItem.itemData = Zotero.Utilities.Item.itemToCSLJSON(item);
```

**Line 1489**: Citation from annotation (with note about slight differences)
```javascript
// Note: integration.js` uses `Zotero.Cite.System.prototype.retrieveItem`,
// which produces a little bit different CSL JSON
let itemData = Zotero.Utilities.Item.itemToCSLJSON(parentItem);
```

### 4. **CSL Style Editor** (style.js:816)
```javascript
// Don't try to parse author names. We parse them in itemToCSLJSON
citeproc.opt.development_extensions.parse_names = false;
```
**Context**: Comment confirms name parsing happens in `itemToCSLJSON`.

### 5. **Test Files** (utilitiesSubmoduleTest.js)
**Context**: Unit tests for the function.

## Critical Code Section

**Lines 136-140** in `utilities_item.js`:

```javascript
else if (creator.lastName || creator.firstName) {
    nameObj = {
        family: creator.lastName || '',
        given: creator.firstName || ''
    };
```

**This is where `lastName` → `family` and `firstName` → `given` conversion happens!**

## Verification of Single Entry Point

### ✅ All citation scenarios use `itemToCSLJSON`:

1. **Preview** → `Zotero.Cite.System.retrieveItem()` → `itemToCSLJSON()` ✓
2. **Word Integration** → `Zotero.Cite.System.retrieveItem()` → `itemToCSLJSON()` ✓
3. **LibreOffice Integration** → `Zotero.Cite.System.retrieveItem()` → `itemToCSLJSON()` ✓
4. **Note Editor Citations** → Direct call to `itemToCSLJSON()` ✓
5. **Quick Copy (Bibliography)** → `Zotero.Cite` → `retrieveItem()` → `itemToCSLJSON()` ✓
6. **Export to CSL JSON** → Uses translator, which calls `ZU.itemToCSLJSON()` (same function) ✓

### Alternative paths investigated:

- **Quick Copy**: Uses `Zotero.Cite` for bibliographies, which calls `retrieveItem()`
- **RTF Scan**: Uses `Zotero.Cite`
- **Citation Dialog**: Uses `Zotero.Cite.System`

**All paths converge on the same function!**

## Monkey Patching Strategy

### ⚠️ CRITICAL: TWO Patch Points Required

**Discovery**: Zotero has **TWO separate code paths** for CSL-JSON conversion that must **BOTH** be intercepted!

### Path 1: Direct Usage
```javascript
Zotero.Utilities.Item.itemToCSLJSON
```
**Used by**: cite.js, editorInstance.js, integration.js (Word/LibreOffice)

### Path 2: Translator Sandbox
```javascript
Zotero.Utilities.Translate.prototype.itemToCSLJSON
```
**Used by**: All export translators (CSL JSON, Better BibTeX, etc.)

### Why Both Must Be Patched

The translator's version is **copied at Zotero startup** from `Item.itemToCSLJSON`:

```javascript
// In utilities_translate.js:58 (executed at Zotero startup)
Zotero.Utilities.Translate.prototype.itemToCSLJSON = Zotero.Utilities.Item.itemToCSLJSON;
```

When our plugin loads later and patches `Item.itemToCSLJSON`:
- ✅ **Path 1** (direct usage) sees the patched version
- ❌ **Path 2** (translators) still uses the OLD reference stored in prototype

**Solution**: Patch BOTH locations:

```javascript
const original = Zotero.Utilities.Item.itemToCSLJSON;

const interceptorWrapper = function(zoteroItem) {
    const cslItem = original.call(this, zoteroItem);
    enrichWithCNEMetadata(zoteroItem, cslItem);
    return cslItem;
};

// Patch both paths
Zotero.Utilities.Item.itemToCSLJSON = interceptorWrapper;
Zotero.Utilities.Translate.prototype.itemToCSLJSON = interceptorWrapper;
```

### Testing Both Paths

1. **Test Path 1**: Right-click item → "Create Bibliography from Item" ✅
2. **Test Path 2**: Right-click item → "Export Item..." → CSL JSON ✅

## Implementation Recommendation

**Strategy**: Monkey patch `Zotero.Utilities.Item.itemToCSLJSON` to inject CNE author original names into the `family` field.

**Advantages**:
- ✅ Single patch point
- ✅ Affects all citation scenarios
- ✅ Non-intrusive (doesn't modify Zotero native fields)
- ✅ Extra field remains source of truth
- ✅ Clean separation of concerns

**No alternative paths found** - this is definitively the only conversion function.

## References

- Source: `reference/zotero/chrome/content/zotero/xpcom/utilities/utilities_item.js`
- Usages: 5 files in main repository
- Submodule: `https://github.com/zotero/utilities`
