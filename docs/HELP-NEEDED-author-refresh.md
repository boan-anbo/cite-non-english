# SOLVED: Author Fields Refresh Issue

## Problem Summary (RESOLVED)

When detecting creator changes in a Zotero item, we refresh the author fields dynamically. The newly inserted author fields were being **appended to the end of the form** (after the Data Preview section) instead of being inserted in the **correct position** (after language buttons, before title fields).

The fields only appeared in the correct position after the user **switched to another item and came back**.

## Solution Implemented

The issue was resolved by changing the refresh strategy to more closely mimic the initial render approach:

1. **Complete DOM Rebuild**: Instead of using `insertBefore()` with an anchor element, we now:
   - Collect all non-author elements from the container (preserving references)
   - Determine the correct insertion index for author fields
   - Remove all children from the container
   - Re-append all elements in the correct order

2. **Key Changes**:
   - Use `removeChild()` loop instead of `innerHTML = ""` to preserve event listeners
   - Build complete element array before modifying DOM
   - Use array index-based positioning instead of DOM anchor points
   - Added `setTimeout` wrapper for binding setup to ensure DOM is ready

3. **Code Location**: `src/modules/cne/section/renderer.ts:refreshAuthorFields()`

## Current Behavior

1. User opens an item with 1 author
2. User adds a second author in Zotero's native creator field
3. **Our code detects the change** (✓ works)
4. **Our code removes old author sections** (✓ works)
5. **Our code attempts to insert new author sections** (✗ **inserted at wrong position**)
   - New author fields appear at the **end of the form** (after Data Preview)
   - Should appear **before title fields**
6. User switches to another item, then comes back
7. Now author fields appear in **correct position** (after full re-render)

## Expected Behavior

- New author fields should be inserted **before the title section** immediately
- Position should be correct on first change, not requiring item switch

## DOM Structure

```
body (ItemPane body element)
  └─ div (inner container created by renderCneSection)
      ├─ <style> (CSS)
      ├─ Field Counter
      ├─ Language Selector
      ├─ Quick Language Buttons
      ├─ Author Fields (DYNAMIC - should be here)
      │   ├─ 1. Author: Kim, Minsoo
      │   ├─ 2. Author: new  ← newly added fields wrongly appear after Data Preview
      ├─ Title Fields (STATIC)
      ├─ Container Title Fields
      ├─ Publisher Fields
      ├─ Journal Fields
      ├─ Series Fields
      └─ 📋 Data Preview (In Memory)
```

## Relevant Code

### Initial Render (works correctly)
`src/modules/cne/section/renderer.ts:45-86`

```typescript
export function renderCneSection(renderProps) {
  const { body, item, editable } = renderProps;

  const fieldGroups = buildAllFieldGroups(SUPPORTED_FIELDS);
  const authorFieldGroups = buildAllAuthorFieldGroups(item, metadata.data.authors);

  const container = ztoolkit.UI.createElement(doc, "div", {
    namespace: "html",
    styles: { padding: "4px 8px", ... },
    children: [
      { tag: "style", ... },
      createFieldCounter(metadata),
      createLanguageSelector(item, metadata),
      createQuickLanguageButtons(item, metadata),
      ...authorFieldGroups,  // ← Correctly positioned here in initial render
      ...fieldGroups,         // title, publisher, etc.
      createLivePreview(metadata),
    ],
  });

  body.appendChild(container);

  // Set up bindings - passing body
  setupDataBinding(body, metadata);
  setupClearButtons(body, metadata);
  setupLanguageBinding(body, item, metadata);  // ← This sets up the notifier
}
```

### Dynamic Refresh (wrong position)
`src/modules/cne/section/renderer.ts:110-200`

```typescript
export async function refreshAuthorFields(
  body: HTMLElement,  // The outer body element
  item: Zotero.Item,
  metadata: CneMetadata
): Promise<void> {
  // 0. Find the real inner container
  const realContainer = body.querySelector("div") as HTMLElement;
  if (!realContainer) {
    ztoolkit.log("[CNE] Error: Could not find CNE inner container");
    return;
  }

  // 1. Find and remove old author sections (✓ works)
  const allFieldGrids = Array.from(realContainer.querySelectorAll(".cne-field-grid"));
  const authorSections: Element[] = [];
  allFieldGrids.forEach((grid: Element) => {
    if (grid.querySelector('[id^="author-"]')) {
      const sectionContainer = grid.parentElement;
      if (sectionContainer) {
        authorSections.push(sectionContainer);
      }
    }
  });
  authorSections.forEach((section) => section.remove());

  // 2. Rebuild author field groups (✓ works)
  const newAuthorFieldGroups = buildAllAuthorFieldGroups(item, metadata.data.authors);

  // 3. Find title section as anchor (seems to find it - no fallback log)
  const titleInput = realContainer.querySelector('[id="title-original"]');
  let titleSectionContainer: Element | null = null;
  if (titleInput) {
    const titleGrid = titleInput.closest(".cne-field-grid");
    if (titleGrid) {
      titleSectionContainer = titleGrid.parentElement;
    }
  }

  // 4. Insert new author fields BEFORE title section (✗ doesn't work as expected)
  const doc = realContainer.ownerDocument!;

  if (titleSectionContainer && titleSectionContainer.parentElement) {
    newAuthorFieldGroups.forEach((fieldGroupConfig: any) => {
      const element = ztoolkit.UI.createElement(doc, fieldGroupConfig.tag, fieldGroupConfig);
      titleSectionContainer!.parentElement!.insertBefore(element, titleSectionContainer);
    });
    ztoolkit.log("[CNE] Author fields inserted before title section");  // ← This logs!
  } else {
    // This fallback is NOT being triggered
    ztoolkit.log("[CNE] Warning: Title section not found, appending author fields");
    // ...
  }

  // 5. Re-setup data binding
  setupDataBinding(body, metadata);
}
```

## What We've Tried

1. ✓ Fixed the container reference (`body` vs `realContainer`)
2. ✓ Using `insertBefore()` with title section as anchor
3. ✓ Added logging - confirms `insertBefore()` is being called
4. ✗ **Still results in wrong position**

## Questions for External Expert

1. **Why does `insertBefore()` not work correctly during dynamic refresh, but works during initial render?**
   - Initial render: spreads `...authorFieldGroups` in children array → correct position
   - Dynamic refresh: calls `insertBefore(element, titleSectionContainer)` → wrong position

2. **Is there a timing issue?**
   - Could `ztoolkit.UI.createElement()` be asynchronous?
   - Should we wait for something before inserting?

3. **Is our anchor point wrong?**
   - We use `titleSectionContainer.parentElement.insertBefore(element, titleSectionContainer)`
   - Should we use a different reference point?

4. **Could there be multiple `div` elements?**
   - We use `body.querySelector("div")` to find the container
   - Could this be finding the wrong div?

5. **Why does it work after switching items?**
   - Switching items triggers full `renderCneSection()` re-render
   - This suggests the problem is specific to our dynamic insertion logic

## Debug Suggestions

What additional logging or DOM inspection would help diagnose this?

## Files to Review

- `src/modules/cne/section/renderer.ts` - Initial render and refresh logic
- `src/modules/cne/section/binding/languageBinding.ts` - Notifier that triggers refresh
- `src/modules/cne/ui/authorFieldBuilder.ts` - How author field groups are built
- `src/modules/cne/ui/components.ts` - `createFieldSection()` structure

## Additional Context

- Framework: Zotero Plugin Template with ztoolkit
- Environment: Zotero 7
- The fields have correct data binding after insertion (can edit them)
- The fields just appear in the wrong visual position
- Full re-render (switching items) fixes the position

## Request

Please help us understand why `insertBefore()` during dynamic refresh results in wrong position, while initial render with spread operator works correctly.
