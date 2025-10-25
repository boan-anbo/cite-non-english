# Creator Name Change Detection Fix

## Problem
When editing creator names (first name, last name) in Zotero, the CNE panel wasn't refreshing because the change detection only looked at the **number** of creators, not their **content**.

### User's Experience:
1. Add a new author → ✅ Triggers refresh (count changed)
2. Type last name → ❌ No refresh (count unchanged)
3. Type first name → ❌ No refresh (count unchanged)

## Root Cause
The `checkCreatorsChanged()` function only compared creator count:
```javascript
// OLD: Only detected count changes
const hasChanged = currentCreators.length !== displayedCount;
```

## Solution Implemented

### 1. Enhanced Change Detection
Created a signature-based system that tracks both count AND content:

```javascript
// Generate signature from creator data
function getCreatorSignature(creators: any[]): string {
  return creators.map(c => {
    const lastName = c.lastName || '';
    const firstName = c.firstName || '';
    const name = c.name || '';
    const typeID = c.creatorTypeID !== undefined ? c.creatorTypeID : '';
    return `${lastName}|${firstName}|${name}|${typeID}`;
  }).join(';');
}

// Compare both count and content
const countChanged = currentCreators.length !== displayedCount;
const contentChanged = currentSignature !== storedSignature;
const hasChanged = countChanged || contentChanged;
```

### 2. Signature Management
- Store signature on container element after each change
- Initialize signature on first render
- Update signature after each refresh

## Files Modified

1. **creatorChangeDetector.ts**
   - Added `getCreatorSignature()` function
   - Enhanced `checkCreatorsChanged()` to detect content changes
   - Added `updateCreatorSignature()` for signature management

2. **authorRefresh.ts**
   - Call `updateCreatorSignature()` after refresh completes

3. **mainRenderer.ts**
   - Initialize signature on first render

4. **binding/index.ts**
   - Export new `updateCreatorSignature` function

## Benefits

✅ **Detects all creator changes:**
- First name changes
- Last name changes
- Full name changes
- Creator type changes
- Creator additions/removals

✅ **Maintains debounce:** Still waits 300ms for user to finish typing

✅ **No performance impact:** Simple string comparison

✅ **Backward compatible:** No breaking changes

## Testing

The system now correctly refreshes when:
1. Adding/removing creators (count change)
2. Editing first name (content change)
3. Editing last name (content change)
4. Changing creator type (content change)

## Technical Details

- Signature stored as `container._creatorSignature`
- Signature format: `lastName|firstName|name|typeID;...`
- Logged as: `[CNE] Creator names/types changed (count unchanged: N)`