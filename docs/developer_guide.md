# CNE Developer Guide

**Version:** 3.0
**Last Updated:** 2025-10-25

## Overview

CNE (Cite Non-English) enables proper citation of non-English sources in Zotero by displaying romanized forms, original script, and English translations in parallel.

## Architecture

CNE consists of three layers:

1. **CSL Styles** - Modified citation styles with CNE macros
2. **Zotero Plugin** - Data extraction and citeproc configuration
3. **Citeproc Integration** - Hooks to maintain multi-slot rendering

## CSL Style Development

### Directory Structure

```
styles/
├── templates/         # Base upstream templates
├── diffs/            # SOURCE OF TRUTH for CNE modifications
├── development/      # Generated (template + diff)
├── output/           # Final variants with macro pruning
├── cne/              # Production files
└── Makefile          # Build automation
```

### Workflow

**1. Edit Development File**

```bash
vim styles/development/modern-language-association-9th-notes-cne.csl
```

**2. Regenerate Diffs**

```bash
cd styles && make diffs
```

**3. Build Final Styles**

```bash
make final
```

**4. Copy to Production**

```bash
cp output/modern-language-association-notes/modern-language-association-9th-notes-cne.csl cne/
```

### The 7 CNE Macros

Every CNE style includes these helper macros:

#### Title Macros

```xml
<macro name="cne-title-select">
  <choose>
    <if variable="cne-title-romanized">
      <text variable="cne-title-romanized"/>
    </if>
    <else>
      <text variable="title"/>
    </else>
  </choose>
</macro>

<macro name="cne-title-supplements">
  <choose>
    <if variable="cne-title-romanized">
      <group delimiter=" ">
        <text variable="cne-title-original"/>
        <text prefix="[" suffix="]" variable="cne-title-english"/>
      </group>
    </if>
  </choose>
</macro>
```

#### Container Title Macros

```xml
<macro name="cne-container-title-select">
  <choose>
    <if variable="cne-container-title-romanized">
      <text variable="cne-container-title-romanized"/>
    </if>
    <else-if variable="cne-journal-romanized">
      <text variable="cne-journal-romanized"/>
    </else-if>
    <else>
      <text variable="container-title"/>
    </else>
  </choose>
</macro>

<macro name="cne-container-title-supplements">
  <choose>
    <if variable="cne-container-title-romanized">
      <group delimiter=" ">
        <text variable="cne-container-title-original"/>
        <text prefix="[" suffix="]" variable="cne-container-title-english"/>
      </group>
    </if>
    <else-if variable="cne-journal-romanized">
      <text variable="cne-journal-original"/>
    </else-if>
  </choose>
</macro>
```

#### Publisher Macro

```xml
<macro name="cne-publisher-select">
  <choose>
    <if variable="cne-publisher-romanized">
      <text variable="cne-publisher-romanized"/>
    </if>
    <else>
      <text variable="publisher"/>
    </else>
  </choose>
</macro>
```

Plus short form variants: `cne-title-select-short` and `cne-container-title-select-short`.

### CNE-CONFIG Metadata

Styles declare their multi-slot preferences in the `<summary>` element:

```xml
<summary>Chicago-style source citations with CNE support
CNE-CONFIG: {"persons":["translit","orig"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"space"}}}</summary>
```

**Configuration Options:**

- `persons`: Display slots for names (`["translit","orig"]` or `["translit"]`)
- `nameFormatting.romanizedCJK.separator`:
  - `"space"` - Asian format: "Hao Chunwen" (Chicago)
  - `"comma"` - Western format: "Hao, C." (APA)

**Examples:**

```json
// Chicago Style
{"persons":["translit","orig"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"space"}}}

// APA Style
{"persons":["translit"],"nameFormatting":{"romanizedCJK":{"order":"last-name-first","separator":"comma"}}}
```

## Citeproc Integration

### The Challenge

Citeproc-js internally resets `cite-lang-prefs` during processing, overwriting our CNE configuration. The Style Editor would show only native names despite our wrapper.

### The Solution: Hook Installation

We patch citeproc's `setLangPrefsForCites()` to maintain CNE preferences:

```typescript
export function installCneLangPrefPatch(): void {
  if (typeof CSL !== 'undefined' && CSL?.Engine && !originalJsSetLangPrefs) {
    originalJsSetLangPrefs = CSL.Engine.prototype.setLangPrefsForCites;
    CSL.Engine.prototype.setLangPrefsForCites = function (obj: any, conv?: any) {
      originalJsSetLangPrefs!.call(this, obj, conv);
      try {
        (this as any)._cneLangOverride?.();
      } catch (err) {
        Zotero?.debug?.('[CNE Config] Error in JS lang override: ' + err);
      }
    };
  }
}
```

### Engine Configuration

```typescript
export function configureCiteprocForCNE(engine: any, config: CNEConfigOptions): void {
  installCneLangPrefPatch();
  const persons = config?.persons ?? ['translit'];

  engine._cneLangOverride = () => {
    enforcePersonsArray(engine.opt?.['cite-lang-prefs'], persons);
    enforcePersonsArray(engine.state?.opt?.['cite-lang-prefs'], persons);
  };

  engine.setLangPrefsForCites({ persons });
  engine._cneLangOverride?.();
}
```

### GetCiteProc Interceptor

```typescript
export class GetCiteProcInterceptor {
  static intercept() {
    const ZoteroStyle = (Zotero as any).Style;
    this.originalGetCiteProc = ZoteroStyle.prototype.getCiteProc;

    ZoteroStyle.prototype.getCiteProc = function (...args: any[]) {
      const engine = self.originalGetCiteProc.call(this, ...args);
      if (!(engine as any)._cneConfigured) {
        const cneConfig = extractCNEConfigFromStyle(this);
        if (cneConfig) configureCiteprocForCNE(engine, cneConfig);
        (engine as any)._cneConfigured = true;
      }
      return engine;
    };
  }
}
```

## Quick Reference

### Naming Conventions

**Zotero Extra Fields (kebab-case):**

- `cne-title-romanized`, `cne-title-original`, `cne-title-english`
- `cne-container-title-romanized`, `cne-journal-romanized`
- `cne-author-0-last-romanized`, `cne-author-0-first-original`
- `cne-publisher-romanized`

**CSL Macros (cne-{element}-{action}):**

- Selection: `cne-title-select`, `cne-container-title-select`
- Supplements: `cne-title-supplements`, `cne-container-title-supplements`

### Common Patterns

**Bibliography Entry:**

```xml
<group delimiter=" ">
  <text macro="title-primary"/>  <!-- Uses cne-title-select internally -->
  <text macro="cne-title-supplements"/>
</group>
```

**Container Title with Formatting:**

```xml
<group delimiter=" ">
  <text font-style="italic" macro="cne-container-title-select"/>
  <text macro="cne-container-title-supplements"/>
</group>
```

### Build Commands

```bash
# Development workflow
cd styles
make diffs              # Regenerate diff files
make final              # Build production styles
make final-flat         # Build without grouping

# Copy to production
cp output/style-family/style-name-cne.csl cne/

# Test
npm test
```

### Testing Checklist

- [ ] All 7 CNE macros present
- [ ] Title displays use `cne-title-select` + supplements
- [ ] Container titles use `cne-container-title-select` + supplements
- [ ] Publisher uses `cne-publisher-select`
- [ ] Metadata includes CNE-CONFIG
- [ ] Tests pass for Chinese, Japanese, Korean materials
- [ ] Bibliography and notes/citations format correctly

## File Locations

**Style Development:**

- `/styles/development/` - Edit CSL files here
- `/styles/diffs/` - Generated patches (source of truth)
- `/styles/cne/` - Production styles

**Plugin Code:**

- `/src/modules/cne/config/parseCNEConfig.ts` - CNE-CONFIG parser
- `/src/modules/cne/config/configureCiteproc.ts` - Engine configuration
- `/src/modules/cne/interceptors/GetCiteProcInterceptor.ts` - Style wrapper

**Tests:**

- `/test/csl-tests/` - Style tests
- `/test/csl-tests/expectations/` - Expected outputs
- `/snapshots/` - HTML reference outputs

## Useful Commands

```bash
# Count CNE macros in a style
grep -c 'macro name="cne-' styles/cne/style-name-cne.csl

# List all CNE invocations
grep -n 'macro="cne-' styles/cne/style-name-cne.csl

# Verify style has CNE-CONFIG
grep "CNE-CONFIG:" styles/cne/style-name-cne.csl

# Check test output
npm test 2>&1 | grep "MLA"

# Regenerate snapshots
npm test
```

## Common Issues

**Issue:** Title capitalization differs between variants
**Solution:** Remove `text-case="title"` from CNE romanized variables, keep only for native fallback

**Issue:** Bibliography output inconsistent between notes/in-text
**Solution:** Ensure both variants use same CNE macros with identical formatting

**Issue:** Tests failing after style update
**Solution:** Run `make diffs` then `make final`, copy to `/cne` directory

**Issue:** Style Editor shows only original names
**Solution:** Citeproc hook is working - check CNE-CONFIG in style metadata

## Technical Implementation Details

### How CNE Works

CNE intercepts Zotero's citation processing pipeline at multiple points to inject enriched metadata:

**ItemToCSLJSONInterceptor**

- Location: `src/modules/cne/interceptors/ItemToCSLJSONInterceptor.ts`
- Patches both `Zotero.Utilities.Item.itemToCSLJSON()` and `Zotero.Utilities.Translate.prototype.itemToCSLJSON()`
- Installs callback slots for metadata injection
- Toggled by `setCneProcessingEnabled()` following the `extensions.cne.enable` preference

**injectCSLVariables**

- Location: `src/modules/cne/callbacks/injectCSLVariables.ts`
- Reads Extra field via `parseCNEMetadata()`
- Writes canonical `cne-*` variables directly into CSL-JSON
- Variables: `cne-title-romanized`, `cne-journal-original`, `cne-publisher-romanized`, etc.
- Ensures curated CSL styles can access CNE metadata even when Zotero's parser skips custom fields

**enrichAuthorNames**

- Location: `src/modules/cne/callbacks/enrichAuthorNames.ts`
- Matches indexed `cne-creator-N-*` lines to CSL creator arrays
- Fills romanized `family`/`given` slots
- Sets `multi.main` and `multi._key` for dual-script rendering
- Ensures citeproc renders both scripts with predictable ordering

**GetCiteProcInterceptor**

- Location: `src/modules/cne/interceptors/GetCiteProcInterceptor.ts`
- Wraps `Zotero.Style.prototype.getCiteProc()`
- Extracts style's `CNE-CONFIG` block
- Runs `configureCiteprocForCNE()` to maintain `cite-lang-prefs` (e.g., `['translit', 'orig']`)
- Prevents citeproc engine resets from losing configuration

**initializeBibLaTeXIntegration**

- Location: `src/modules/cne/biblatex-export.ts`
- Intercepts `Zotero.Utilities.Internal.itemToExportFormat()`
- Injects `biblatex.*` lines into export copy's Extra field
- Enables Better BibTeX consumption without altering stored items

### Source Code Map

**Sidebar UI & Storage**

- `addon/content/pane/*` - UI panels for entering CNE metadata
- Metadata saved in item's `extra` field with `cne-*` prefix

**Metadata Parser**

- `src/modules/cne/metadata-parser.ts:1-230` - `parseCNEMetadata()` and helpers
- Parses `cne-*` lines from Extra field into structured data

**Interceptor Stack**

- `src/modules/cne/interceptors/ItemToCSLJSONInterceptor.ts:59-210` - Main interceptor
- `src/modules/cne/callbacks/injectCSLVariables.ts` - CSL variable injection
- `src/modules/cne/callbacks/enrichAuthorNames.ts` - Author name processing

**Citeproc Configuration**

- `src/modules/cne/interceptors/GetCiteProcInterceptor.ts` - Engine wrapper
- `src/modules/cne/config/parseCNEConfig.ts` - CNE-CONFIG parser
- `src/modules/cne/config/configureCiteproc.ts` - Engine configuration logic

**Export Integration**

- `src/modules/cne/biblatex-export.ts` - BibLaTeX interceptor
- `src/modules/cne/biblatex-mapper.ts` - Field mappings

**Preference Watching**

- `src/modules/cne/index.ts` - `watchCneProcessingPreference()`
- `src/hooks.ts` - Bootstrap integration
- Keeps interceptor installation in sync with "Enable CNE Processing" preference
