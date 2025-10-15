# Postprocessing Interception Point for Title Formatting

## Executive Summary

Found a **postprocessing point** where we can:
- ✅ Access CSL engine (with style information)
- ✅ Modify final formatted output (HTML/text strings)
- ✅ Know which format is being used (HTML, text, RTF)

**Location**: `chrome/content/zotero/xpcom/cite.js:253`
**Function**: `Zotero.Cite.makeFormattedBibliography()`

## Data Flow

```
User Action (Create Bibliography / Preview)
    ↓
makeFormattedBibliographyOrCitationList(cslEngine, items, format)
    ↓
makeFormattedBibliography(cslEngine, format)  ← INTERCEPT HERE!
    ↓
cslEngine.makeBibliography()  ← Returns formatted output
    ↓
bib[1] = ["<formatted entry 1>", "<formatted entry 2>", ...]
    ↓
Post-process HTML strings in bib[1]
    ↓
Return modified output
```

## Code Location

**File**: `chrome/content/zotero/xpcom/cite.js`

**Line 253-276**:
```javascript
"makeFormattedBibliography":function makeFormattedBibliography(cslEngine, format) {
    var bib = cslEngine.makeBibliography();  // ← CSL processor output
    if(!bib) return false;

    if(format == "html") {
        var output = [bib[0].bibstart];
        for(var i in bib[1]) {
            output.push(bib[1][i]);  // ← These are final formatted HTML strings!

            // Add COinS metadata...
        }
        output.push(bib[0].bibend);
        var html = output.join("");

        // ... inline CSS processing ...

        return html;  // ← Final output returned here
    }
    // ... other formats (text, rtf)
}
```

## What We Can Access

### 1. CSL Engine Object (`cslEngine`)

**Available properties:**
```javascript
cslEngine.opt.class        // Style class: "in-text" or "note"
cslEngine.opt.styleID      // Style ID (need to verify)
cslEngine.opt.styleName    // Style name (need to verify)
// ... other properties in cslEngine.opt
```

**From line 201**:
```javascript
var styleClass = cslEngine.opt.class;
```
This confirms `cslEngine.opt` exists and contains style information.

### 2. Bibliography Output (`bib`)

**Structure:**
```javascript
bib[0] = {
    bibstart: "<div class=\"csl-bib-body\">",
    bibend: "</div>",
    entry_ids: [[itemID1], [itemID2], ...],
    maxoffset: 123,
    entryspacing: 1,
    linespacing: 1,
    hangingindent: false,
    // ... formatting metadata
}

bib[1] = [
    "<div class=\"csl-entry\">Hao, Chunwen 郝春文. <i>Tang houqi...</i></div>",
    "<div class=\"csl-entry\">...</div>",
    ...
]
```

**Key**: `bib[1]` contains the **final formatted HTML strings** for each bibliography entry.

### 3. Format Parameter

```javascript
format = "html" | "text" | "rtf"
```

## Interception Strategy

### Approach: Monkey Patch `makeFormattedBibliography`

```typescript
// Save original function
const original = Zotero.Cite.makeFormattedBibliography;

// Create wrapper
Zotero.Cite.makeFormattedBibliography = function(cslEngine, format) {
    // Call original to get bibliography
    var bib = cslEngine.makeBibliography();
    if (!bib) return false;

    // POST-PROCESS: Modify bib[1] array in-place
    if (format === "html") {
        for (let i = 0; i < bib[1].length; i++) {
            let html = bib[1][i];

            // Detect if this entry has CNE metadata
            // Option 1: Check item ID from bib[0].entry_ids[i]
            // Option 2: Parse HTML to detect CNE patterns

            // Get style information
            const styleClass = cslEngine.opt.class;
            const styleID = cslEngine.opt.styleID; // Need to verify

            // Apply style-specific transformations
            if (styleID.includes("chicago")) {
                // Chicago: Already italicizes, use double-<i> trick
                html = applyChicagoTitleFormatting(html);
            } else if (styleID.includes("apa")) {
                // APA: Different handling
                html = applyAPATitleFormatting(html);
            } else if (styleID.includes("mla")) {
                // MLA: Different handling
                html = applyMLATitleFormatting(html);
            }

            bib[1][i] = html;
        }
    }

    // Continue with original processing
    if(format == "html") {
        var output = [bib[0].bibstart];
        for(var i in bib[1]) {
            output.push(bib[1][i]);
        }
        output.push(bib[0].bibend);
        // ... rest of original logic
        return html;
    }
    // ... handle other formats
};
```

## Advantages

✅ **Style-Aware**:
- Can access style information via `cslEngine.opt`
- Apply different formatting based on detected style
- Conditional logic for Chicago, APA, MLA, etc.

✅ **Post-Processing**:
- CSL processor has already run
- We modify final output, not input
- No risk of breaking CSL processing

✅ **Access to Item IDs**:
- `bib[0].entry_ids[i]` gives us item IDs
- Can fetch CNE metadata from items
- Know exactly which entry to modify

✅ **Format-Aware**:
- Know if output is HTML, text, or RTF
- Can apply format-specific transformations
- HTML allows rich formatting

✅ **Single Interception Point**:
- All bibliography generation goes through this
- Preview pane, Quick Copy, export, etc.
- One patch catches everything

## Challenges

⚠️ **Need to Verify Style ID Access**:
- Must confirm `cslEngine.opt.styleID` or similar exists
- May need to trace through style.js to find property name

⚠️ **Parsing HTML**:
- Need to parse formatted HTML strings
- Find where titles appear in output
- Replace with CNE-formatted versions

⚠️ **Item ID Lookup**:
- Must efficiently fetch CNE metadata from item IDs
- Avoid performance issues with large bibliographies

⚠️ **Style Detection**:
- Need robust way to detect style type
- Handle style variations (chicago-note-bibliography vs chicago-author-date)

## Implementation Plan

### Phase 1: Verify Style ID Access (Research)
```javascript
// In Zotero console, test:
var cslEngine = ...; // Get engine somehow
console.log(cslEngine.opt.styleID);
console.log(cslEngine.opt.styleName);
console.log(Object.keys(cslEngine.opt));
```

### Phase 2: Basic Interception (Proof of Concept)
```typescript
// Intercept and log
const original = Zotero.Cite.makeFormattedBibliography;
Zotero.Cite.makeFormattedBibliography = function(cslEngine, format) {
    console.log("Style class:", cslEngine.opt.class);
    console.log("Style opt keys:", Object.keys(cslEngine.opt));

    var result = original.call(this, cslEngine, format);
    console.log("Output (first 200 chars):", result.substring(0, 200));

    return result;
};
```

### Phase 3: CNE Title Post-Processing
```typescript
function postProcessBibliography(bib, cslEngine, format) {
    if (format !== "html") return;

    for (let i = 0; i < bib[1].length; i++) {
        let html = bib[1][i];
        const itemIDs = bib[0].entry_ids[i];

        // For each item, check if it has CNE metadata
        for (let itemID of itemIDs) {
            const item = Zotero.Items.get(itemID);
            const metadata = parseExtraField(item.getField('extra'));

            if (metadata.title) {
                // Parse HTML to find title
                // Replace with CNE-formatted version
                html = replaceTitleInHTML(html, metadata.title, cslEngine.opt);
            }
        }

        bib[1][i] = html;
    }
}
```

### Phase 4: Style-Specific Formatting
```typescript
function replaceTitleInHTML(html, titleData, styleOpt) {
    const styleID = styleOpt.styleID || "";

    if (styleID.includes("chicago")) {
        // Use double-<i> trick for Chicago
        return applyChicagoFormatting(html, titleData);
    } else if (styleID.includes("apa")) {
        // Use different approach for APA
        return applyAPAFormatting(html, titleData);
    }

    // Default: no modification
    return html;
}
```

## Next Steps

1. **Verify `cslEngine.opt` properties** - Test in Zotero console
2. **Create test interceptor** - Log style information
3. **Implement HTML parsing** - Find and replace titles
4. **Add style detection** - Handle Chicago, APA, MLA
5. **Test with multiple styles** - Verify correct formatting

## Comparison with Current Approach

| Aspect | itemToCSLJSON (Current) | makeFormattedBibliography (Proposed) |
|--------|------------------------|---------------------------------------|
| **Style awareness** | ❌ No | ✅ Yes (via cslEngine.opt) |
| **When runs** | Before CSL processing | After CSL processing |
| **What we modify** | CSL-JSON input | Final HTML output |
| **Item access** | ✅ Direct | ✅ Via item IDs |
| **Risk** | Low (simple data injection) | Medium (HTML manipulation) |
| **Complexity** | Low | Medium (HTML parsing) |
| **Universality** | ✅ Style-agnostic | ⚠️ Needs style-specific logic |

## Conclusion

**makeFormattedBibliography** is a **viable postprocessing point** that addresses the main limitation of the current approach: **style awareness**.

**Recommendation**:
1. First, verify we can access style ID from `cslEngine.opt`
2. Create proof-of-concept interceptor
3. If style detection works well, proceed with full implementation
4. Keep current author name enrichment (works universally)
5. Add title postprocessing for style-aware formatting

This approach is **complementary** to the current itemToCSLJSON interception:
- **Author names**: Keep at itemToCSLJSON level (style-agnostic literal names)
- **Titles**: Move to makeFormattedBibliography level (style-aware HTML postprocessing)
