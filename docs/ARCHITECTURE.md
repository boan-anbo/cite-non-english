# CJK Citation Plugin - Architecture & Design Decisions

## Overview

This document explains the core architecture and design decisions for the CJK Citation Plugin for Zotero. It covers how we solve the fundamental challenges of handling Chinese, Japanese, and Korean (CJK) citations in academic bibliographies.

## The Problem

Academic citation styles (especially Chicago Manual of Style) require special handling for CJK sources:

1. **Multiple script variants needed:**
   - Original script (汉字, 漢字, かな, 한글)
   - English translation
   - Romanization (Pinyin, Wade-Giles, Romaji, etc.)

2. **Zotero's standard fields don't support variants:**
   - Each field (title, publisher, etc.) has only one value
   - No native way to store multiple versions of the same field

3. **Citation styles need to access variant data:**
   - Chicago style requires specific formatting for non-English sources
   - Need consistent way to expose CJK data to CSL (Citation Style Language)

## Our Solution

### Data Storage Strategy

**Store CJK metadata in Zotero's Extra field using a namespaced format:**

```
cite-cjk.title-original: 日本仏教綜合研究
cite-cjk.title-english: Japanese Buddhist Comprehensive Research
cite-cjk.title-romanized: Nihon Bukkyō Sōgō Kenkyū
cite-cjk.publisher-original: 平凡社
cite-cjk.publisher-romanized: Heibonsha
cite-cjk.original-language: ja-JP
```

**Advantages:**
- ✅ Non-invasive (doesn't modify Zotero's core data structure)
- ✅ Preserved during export/import
- ✅ Compatible with Better BibTeX and other plugins
- ✅ Human-readable and debuggable
- ✅ Can coexist with other Extra field metadata

### Language Detection & Processing Logic

Our plugin follows a two-stage detection logic:

#### Stage 1: Language Field Check

```
IF item.language == "en" OR "en-US" OR "en-GB"
  → Skip CJK processing entirely
  → Use standard Zotero fields as-is
```

**Rationale:** English sources don't need CJK variant handling.

#### Stage 2: CJK Data Check

```
IF item.language != English OR item.language == empty
  → Check if cite-cjk.* fields exist in Extra
  → IF CJK fields exist:
      → Apply CJK citation formatting
    ELSE:
      → Use standard citation formatting
```

**Rationale:**
- Non-English items might have CJK data
- Empty language field might indicate legacy items that need CJK handling
- Presence of CJK data is the definitive indicator

### User Input Requirements

When users populate CJK fields via our plugin UI, we require:

1. **At least one variant** (original, English, or romanized) for each field
2. **Original language specification** (zh-CN, zh-TW, ja-JP, ko-KR, etc.)

The language code serves dual purposes:
- Prevents Zotero from applying English title-casing rules
- Enables CSL to apply language-specific formatting

## CSL Integration: Two Possible Paths

### Path A: Use Official Chicago CSL (Preferred)

**Strategy:** Map our Extra field data to CSL-accessible variables

**If Chicago CSL already supports CJK fields:**
- We transform `cite-cjk.*` data into fields that Chicago CSL expects
- Leverage existing Chicago formatting logic
- Maximum compatibility with standard workflows

**Implementation:**
```javascript
// Convert Extra field data to CSL variables
function prepareCslItem(item) {
  const cjkData = parseExtraField(item.extra);

  // Map to CSL-accessible fields
  return {
    ...item,
    'title-original': cjkData.title.original,
    'title-romanized': cjkData.title.romanized,
    // etc.
  };
}
```

**Advantages:**
- ✅ Users can use official Chicago style without modification
- ✅ Works with standard CSL processors
- ✅ Updates to Chicago style are automatically inherited
- ✅ Better compatibility with other tools

**Challenges:**
- Need to verify which CSL variables Chicago actually supports
- May require CSL processor hooks/extensions
- Limited control over formatting details

### Path B: Custom Modified Chicago CSL

**Strategy:** Fork Chicago CSL and modify it to read our Extra field format directly

**Implementation:**
```xml
<!-- Custom CSL that reads from cite-cjk namespace -->
<macro name="title-with-cjk">
  <choose>
    <if variable="cite-cjk.title-original">
      <group delimiter=" ">
        <text variable="cite-cjk.title-original"/>
        <text variable="cite-cjk.title-romanized" prefix="(" suffix=")"/>
        <text variable="cite-cjk.title-english" prefix="[" suffix="]"/>
      </group>
    </if>
    <else>
      <text variable="title"/>
    </else>
  </choose>
</macro>
```

**Advantages:**
- ✅ Complete control over formatting
- ✅ Can directly reference our Extra field format
- ✅ More flexibility for custom CJK citation requirements
- ✅ Can optimize for CJK-specific use cases

**Challenges:**
- ⚠️ Users must install our custom CSL style
- ⚠️ Need to manually merge updates from official Chicago
- ⚠️ Additional maintenance burden
- ⚠️ Less compatible with standard workflows

### Recommendation

**Start with Path A, fallback to Path B if needed:**

1. First investigate if Chicago CSL can be extended via standard CSL variables
2. If yes → Use Path A for maximum compatibility
3. If no → Provide Path B as an optional "enhanced" mode
4. Ideally support both: users choose based on their needs

## Technical Architecture

### Module Structure

```
src/modules/cjk/
├── types.ts              # TypeScript type definitions
├── constants.ts          # Field configurations, namespace
├── model/
│   ├── CjkMetadata.ts       # Data model (single source of truth)
│   └── extraFieldParser.ts  # Parse/serialize Extra field
├── ui/
│   ├── components.ts        # Reusable UI elements
│   └── fieldBuilder.ts      # Field composition
├── section/
│   ├── register.ts          # ItemPane registration
│   └── renderer.ts          # Rendering & data binding
└── csl/                  # (Future) CSL integration
    ├── exporter.ts          # Export CJK data to CSL
    └── transformer.ts       # Transform Extra → CSL variables
```

### Data Flow

```
User Input (UI)
    ↓
CjkMetadata Model
    ↓
Extra Field Parser
    ↓
Zotero Item Extra Field
    ↓
CSL Processor
    ↓
Formatted Citation
```

### Key Design Principles

1. **Single Source of Truth**
   - CjkMetadata class is the authoritative data model
   - All UI and storage operations go through this model
   - Prevents data inconsistency

2. **Non-invasive Integration**
   - Don't modify Zotero core fields
   - Use Extra field as extension point
   - Preserve compatibility with other plugins

3. **Graceful Degradation**
   - Items without CJK data work normally
   - Plugin can be disabled without breaking citations
   - Extra field remains human-readable

4. **Progressive Enhancement**
   - Start with basic data storage and UI
   - Add CSL integration incrementally
   - Eventually support advanced features (auto-romanization, etc.)

## Workflow Example

### Scenario: User adds a Japanese book

1. **User creates item in Zotero:**
   ```
   Title: 日本仏教綜合研究
   Language: [empty]
   ```

2. **User opens CJK Citation Fields section:**
   - Selects language: `ja-JP`
   - Enters original title: `日本仏教綜合研究`
   - Enters romanized title: `Nihon Bukkyō Sōgō Kenkyū`
   - Enters English title: `Japanese Buddhist Comprehensive Research`

3. **Plugin saves to Extra field:**
   ```
   cite-cjk.original-language: ja-JP
   cite-cjk.title-original: 日本仏教綜合研究
   cite-cjk.title-romanized: Nihon Bukkyō Sōgō Kenkyū
   cite-cjk.title-english: Japanese Buddhist Comprehensive Research
   ```

4. **Plugin updates Zotero language field:**
   ```
   Language: ja-JP
   ```
   (This prevents automatic English title-casing)

5. **User generates bibliography:**
   - CSL processor reads language field: `ja-JP`
   - CSL processor reads CJK fields (via Path A or Path B)
   - Formats citation with proper CJK variants:
     ```
     日本仏教綜合研究 (Nihon Bukkyō Sōgō Kenkyū) [Japanese Buddhist
     Comprehensive Research]. Tokyo: Heibonsha, 1990.
     ```

## Future Enhancements

### Phase 1: Core Functionality (Current)
- ✅ Data storage in Extra field
- ✅ UI for entering CJK variants
- ✅ Real-time sync with Zotero

### Phase 2: CSL Integration
- 🔄 Investigate Chicago CSL support for CJK
- 🔄 Implement Path A or Path B (or both)
- 🔄 Testing with multiple citation styles

### Phase 3: Advanced Features
- ⏳ Auto-romanization (Pinyin, Romaji generation)
- ⏳ Language detection from original text
- ⏳ Batch import/export
- ⏳ Integration with Better BibTeX
- ⏳ Support for more citation styles (APA, MLA)

### Phase 4: Polish & Distribution
- ⏳ Comprehensive documentation
- ⏳ User guides in English, Chinese, Japanese, Korean
- ⏳ Submit to Zotero plugin directory
- ⏳ Community feedback and iteration

## Decision Log

### Why Extra Field Instead of Custom Database Fields?

**Considered:**
- Creating custom database fields in Zotero
- Using item tags or notes

**Decision:** Extra field

**Reasoning:**
- Extra field is explicitly designed for extension
- Preserved during export/import (critical for data portability)
- No need to modify Zotero database schema
- Better BibTeX already uses Extra field extensively
- Human-readable for debugging

### Why Namespace Pattern (cite-cjk.*)?

**Considered:**
- Plain keys: `title-original: 日本仏教綜合研究`
- Different separators: `cite_cjk/title/original`

**Decision:** `cite-cjk.field-variant` format

**Reasoning:**
- Prevents conflicts with other plugins
- Follows Better BibTeX convention
- Dot notation is standard in programming
- Easy to parse with regex
- Clear ownership/scope

### Why Require Language Field?

**Considered:**
- Auto-detect language from Unicode ranges
- Make language field optional

**Decision:** Require explicit language specification

**Reasoning:**
- Language detection is unreliable (especially zh-CN vs zh-TW)
- Language field prevents title-casing issues
- CSL needs language for proper formatting
- Explicit is better than implicit
- User knows the source language better than any algorithm

## Related Documentation

- [Zotero Title Casing](./references/zotero-title-casing.md) - How language field affects formatting
- [Development Guide](./DEVELOPMENT.md) - Setup and development workflow
- [UI Best Practices](./UI_BEST_PRACTICES.md) - Zotero 7 UI patterns

## Open Questions

### 1. Chicago CSL Capabilities

**Question:** Does the official Chicago CSL already support multiple title variants?

**Next Steps:**
- Review Chicago CSL source code
- Test with sample items
- Document findings in references folder

### 2. CSL Processor Extension Points

**Question:** Can we hook into CSL processor to provide custom variables?

**Next Steps:**
- Research Zotero's CSL processor implementation
- Check if Better BibTeX provides examples
- Test feasibility of Path A

### 3. Better BibTeX Compatibility

**Question:** How does Better BibTeX handle Extra field data?

**Next Steps:**
- Review Better BibTeX documentation
- Test export/import with CJK fields
- Ensure no conflicts with Better BibTeX patterns

## Summary

Our architecture balances:
- **Compatibility:** Works with standard Zotero workflows
- **Extensibility:** Clean APIs for future enhancements
- **Usability:** Simple UI with smart defaults
- **Flexibility:** Multiple CSL integration paths
- **Maintainability:** Well-documented, modular code

The two-path CSL strategy gives us flexibility: start with maximum compatibility (Path A), add power-user features if needed (Path B).
