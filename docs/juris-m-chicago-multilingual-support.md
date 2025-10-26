# How Juris-M Supports Chicago Style with Multilingual Citations

## Overview

Based on the research of Juris-M's codebase, here's how the system handles multilingual citations for Chicago style (and any other CSL style).

## The Three-Slot System

Juris-M uses a **three-slot rendering system** for multilingual content:

1. **Primary slot** - Original language
2. **Secondary slot** - Romanization/Transliteration
3. **Tertiary slot** - Translation

## How It Works for Chicago Style

### 1. Data Entry

When a user enters a Chinese book in Juris-M:

```
Title (original): 环境政策的经济分析
Title (romanized): Kankyō seisaku no keizai bunseki
Title (translated): Economic Analysis of Environmental Policy

Author (original): 王明
Author (romanized): Wang Ming
```

### 2. Configuration via cite-lang-prefs

Juris-M allows configuration of which variants appear:

```javascript
// Default configuration
state.opt['cite-lang-prefs'] = {
    persons: ['orig'],           // Only original names
    titles: ['orig'],            // Only original titles
    publishers: ['orig'],        // Only original publishers
    places: ['orig']            // Only original places
};

// For multilingual Chicago style, user might configure:
state.opt['cite-lang-prefs'] = {
    persons: ['orig', 'translit'],      // Original + romanized
    titles: ['orig', 'translit'],       // Original + romanized
    publishers: ['orig'],                // Original only
    places: ['orig', 'translat']        // Original + translated
};
```

### 3. Automatic Affix Application

Juris-M automatically adds formatting around secondary/tertiary content:

```javascript
// From citeproc.js lines 5020-5050
CSL.Engine.prototype.setLangPrefsForCiteAffixes = function (affixList) {
    // Sets prefix/suffix for each locale type
    // Default is empty strings, but can be configured
}

// In practice, when rendering:
if (slot.secondary) {
    secondary_tok.strings.prefix = " [";  // Space + opening bracket
    secondary_tok.strings.suffix = "]";   // Closing bracket
}

if (slot.tertiary) {
    tertiary_tok.strings.prefix = " (";   // Space + opening parenthesis
    tertiary_tok.strings.suffix = ")";    // Closing parenthesis
}
```

### 4. The Actual Output

For a Chinese book with author "王明" (Wang Ming):

**Chicago Author-Date:**
```
Wang Ming [王明]. 2024. 环境政策的经济分析 [Kankyō seisaku no keizai bunseki]. Beijing:
Economic Press.
```

**Chicago Notes-Bibliography:**
```
Wang Ming [王明]. 环境政策的经济分析 [Kankyō seisaku no keizai bunseki] (Economic Analysis
of Environmental Policy). Beijing: Economic Press, 2024.
```

## Key Implementation Details

### 1. Slot Assignment Logic

From citeproc.js lines 13371-13384:

```javascript
var slot = {primary:'locale-orig', secondary:false, tertiary:false};
if (localesets) {
    var slotnames = ["primary", "secondary", "tertiary"];
    for (var k = 0; k < slotnames.length; k++) {
        if (localesets.length - 1 < k) {
            break;
        }
        if (localesets[k]) {
            slot[slotnames[k]] = 'locale-' + localesets[k];
        }
    }
}
```

### 2. Conditional Rendering Based on Citation Type

Secondary and tertiary slots are **only rendered in**:
- Bibliography entries
- Note-style citations (first occurrence)

They are **suppressed in**:
- In-text citations (after first occurrence)
- Subsequent notes

Code from lines 13385-13391:
```javascript
if (this.state.tmp.area !== "bibliography"
    && !(this.state.tmp.area === "citation"
         && this.state.opt.xclass === "note"
         && this.item && !this.item.position)) {

    slot.secondary = false;
    slot.tertiary = false;
}
```

### 3. Default Formatting (No Brackets)

By default, the affixes are **empty strings**:

```javascript
// From line 6358-6443
this.citeAffixes = {
    titles:{
        "locale-orig":{ prefix:"", suffix:"" },
        "locale-translit":{ prefix:"", suffix:"" },
        "locale-translat":{ prefix:"", suffix:"" }
    }
    // ... similar for persons, institutions, etc.
};
```

The space + brackets/parentheses are added **dynamically** during rendering:

```javascript
// Lines 13698-13703
if (slot.secondary) {
    secondary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.secondary].prefix;
    secondary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.secondary].suffix;
    // Add a space if empty
    if (!secondary_tok.strings.prefix) {
        secondary_tok.strings.prefix = " ";  // This adds the space before romanization
    }
}
```

## How Chicago Style "Just Works"

Frank Bennett's claim about "arbitrary styles" means:

1. **Standard Chicago CSL doesn't need modification** - It just uses `<text variable="title"/>` and `<names variable="author"/>`

2. **Juris-M automatically injects multilingual variants** - The citeproc engine intercepts these variables and adds secondary/tertiary slots

3. **No special CSL syntax required** - Unlike CNE which needs `<text variable="title-original"/>` and `<text variable="title-romanized"/>`

## Example: Standard Chicago CSL

```xml
<!-- Standard Chicago CSL -->
<bibliography>
  <layout>
    <names variable="author">
      <name name-as-sort-order="first"/>
    </names>
    <text variable="title" font-style="italic"/>
    <text variable="publisher-place" prefix=". "/>
    <text variable="publisher" prefix=": "/>
    <date variable="issued" prefix=", ">
      <date-part name="year"/>
    </date>
  </layout>
</bibliography>
```

With Juris-M's multilingual data, this **automatically produces**:

```
Wang Ming [王明]. 环境政策的经济分析 [Kankyō seisaku no keizai bunseki]. Beijing: Economic Press, 2024.
```

## The CSL locale Attribute (Alternative Approach)

Juris-M also supports language-specific layouts:

```xml
<style>
  <bibliography>
    <!-- Default layout -->
    <layout>
      <text variable="title"/>
    </layout>

    <!-- Special layout for Chinese/Japanese -->
    <layout locale="zh ja">
      <text variable="title"/>
      <text variable="title" form="romanized" prefix=" [" suffix="]"/>
      <text variable="title" form="translated" prefix=" (" suffix=")"/>
    </layout>
  </bibliography>
</style>
```

But this is **optional** - the automatic injection works without it.

## Why CNE Cannot Do This

### 1. No Access to Internal Slots

CNE cannot:
- Populate `multi.main` and `multi._keys` structures
- Hook into the citeproc rendering pipeline
- Automatically inject secondary/tertiary content

### 2. Must Use Different Approach

CNE must:
- Store data in Extra field: `title-romanized: Kankyō seisaku...`
- Modify CSL styles to explicitly reference CNE fields
- Manually construct the bracketed format

### 3. CNE's Required CSL Modification

```xml
<!-- CNE-modified Chicago -->
<text variable="title-original"/>
<group prefix=" [" suffix="]">
  <text variable="title-romanized"/>
</group>
<group prefix=" (" suffix=")">
  <text variable="title-translated"/>
</group>
```

## Summary

Juris-M's support for Chicago style with multilingual citations works through:

1. **Native UI** for entering multilingual data
2. **Automatic slot assignment** based on cite-lang-prefs configuration
3. **Dynamic affix injection** (spaces, brackets, parentheses)
4. **Conditional rendering** based on citation context
5. **No CSL modification required** for basic multilingual support

The key insight: **Juris-M modifies the rendering engine, not the styles**. This is why Frank Bennett can claim it works with "arbitrary styles" - the multilingual magic happens in the citeproc processor, not in the CSL files themselves.