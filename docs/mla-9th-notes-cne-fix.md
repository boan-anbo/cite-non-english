# MLA 9th Edition Notes CNE Title Fix

## Problem
The MLA 9th edition notes variant wasn't displaying romanized titles and English translations for non-English sources, while both MLA 8th and MLA 9th in-text versions worked correctly.

### Expected Output (like MLA 8th & 9th in-text):
```
Hao Chunwen. Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo 唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song]. Zhongguo shehui kexue chubanshe, 1998.
```

### Actual Output (MLA 9th notes - before fix):
```
Hao Chunwen 郝春文. 唐后期五代宋初敦煌僧尼的社会生活. 中国社会科学出版社, 1998.
```

## Root Cause
The MLA 9th notes CSL template was missing CNE macros for title handling. The plugin's CNE-CONFIG only controls multi-slot rendering for creator names, while title formatting must be handled through CSL macros.

## Solution

### 1. Added CNE Macros
Added the following macros to `modern-language-association-9th-notes-cne.csl`:
- `cne-title-select` - Selects romanized title if available, otherwise original
- `cne-title-supplements` - Adds original script and English translation
- `cne-container-title-select` - Handles container/journal titles
- `cne-container-title-supplements` - Adds container title supplements
- `cne-publisher-select` - Handles publisher names

### 2. Updated Title Output
Modified the `title-primary` macro to use CNE macros for all title types:
```xml
<group delimiter=" ">
  <text font-style="italic" text-case="title" macro="cne-title-select"/>
  <text macro="cne-title-supplements"/>
</group>
```

### 3. Followed Variant Builder Workflow
1. Edited `styles/development/modern-language-association-9th-notes-cne.csl`
2. Generated diff with `make diffs`
3. Built final variant with `make final`
4. Copied to production: `cp output/.../modern-language-association-9th-notes-cne.csl cne/`

## Files Modified
- `styles/development/modern-language-association-9th-notes-cne.csl` - Added CNE macros
- `styles/diffs/modern-language-association-9th-notes-cne.diff` - Updated diff
- `styles/cne/modern-language-association-9th-notes-cne.csl` - Production style

## Testing
The fix ensures MLA 9th notes now properly displays:
- Romanized titles
- Original script titles
- English translations in brackets

This brings MLA 9th notes in line with other working CNE variants (MLA 8th, MLA 9th in-text).

## Note on Architecture
This confirms that CNE title support must be implemented at the CSL template level, not through the plugin's CNE-CONFIG mechanism which only handles creator names through citeproc's multi-slot infrastructure.