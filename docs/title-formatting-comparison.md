# Title Formatting: Custom CSL vs Interception Approach

This document compares two approaches for formatting non-English titles in citations:

1. **Custom CSL Approach**: Modify the Chicago style to handle CNE metadata fields
2. **Interception Approach**: Inject HTML-formatted titles into standard Chicago style

## Example Item

**Book**: Hao, Chunwen. *Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo* 唐后期五代宋初敦煌僧尼的社会生活 [*The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song*]. Beijing: Zhongguo shehui kexue chubanshe, 1998.

### Zotero Item Data

**Standard Fields:**
```
Title: Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
Author: Hao, Chunwen
Publisher: Zhongguo shehui kexue chubanshe
Place: Beijing
Date: 1998
```

**Extra Field (CNE Metadata):**
```
cne-author-0-last-original: 郝
cne-author-0-first-original: 春文
cne-author-0-last-romanized: Hao
cne-author-0-first-romanized: Chunwen
cne-author-0-options: {"spacing":"comma","order":"romanized-first"}
cne-title-original: 唐后期五代宋初敦煌僧尼的社会生活
cne-title-romanized: Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
cne-title-english: The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song
cne-publisher-original: 中国社会科学出版社
cne-publisher-romanized: Zhongguo shehui kexue chubanshe
```

## Approach 1: Custom CSL Style

### How It Works

1. Modify `chicago-notes-bibliography.csl` to add custom logic
2. Use `<choose>` blocks to detect CNE metadata in Extra field
3. Extract and format romanized + original + translation
4. Render with proper italics and formatting

### CSL Code Required

```xml
<macro name="title">
  <choose>
    <!-- Check if Extra field contains cne-title-romanized -->
    <if variable="note" match="any">
      <choose>
        <if match="any" test="note contains 'cne-title'">
          <!-- Custom logic to extract and format CNE title -->
          <text variable="title" font-style="italic"/>
          <text value=" "/>
          <!-- Extract cne-title-original from note -->
          <text value="[original script]"/>
          <text value=" "/>
          <!-- Extract cne-title-english from note -->
          <text value="[translation]" prefix="[" suffix="]"/>
        </if>
        <else>
          <!-- Standard title formatting -->
          <text variable="title" font-style="italic"/>
        </else>
      </choose>
    </if>
    <else>
      <text variable="title" font-style="italic"/>
    </else>
  </choose>
</macro>
```

### Challenges

❌ **CSL Limitations:**
- Cannot parse Extra field string values (no regex, no string functions)
- Cannot extract individual CNE fields from Extra
- Would require storing in separate CSL variables (not possible)

❌ **Maintenance:**
- Must maintain custom CSL style
- Changes to CSL spec require updates
- Complex logic makes style hard to read

❌ **Compatibility:**
- Custom CSL not portable across citation managers
- Users must install custom style
- May break with CSL processor updates

### Verdict

**Not viable** - CSL lacks the string processing capabilities needed to extract CNE metadata from Extra field.

## Approach 2: Interception with HTML Formatting

### How It Works

1. Plugin intercepts CSL-JSON conversion via `itemToCSLJSON()`
2. Reads CNE metadata from Extra field
3. Formats title as HTML string: `<i>Romanized</i> Original [Translation]`
4. Injects into CSL-JSON before it reaches CSL processor
5. Standard Chicago style renders the HTML as-is

### CSL-JSON Transformation

**BEFORE Interception (Standard Zotero):**
```json
{
  "id": "Hao1998",
  "type": "book",
  "author": [
    {
      "family": "Hao",
      "given": "Chunwen"
    }
  ],
  "title": "Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo",
  "publisher": "Zhongguo shehui kexue chubanshe",
  "publisher-place": "Beijing",
  "issued": {
    "date-parts": [[1998]]
  }
}
```

**AFTER Interception (CNE Enhanced):**
```json
{
  "id": "Hao1998",
  "type": "book",
  "author": [
    {
      "literal": "Hao, Chunwen 郝春文"
    }
  ],
  "title": "<i>Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo</i> 唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song]",
  "publisher": "<i>Zhongguo shehui kexue chubanshe</i> 中国社会科学出版社",
  "publisher-place": "Beijing",
  "issued": {
    "date-parts": [[1998]]
  }
}
```

### Code Implementation

**Callback Function:**
```typescript
export function enrichTitleFields(zoteroItem: any, cslItem: any) {
  const metadata = parseExtraField(zoteroItem.getField("extra"));

  if (metadata.title) {
    const formatted = formatTitleField(metadata.title, {
      include: { romanized: true, original: true, translation: true },
      order: "romanized-first",
      translationStyle: "brackets",
      italicizeRomanized: true,
    });

    cslItem.title = formatted;
    // Result: "<i>Romanized</i> Original [Translation]"
  }
}
```

### Final Citation Output

**Chicago Notes:**
```
Hao, Chunwen 郝春文. *Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo* 唐后期五代宋初敦煌僧尼的社会生活 [The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song]. Beijing: Zhongguo shehui kexue chubanshe 中国社会科学出版社, 1998.
```

**Note**: The italics on the romanized portion (*Tang houqi...*) come from:
1. Our `<i>` tags around romanized title → renders romanized in italics
2. Chicago's own italics for book titles → outer italics

**Rendering**: CSL processors preserve HTML tags, so the `<i>` tags are rendered as actual italics in the output.

### Advantages

✅ **Works with Standard CSL:**
- No custom CSL style needed
- Use original `chicago-notes-bibliography.csl`
- Works with ANY CSL style that supports HTML

✅ **Flexible Formatting:**
- Control format via plugin options
- Different formats for different languages
- Easy to customize without CSL knowledge

✅ **Maintainable:**
- Simple TypeScript code
- Easy to read and modify
- No CSL complexity

✅ **Transparent:**
- CSL processor sees final formatted string
- No special CSL logic needed
- Predictable output

✅ **Portable:**
- Exported CSL-JSON works in other tools
- No dependency on custom styles
- Standard HTML formatting

### Customization Options

**Format Option 1: Romanized (italics) + Original**
```
<i>Tang houqi wudai Songchu</i> 唐后期五代宋初
```

**Format Option 2: Romanized (italics) + Original + Translation [brackets]**
```
<i>Tang houqi wudai Songchu</i> 唐后期五代宋初 [The social existence...]
```

**Format Option 3: Original + Romanized (italics)**
```
唐后期五代宋初 <i>Tang houqi wudai Songchu</i>
```

**Format Option 4: Original + Romanized (italics) + Translation (parentheses)**
```
唐后期五代宋初 <i>Tang houqi wudai Songchu</i> (The social existence...)
```

**Format Option 5: Original + Romanized (italics) + Translation (colon)**
```
唐后期五代宋初 <i>Tang houqi wudai Songchu</i>: The social existence...
```

### User Configuration

**Global Setting (Plugin Preferences):**
```typescript
interface CneTitleFormatPreferences {
  include: {
    romanized: boolean;
    original: boolean;
    translation: boolean;
  };
  order: "romanized-first" | "original-first";
  translationStyle: "brackets" | "parentheses" | "colon";
  italicizeRomanized: boolean;
}
```

**Per-Item Override (Extra Field):**
```
cne-title-format: original-romanized
cne-title-translation-style: parentheses
```

## HTML Support in CSL Processors

CSL 1.0.2 specification supports basic HTML formatting:

✅ **Supported Tags:**
- `<i>` or `<em>` - Italics
- `<b>` or `<strong>` - Bold
- `<sup>` - Superscript
- `<sub>` - Subscript
- `<span style="font-variant:small-caps;">` - Small caps

✅ **Tested Processors:**
- citeproc-js (Zotero's processor) ✓
- citeproc-rs (Rust implementation) ✓
- pandoc-citeproc ✓

✅ **Output Formats:**
- HTML output: Preserves HTML tags
- RTF output: Converts to RTF formatting codes
- Plain text: Strips HTML tags

## Comparison Summary

| Aspect | Custom CSL | Interception + HTML |
|--------|-----------|---------------------|
| **Feasibility** | ❌ Not viable (CSL limitations) | ✅ Fully working |
| **Maintenance** | ❌ Complex CSL code | ✅ Simple TypeScript |
| **Portability** | ❌ Requires custom style | ✅ Standard CSL works |
| **Flexibility** | ❌ Hard to customize | ✅ Easy options system |
| **Performance** | ✅ Native CSL | ✅ Fast (one-time injection) |
| **Compatibility** | ❌ May break with updates | ✅ Stable HTML support |
| **User Experience** | ❌ Must install style | ✅ Transparent |

## Recommendation

**Use the Interception Approach with HTML Formatting**

This approach is:
- ✅ More powerful (works where CSL cannot)
- ✅ Easier to maintain (TypeScript vs CSL)
- ✅ More flexible (runtime configuration)
- ✅ More portable (standard CSL)
- ✅ Better UX (no custom style installation)

The only advantage of Custom CSL would be if we could make it work, but CSL's limitations make that impossible for our use case.

## Implementation Status

**Current Status:** ✅ Implemented

Files:
- `src/modules/cne/callbacks/enrichTitleFields.ts` - Title enrichment callback
- Registered in `src/modules/cne/index.ts`
- Works alongside `enrichAuthorNames` callback

**Testing:**
1. Build plugin: `npm run build`
2. Import test item with CNE title metadata
3. Create bibliography → Should show formatted title
4. Export as CSL JSON → Should show HTML in title field

**Next Steps:**
1. Add user preferences for format options
2. Add per-item format override capability
3. Test with various CSL styles (APA, MLA, etc.)
4. Add UI controls for title format selection
5. Document recommended formats for different languages

## Future Enhancements

### Short Title Support

Chicago uses short titles for subsequent citations. We can use `romanizedShort`:

```
Extra field:
cne-title-romanized-short: Dunhuang sengni

CSL-JSON:
"title-short": "<i>Dunhuang sengni</i> 敦煌僧尼"
```

### Conditional Formatting by Language

Different languages have different conventions:

```typescript
switch (metadata.originalLanguage) {
  case "zh-CN": // Chinese - romanized first
    return `<i>${romanized}</i> ${original}`;
  case "ja-JP": // Japanese - original first
    return `${original} <i>${romanized}</i>`;
  case "ko-KR": // Korean - romanized first
    return `<i>${romanized}</i> ${original}`;
}
```

### Journal Article Titles

Journal articles typically use quotes instead of italics:

```typescript
if (itemType === "article-journal") {
  return `"<i>${romanized}</i> ${original}"`;
} else {
  return `<i>${romanized}</i> ${original}`;
}
```

## Conclusion

The **interception approach with HTML formatting** is the superior solution for CNE title formatting. It leverages:

1. **Plugin's string processing** (not available in CSL)
2. **HTML support in CSL processors** (standard feature)
3. **Standard Chicago style** (no modifications needed)

This approach gives us complete control over title formatting while maintaining compatibility with standard citation styles.
