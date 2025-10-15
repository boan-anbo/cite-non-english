# Testing Guide: CNE Author Names Implementation

This guide explains how to test the indexed author name functionality in the CNE plugin.

## Overview

The author name implementation consists of three main components:

1. **Indexed Field Parser** - Parses `cne-author-N-*` fields from Extra
2. **EnrichAuthorNames Callback** - Converts to literal names in CSL-JSON
3. **Dynamic UI Component** - Shows author input fields in item pane

## Prerequisites

1. Build and install the plugin:
   ```bash
   npm run build
   npm run reload
   ```

2. Ensure you have Zotero running with the plugin loaded

## Test 1: Import Test Fixtures

Import the test RIS file containing indexed author fields:

1. Go to **File → Import**
2. Select `test/csl-tests/fixtures/cne-authors-indexed.ris`
3. Choose "Import to a New Collection"
4. Verify 9 items are imported

## Test 2: Verify Field Parsing

Check that indexed author fields are correctly parsed from Extra:

1. Select the first item (Hao, Chunwen book)
2. Click on the CNE section (字 icon in sidebar)
3. You should see:
   - **Author 1: Hao, Chunwen** (native name, read-only)
   - Four input fields showing:
     - Last (Original): 郝
     - First (Original): 春文
     - Last (Romanized): Hao
     - First (Romanized): Chunwen
   - Options dropdown showing: Spacing=Comma, Order=Romanized First

4. Verify the Extra field contains:
   ```
   cne-author-0-last-original: 郝
   cne-author-0-first-original: 春文
   cne-author-0-last-romanized: Hao
   cne-author-0-first-romanized: Chunwen
   cne-author-0-options: {"spacing":"comma","order":"romanized-first"}
   ```

## Test 3: Dynamic UI for Multiple Authors

Test the dynamic UI with multiple authors:

1. Select the item with 2 authors (Abe & Kaneko book)
2. Open CNE section
3. Verify you see **TWO author sections**:
   - Author 1: Abe, Yoshio
   - Author 2: Kaneko, Hideo
4. Each should have their own input fields and options

5. Select the item with 3 authors (Yamada, Suzuki, Tanaka)
6. Verify you see **THREE author sections** with all fields populated

## Test 4: Add Author Metadata to New Item

Test adding CNE metadata to an item without it:

1. Select any item with authors
2. Open CNE section
3. Fill in author fields manually:
   - Last (Original): [Enter original script]
   - First (Original): [Enter original script]
   - Last (Romanized): [Enter romanization]
   - First (Romanized): [Enter romanization]
4. Change options (spacing, order)
5. Verify changes save automatically (check Extra field)

## Test 5: Interceptor - Path 1 (Bibliography Generation)

Test that the interceptor converts author names for bibliography generation:

1. Select an item with indexed author metadata (e.g., Hao, Chunwen)
2. Right-click → **Create Bibliography from Item**
3. Choose citation style (e.g., Chicago Manual of Style)
4. Click OK

**Expected Result**: The bibliography should show the literal name format:
- If `order: "romanized-first"`: "Hao, Chunwen 郝春文"
- If `order: "original-first"`: "郝春文 Hao, Chunwen"

**Debugging**: Open Developer Console (Tools → Developer → Error Console) and look for:
```
[CNE] Enriched N author name(s)
```

## Test 6: Interceptor - Path 2 (CSL JSON Export)

Test that the interceptor works for CSL JSON export:

1. Select the same item (Hao, Chunwen)
2. Right-click → **Export Item...**
3. Choose format: **CSL JSON**
4. Save to a file
5. Open the exported JSON file

**Expected Result**: The author field should use literal name format:
```json
{
  "author": [
    {
      "literal": "Hao, Chunwen 郝春文"
    }
  ],
  ...
}
```

**NOT the structured format**:
```json
{
  "author": [
    {
      "family": "Hao",
      "given": "Chunwen"
    }
  ]
}
```

## Test 7: Different Formatting Options

Test various formatting options:

### Test Case 1: Comma Spacing + Romanized First
- Item: Hao, Chunwen (Chinese)
- Options: `{"spacing":"comma","order":"romanized-first"}`
- Expected: `Hao, Chunwen 郝春文`

### Test Case 2: Space Spacing + Original First
- Item: Abe, Yoshio (Japanese)
- Options: `{"spacing":"space","order":"original-first"}`
- Expected: `阿部善雄 Abe Yoshio`

### Test Case 3: No Spacing + Original First
- Item: Yamada, Tarō (Japanese)
- Options: `{"spacing":"none","order":"original-first"}`
- Expected: `山田太郎 YamadaTarō`

### Test Case 4: Space Spacing + Romanized First
- Item: Wang, Xiaobo (Chinese)
- Options: `{"spacing":"space","order":"romanized-first"}`
- Expected: `Wang Xiaobo 王小波`

## Test 8: UI Data Binding

Test two-way data binding:

1. Select an item with author metadata
2. Open CNE section
3. Modify a field (e.g., change Last (Original))
4. Wait 500ms (debounce delay)
5. Check Extra field - should update automatically
6. Modify options dropdown
7. Verify Extra field updates with new JSON

## Test 9: Clear Button Functionality

Test clear buttons:

1. Open CNE section for an item with author data
2. Hover over an input field
3. Click the "×" button that appears
4. Verify:
   - Input is cleared
   - Extra field is updated
   - Change is saved

## Test 10: Items Without Authors

Test graceful handling of items without authors:

1. Create or select an item with no authors (e.g., a website)
2. Open CNE section
3. Expected: Message "No authors found for this item."

## Troubleshooting

### Interceptor Not Working

If author names are not showing in bibliography/export:

1. Check console for error messages
2. Verify interceptor is registered:
   ```
   [CNE] Intercepted Zotero.Utilities.Item.itemToCSLJSON
   [CNE] Intercepted Zotero.Utilities.Translate.prototype.itemToCSLJSON
   ```
3. Verify callback is registered:
   ```
   [CNE] Registered callback, total: 1
   ```

### UI Not Showing

If author sections don't appear:

1. Verify the plugin is loaded
2. Check that item has creators with type "author"
3. Check console for rendering errors
4. Try closing and reopening the item

### Data Not Saving

If changes don't persist:

1. Check console for save errors
2. Verify item is not read-only
3. Try manually triggering save by switching to another item

## Success Criteria

✅ All indexed author fields parse correctly from Extra
✅ Dynamic UI shows correct number of author sections
✅ Data binding works bidirectionally
✅ Changes save automatically to Extra field
✅ Interceptor enriches CSL-JSON for bibliography (Path 1)
✅ Interceptor enriches CSL-JSON for export (Path 2)
✅ Literal names appear in bibliography output
✅ Literal names appear in CSL JSON export
✅ Different formatting options produce expected results
✅ Clear buttons work correctly
✅ Items without authors show appropriate message

## Next Steps

After successful testing:

1. Document any bugs found
2. Test with real-world citation styles
3. Test integration with Word/LibreOffice
4. Update README with usage examples
5. Create user documentation
