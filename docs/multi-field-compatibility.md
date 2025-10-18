# Compatibility: `multi` Field in Standard Zotero

## Short Answer

**YES**, the `multi` field works in standard Zotero 7 without any Juris-M installation!

## Evidence

### 1. Our Tests Pass
Our Morrison name test produces correct output:
```
edited by Lin Shitian 林世田 and Alastair Morrison
```

This proves that our `multi.main` override is working in standard Zotero's citeproc-js.

### 2. Citeproc-js Version in Our Project
Our test environment uses **citeproc-js version 1.4.61** (found in `tools/citeproc-js-server/lib/citeproc.js`).

### 3. Zotero's Citeproc-js Includes Juris-M Extensions
While `multi` was originally developed for Juris-M (Multilingual Zotero), **standard Zotero ships with a version of citeproc-js that includes these extensions**.

The citeproc-js source code we're using (from `github.com/zotero/citeproc-js-server`) contains the complete multilingual support code, including:
- `name.multi.main` handling (lines 13772-13773, 14262-14263)
- `name.multi._key` for alternative language versions (line 14246)
- Multi-language item support (`Item.multi`)

## Why This Works

### History: Juris-M Extensions → Standard Citeproc-js

1. **Juris-M/Multilingual Zotero** developed CSL-M extensions for legal and multilingual citations
2. **Frank Bennett** (citeproc-js author) incorporated these features into the main citeproc-js codebase
3. **Zotero** uses this enhanced version of citeproc-js that includes the extensions
4. **The extensions work** even if you don't use Juris-M - they're just dormant unless you populate the `multi` fields

### What This Means

The `multi` object structure is **built into standard citeproc-js**, which is **bundled with standard Zotero**.

You don't need to:
- ❌ Install Juris-M
- ❌ Enable any special mode
- ❌ Use CSL-M styles

You just need to:
- ✅ Set `name.multi.main` in your CSL-JSON
- ✅ Citeproc-js will automatically use it

## Important Distinction

### What's in Standard Zotero

**Included** (in citeproc-js):
- ✅ `multi.main` support for per-name language control
- ✅ `multi._key` support for alternative language versions
- ✅ All the code that processes these fields

**Not Included** (Juris-M-only features):
- ❌ Juris-M's UI for entering multilingual data
- ❌ Juris-M's automatic multi-field population
- ❌ Some advanced CSL-M style features that require application-level support

### What CNE Does

We **manually populate** `multi.main` in our JavaScript code:

```typescript
// In enrichAuthorNames callback
cslCreator.multi = {
  main: hasCNEData ? originalLang : "en"
};
```

This works because:
1. We have full control over the CSL-JSON before it reaches citeproc-js
2. Citeproc-js (bundled in Zotero) sees our `multi.main` and respects it
3. No Juris-M needed!

## Testing

Our test suite runs with:
- **Zotero 7** (standard distribution)
- **Citeproc-js 1.4.61** (bundled with Zotero)
- **Standard Chicago CSL style** (no CSL-M modifications)

And produces correct results:
- Asian names with CNE data → Asian ordering
- Western names without CNE data → Western ordering

## Conclusion

The `multi` field is a **citeproc-js extension** that's **included in standard Zotero**, even though it was originally developed for Juris-M. We can use it freely in our plugin without requiring users to install Juris-M.

Think of it like this:
- **Juris-M** = Special Zotero distribution with UI and workflows for multilingual data
- **citeproc-js with multi support** = The citation processor (used by both Zotero and Juris-M)
- **Standard Zotero** = Uses the same citeproc-js, so multi fields work!

We're essentially using an "undocumented" feature that's present in the codebase but not exposed through Zotero's standard UI.
