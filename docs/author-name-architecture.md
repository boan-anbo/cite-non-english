# Author Name Architecture - Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture Components](#architecture-components)
3. [Data Flow](#data-flow)
4. [Field Naming Convention](#field-naming-convention)
5. [Implementation Details](#implementation-details)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Overview

The CNE (Cite Non-English) author name system provides a complete solution for handling non-English author names with mixed scripts (original + romanized) in academic citations.

### Key Features

- **Indexed Storage**: Each author's metadata stored separately with 0-based indexing
- **Flexible Formatting**: Per-author options for spacing and script order
- **Dynamic UI**: Author sections generated dynamically based on item creators
- **CSL Interception**: Transparent injection of formatted names into citation output
- **Dual-Path Coverage**: Works for both bibliography generation AND export

### Why This Approach?

CSL (Citation Style Language) **cannot** handle per-author customization because:
- No index accessor (can't refer to `author[0]` vs `author[1]`)
- `<name-part>` affixes apply uniformly to ALL authors
- No conditional formatting for individual names

**Solution**: Intercept CSL-JSON conversion and inject pre-formatted literal names.

## Architecture Components

### 1. Type Definitions (`src/modules/cne/types.ts`)

```typescript
export interface CneAuthorData {
  /** Family name in original script */
  lastOriginal?: string;
  /** Given name in original script */
  firstOriginal?: string;
  /** Family name romanized */
  lastRomanized?: string;
  /** Given name romanized */
  firstRomanized?: string;
  /** Formatting options specific to this author */
  options?: CneAuthorOptions;
}

export interface CneAuthorOptions {
  /** How to separate family and given names in romanized form */
  spacing?: "comma" | "space" | "none";
  /** Whether to show romanized or original script first */
  order?: "romanized-first" | "original-first";
  /** Whether to join first and last names into single field */
  join?: boolean;
}

export interface CneMetadataData {
  // ... other fields
  /** Author names with CNE metadata (indexed by position) */
  authors?: CneAuthorData[];
}
```

### 2. Field Parser (`src/modules/cne/model/extraFieldParser.ts`)

**Responsibilities:**
- Parse indexed author fields from Extra field
- Serialize author data back to Extra field
- Handle JSON-encoded options

**Functions:**

```typescript
// Parse all author fields from Extra lines
function parseAuthorFields(lines: string[]): CneAuthorData[]

// Serialize authors to Extra field format
function serializeAuthorFields(authors?: CneAuthorData[]): string[]
```

**Pattern Matching:**

```javascript
// Author name fields: cne-author-0-last-original: 郝
const AUTHOR_FIELD_REGEX = /^cne-author-(\d+)-(last|first)-(original|romanized):\s*(.+)$/i;

// Author options: cne-author-0-options: {"spacing":"comma"}
const AUTHOR_OPTIONS_REGEX = /^cne-author-(\d+)-options:\s*(.+)$/i;
```

### 3. Interceptor (`src/modules/cne/interceptors/ItemToCSLJSONInterceptor.ts`)

**Responsibilities:**
- Monkey patch Zotero's CSL-JSON conversion
- Maintain callback registry
- Apply callbacks in order

**Critical Implementation Detail:**

```typescript
// MUST patch BOTH paths!
// Path 1: Direct usage (bibliography, preview, Word integration)
Zotero.Utilities.Item.itemToCSLJSON = interceptorWrapper;

// Path 2: Translator sandbox (export, Better BibTeX)
Zotero.Utilities.Translate.prototype.itemToCSLJSON = interceptorWrapper;
```

**Why Both?**
- Path 2 is **copied** at Zotero startup from Path 1
- Patching only Path 1 after startup doesn't affect translators
- Each translator gets a separate `Zotero.Utilities.Translate` instance

### 4. EnrichAuthorNames Callback (`src/modules/cne/callbacks/enrichAuthorNames.ts`)

**Responsibilities:**
- Read CNE author metadata from Extra field
- Format each author according to options
- Replace CSL-JSON structured names with literal names

**Format Logic:**

```typescript
function formatAuthorName(author: CneAuthorData): string {
  const options = author.options || {};
  const spacing = options.spacing || "comma";
  const order = options.order || "romanized-first";

  // Build romanized part
  let romanizedPart = "";
  switch (spacing) {
    case "comma": romanizedPart = `${last}, ${first}`; break;
    case "space": romanizedPart = `${last} ${first}`; break;
    case "none": romanizedPart = `${last}${first}`; break;
  }

  // Build original part (no spacing for original scripts)
  let originalPart = `${lastOriginal}${firstOriginal}`;

  // Combine based on order
  if (order === "romanized-first") {
    return `${romanizedPart} ${originalPart}`;
  } else {
    return `${originalPart} ${romanizedPart}`;
  }
}
```

**CSL-JSON Transformation:**

```typescript
// BEFORE (structured)
cslItem.author = [
  { family: "Hao", given: "Chunwen" }
];

// AFTER (literal)
cslItem.author = [
  { literal: "Hao, Chunwen 郝春文" }
];
```

### 5. UI Component (`src/modules/cne/ui/authorFieldBuilder.ts`)

**Responsibilities:**
- Generate dynamic author sections based on item creators
- Create input fields for each author
- Render formatting options controls

**Dynamic Rendering:**

```typescript
export function buildAllAuthorFieldGroups(
  item: Zotero.Item,
  authors?: CneAuthorData[],
): any[] {
  const creators = item.getCreators();
  const authorCreators = creators.filter(c => c.creatorType === "author");

  return authorCreators.map((creator, index) => {
    const authorData = authors && authors[index];
    return buildAuthorFieldGroup(index, creator, authorData);
  });
}
```

**Each Author Section Contains:**
- Native name display (read-only): "Hao, Chunwen"
- Four input fields:
  - Last (Original): `data-bind="author-0.lastOriginal"`
  - First (Original): `data-bind="author-0.firstOriginal"`
  - Last (Romanized): `data-bind="author-0.lastRomanized"`
  - First (Romanized): `data-bind="author-0.firstRomanized"`
- Two dropdown controls:
  - Spacing: `data-bind="author-0.options.spacing"`
  - Order: `data-bind="author-0.options.order"`

### 6. Data Binding (`src/modules/cne/section/renderer.ts`)

**Responsibilities:**
- Two-way binding between UI inputs and metadata model
- Handle both static fields and indexed author fields
- Auto-save with debouncing

**Author Field Binding:**

```typescript
function setupAuthorFieldBinding(
  element: Element,
  bindKey: string, // e.g., "author-0.lastOriginal" or "author-1.options.spacing"
  prop: string,
  metadata: CneMetadata,
  container: HTMLElement,
): void {
  // Parse: "author-0.lastOriginal" => index=0, field="lastOriginal"
  const keys = bindKey.split(".");
  const indexMatch = keys[0].match(/^author-(\d+)$/);
  const authorIndex = parseInt(indexMatch[1], 10);

  // Initialize author object if needed
  if (!metadata.data.authors[authorIndex]) {
    metadata.data.authors[authorIndex] = {};
  }

  // Set initial value and listen for changes
  // ...
}
```

## Data Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Input (UI)                                              │
│    ┌──────────────────────────────────────────────────┐        │
│    │ Author 1: Hao, Chunwen                           │        │
│    │  Last (Original): 郝    First (Original): 春文   │        │
│    │  Last (Romanized): Hao  First (Romanized): Chunwen│      │
│    │  Spacing: Comma  Order: Romanized First          │        │
│    └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Data Binding Layer                                           │
│    - Captures input events                                      │
│    - Updates CneMetadata.data.authors[0]                       │
│    - Triggers debounced save (500ms)                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Extra Field Serialization                                    │
│    CneMetadata.save() →                                         │
│    serializeAuthorFields() →                                    │
│    Extra field:                                                 │
│      cne-author-0-last-original: 郝                             │
│      cne-author-0-first-original: 春文                          │
│      cne-author-0-last-romanized: Hao                          │
│      cne-author-0-first-romanized: Chunwen                     │
│      cne-author-0-options: {"spacing":"comma","order":"..."} │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Citation Generation (User creates bibliography/export)       │
│    Zotero core →                                                │
│    itemToCSLJSON() [INTERCEPTED!] →                            │
│    {family: "Hao", given: "Chunwen"}                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Enrichment (Interceptor Callback)                           │
│    enrichAuthorNames() reads Extra field →                      │
│    parseAuthorFields() →                                        │
│    formatAuthorName() →                                         │
│    {literal: "Hao, Chunwen 郝春文"}                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CSL Processing                                               │
│    CSL-JSON → citeproc-js →                                    │
│    Renders literal name as-is →                                 │
│    Final citation: "Hao, Chunwen 郝春文. ..."                  │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Flow

**Write Path (UI → Extra)**

1. User types in input field
2. `input` event fires
3. Data binding updates `metadata.data.authors[i]`
4. Debounce timer starts (500ms)
5. Timer expires → `metadata.save()`
6. `serializeAuthorFields()` converts to Extra lines
7. `item.setField('extra', serialized)`

**Read Path (Extra → UI)**

1. Item selected, CNE section renders
2. `CneMetadata` created from item
3. `parseExtraField()` extracts all CNE data
4. `parseAuthorFields()` parses indexed fields
5. `buildAllAuthorFieldGroups()` creates UI elements
6. Data binding reads from `metadata.data.authors[]`
7. Input fields populate with initial values

### Citation Flow

**Path 1: Bibliography Generation**

```
User: Right-click → "Create Bibliography"
  ↓
cite.js:660: Zotero.Cite.System.retrieveItem()
  ↓
itemToCSLJSON() [INTERCEPTED]
  ↓
enrichAuthorNames callback
  ↓
CSL processor receives literal names
  ↓
Bibliography output
```

**Path 2: CSL JSON Export**

```
User: Right-click → "Export Item" → CSL JSON
  ↓
Translator invokes ZU.itemToCSLJSON()
  ↓
Zotero.Utilities.Translate.prototype.itemToCSLJSON [INTERCEPTED]
  ↓
enrichAuthorNames callback
  ↓
Export file contains literal names
```

## Field Naming Convention

### Indexed Author Fields

**Format**: `cne-author-{index}-{namePart}-{variant}`

**Components:**
- `index`: 0-based position matching creator order (0, 1, 2, ...)
- `namePart`: `last` or `first`
- `variant`: `original` or `romanized`

**Examples:**

```
# First author (index 0)
cne-author-0-last-original: 郝
cne-author-0-first-original: 春文
cne-author-0-last-romanized: Hao
cne-author-0-first-romanized: Chunwen
cne-author-0-options: {"spacing":"comma","order":"romanized-first"}

# Second author (index 1)
cne-author-1-last-original: 王
cne-author-1-first-original: 小波
cne-author-1-last-romanized: Wang
cne-author-1-first-romanized: Xiaobo
cne-author-1-options: {"spacing":"space","order":"romanized-first"}
```

### Options Field

**Format**: `cne-author-{index}-options: {JSON}`

**JSON Schema:**

```typescript
{
  "spacing": "comma" | "space" | "none",
  "order": "romanized-first" | "original-first",
  "join"?: boolean  // Future feature
}
```

**Defaults:**
- `spacing`: `"comma"`
- `order`: `"romanized-first"`

## Implementation Details

### Parsing Strategy

**Use Map for Sparse Arrays:**

```typescript
function parseAuthorFields(lines: string[]): CneAuthorData[] {
  const authorsMap = new Map<number, CneAuthorData>();

  for (const line of lines) {
    // Match and extract index
    const index = parseInt(match[1], 10);

    // Initialize if needed
    if (!authorsMap.has(index)) {
      authorsMap.set(index, {});
    }

    // Set field
    authorsMap.get(index)[fieldName] = value;
  }

  // Convert to array, handling gaps
  const maxIndex = Math.max(...authorsMap.keys());
  const authors: CneAuthorData[] = [];
  for (let i = 0; i <= maxIndex; i++) {
    if (authorsMap.has(i)) {
      authors[i] = authorsMap.get(i);
    }
  }

  return authors;
}
```

**Why?**
- Handles non-sequential indices gracefully
- Preserves gaps in array (e.g., if author 1 missing but author 2 exists)
- Efficient for sparse data

### Serialization Order

**Consistent field ordering for readability:**

```
cne-author-0-last-original      (1)
cne-author-0-first-original     (2)
cne-author-0-last-romanized     (3)
cne-author-0-first-romanized    (4)
cne-author-0-options            (5)
```

**Benefits:**
- Predictable Extra field format
- Easier manual editing
- Better diff visibility in version control

### Error Handling

**Parser Robustness:**

```typescript
// Handle malformed JSON in options
try {
  author.options = JSON.parse(optionsJson);
} catch (e) {
  ztoolkit.log(`[CNE] Failed to parse author ${index} options: ${e}`, "error");
  // Continue processing, skip this options field
}
```

**Interceptor Isolation:**

```typescript
// Wrap each callback in try-catch
for (const callback of this.callbacks) {
  try {
    callback(zoteroItem, cslItem);
  } catch (e) {
    ztoolkit.log(`[CNE] Callback error: ${e}`, "error");
    // Continue with next callback
  }
}
```

**Why?**
- One malformed field doesn't break entire parsing
- One failing callback doesn't break others
- Graceful degradation

## Testing

### Unit Testing Approach

**Test Fixtures:**

Located in `test/csl-tests/fixtures/cne-authors-indexed.ris`

Contains:
- Single author items
- Multiple author items (2-3 authors)
- Different formatting options
- Various languages (Chinese, Japanese, Korean)

**Manual Testing Checklist:**

See `test/csl-tests/TESTING-AUTHORS.md` for comprehensive guide.

Key tests:
1. ✅ Field parsing from Extra
2. ✅ Dynamic UI rendering (1, 2, 3+ authors)
3. ✅ Data binding (UI ↔ Extra)
4. ✅ Auto-save with debouncing
5. ✅ Interceptor Path 1 (bibliography)
6. ✅ Interceptor Path 2 (export)
7. ✅ Formatting options (comma/space/none, romanized/original first)
8. ✅ Clear button functionality
9. ✅ Items without authors

### Debugging Tips

**Enable Debug Logging:**

Check Browser Console (Tools → Developer → Error Console):

```
[CNE] Intercepted Zotero.Utilities.Item.itemToCSLJSON
[CNE] Intercepted Zotero.Utilities.Translate.prototype.itemToCSLJSON
[CNE] Registered callback, total: 1
[CNE] Enriched 2 author name(s)
```

**Verify Interceptor Status:**

```typescript
const status = ItemToCSLJSONInterceptor.getStatus();
// { intercepted: true, callbackCount: 1 }
```

**Check CSL-JSON Output:**

Export item as CSL JSON and verify author field:

```json
{
  "author": [
    {
      "literal": "Hao, Chunwen 郝春文"  // ✅ Correct
    }
  ]
}
```

NOT:

```json
{
  "author": [
    {
      "family": "Hao",  // ❌ Wrong - interceptor not working
      "given": "Chunwen"
    }
  ]
}
```

## Troubleshooting

### Problem: Interceptor Not Working

**Symptoms:**
- Bibliography shows "Hao, Chunwen" instead of "Hao, Chunwen 郝春文"
- CSL JSON export has structured names, not literal

**Diagnosis:**

1. Check console for interceptor registration messages
2. Verify callback is registered
3. Check if Extra field has author data

**Solutions:**

- Reload plugin: `npm run reload`
- Check that enrichAuthorNames is imported and registered
- Verify BOTH paths are patched (check code)

### Problem: UI Not Showing Author Sections

**Symptoms:**
- CNE section opens but no author fields appear
- Message "No authors found" when item has authors

**Diagnosis:**

1. Check item.getCreators() in console
2. Verify creators have type "author" (not "editor", "translator")
3. Check console for rendering errors

**Solutions:**

- Ensure item has creator type "author"
- Check authorFieldBuilder import in renderer
- Verify buildAllAuthorFieldGroups is called

### Problem: Data Not Saving

**Symptoms:**
- Type in fields but Extra doesn't update
- Changes disappear when switching items

**Diagnosis:**

1. Check console for save errors
2. Verify debounce timer is working
3. Check data binding setup

**Solutions:**

- Wait 500ms for debounce
- Check setupAuthorFieldBinding is called
- Verify metadata.save() has permissions

### Problem: Formatting Not Applied

**Symptoms:**
- All authors show same format regardless of options
- Options dropdown doesn't affect output

**Diagnosis:**

1. Check Extra field has options JSON
2. Verify formatAuthorName logic
3. Check enrichAuthorNames reads options correctly

**Solutions:**

- Manually check options JSON syntax
- Verify options object structure matches interface
- Check console for parsing errors

## Advanced Topics

### Adding New Formatting Options

To add a new option (e.g., `case: "uppercase" | "lowercase"`):

**1. Update Types:**

```typescript
// src/modules/cne/types.ts
export interface CneAuthorOptions {
  spacing?: "comma" | "space" | "none";
  order?: "romanized-first" | "original-first";
  case?: "uppercase" | "lowercase";  // NEW
}
```

**2. Update Format Logic:**

```typescript
// src/modules/cne/callbacks/enrichAuthorNames.ts
function formatAuthorName(author: CneAuthorData): string {
  // ... existing code

  // Apply case transformation
  if (options.case === "uppercase") {
    romanizedPart = romanizedPart.toUpperCase();
  } else if (options.case === "lowercase") {
    romanizedPart = romanizedPart.toLowerCase();
  }

  return parts.join(" ");
}
```

**3. Update UI:**

```typescript
// src/modules/cne/ui/authorFieldBuilder.ts
function createOptionsRow(index: number, options?: any): any {
  return {
    // ... existing children
    children: [
      // ... spacing, order dropdowns

      // New case dropdown
      {
        tag: "select",
        id: `author-${index}-case`,
        attributes: {
          "data-bind": `author-${index}.options.case`
        },
        properties: {
          innerHTML: `
            <option value="">Default</option>
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
          `
        }
      }
    ]
  };
}
```

**4. Update Tests:**

Add test cases for new option in `cne-authors-indexed.ris`.

### Extending to Other Creator Types

Currently supports `author` only. To add `editor`, `translator`, etc.:

**1. Update UI Builder:**

```typescript
// src/modules/cne/ui/authorFieldBuilder.ts
export function buildAllAuthorFieldGroups(
  item: Zotero.Item,
  authors?: CneAuthorData[],
  creatorType: string = "author"  // NEW parameter
): any[] {
  const creators = item.getCreators();
  const filtered = creators.filter(c => c.creatorType === creatorType);
  // ... rest of logic
}
```

**2. Update Callback:**

Handle multiple creator types in enrichAuthorNames.

**3. Update Field Naming:**

Consider: `cne-editor-0-*`, `cne-translator-0-*`, etc.

## Summary

The CNE author name system provides:

✅ **Complete Coverage** - Both bibliography AND export paths
✅ **Flexible Formatting** - Per-author control of spacing and order
✅ **CSL Transparency** - Works with ANY CSL style (literal names)
✅ **Dynamic UI** - Adapts to number of authors
✅ **Type Safety** - Strong TypeScript interfaces
✅ **Error Resilient** - Graceful handling of malformed data
✅ **Well Tested** - Comprehensive manual testing guide
✅ **Developer Friendly** - Clear architecture and documentation

For questions or contributions, see the main [README.md](../README.md).
