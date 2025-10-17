# CSL Style Snapshots

This directory contains expected HTML output for CSL style testing. Snapshots are used for regression testing to ensure that style changes don't unexpectedly alter citation formatting.

## What are Snapshots?

Snapshots are "golden files" - expected outputs saved from a known-good state. Tests compare current output against snapshots to detect changes.

## Convention

**Snapshot file naming**: `{style-name}.html`

The test automatically discovers all `.html` files in this directory and tests each corresponding style. No configuration needed!

**Example**:
- `chicago-notes-bibliography-cne.html` → Tests `chicago-notes-bibliography-cne` style
- `apa-ja.html` → Tests `apa-ja` style

## Viewing Snapshots

Snapshots are HTML files that can be opened in a browser:

```bash
open test/snapshots/chicago-notes-bibliography-cne.html
```

## How Snapshots are Generated

Snapshots are generated using Zotero's internal APIs:
1. Load fixture data (`test/csl-tests/fixtures/cne-comprehensive-sample.json`)
2. Use `Zotero.Styles.get()` to load the style
3. Use `style.getCiteProc()` to get CSL engine
4. Use `Zotero.Cite.makeFormattedBibliography()` to generate HTML
5. Save output to snapshot file

## Updating Snapshots

### When to Update

Update snapshots when you **intentionally** change a CSL style and want to preserve the new output as the expected behavior.

**Do NOT update** if:
- Test fails unexpectedly (investigate the cause first)
- You didn't change the style (may indicate a bug)

### How to Update

```bash
# Update ALL snapshots for ALL styles
npm run test:snapshots:update
```

This regenerates snapshots from current style outputs. It automatically discovers all styles in `styles/cne/` and generates a snapshot for each.

### Workflow for Style Changes

1. **Edit CSL file**:
   ```bash
   vim styles/cne/chicago-notes-bibliography-cne.csl
   ```

2. **Run tests** (will fail for changed style):
   ```bash
   npm run test:snapshots
   ```

3. **Regenerate snapshots**:
   ```bash
   npm run test:snapshots:update
   ```

4. **Review changes** in git:
   ```bash
   git diff test/snapshots/chicago-notes-bibliography-cne.html
   ```

5. **Verify changes** (open in browser):
   ```bash
   open test/snapshots/chicago-notes-bibliography-cne.html
   ```

6. **Commit if correct**:
   ```bash
   git add test/snapshots/chicago-notes-bibliography-cne.html
   git commit -m "Update Chicago CNE: improve CJK title formatting"
   ```

## Running Tests

### Test All Styles
```bash
npm run test:snapshots
```

This runs `test/snapshot-regression.test.ts` which:
1. Discovers all `.html` files in `test/snapshots/`
2. For each snapshot, generates current output using Zotero APIs
3. Compares with snapshot
4. Fails if different

**Note**: Zotero remains open after tests finish. To auto-quit, use:
```bash
npm run test:snapshots:auto
```

### Viewing Console Logs

All console output (console.log, console.error) appears in Zotero's Browser Console.

**To view logs**:
1. Run tests: `npm run test:snapshots` (stays open) or `npm run test:snapshots:auto` (auto-quits)
2. Open Browser Console: **Tools > Developer > Browser Console**
   - Mac: `Cmd+Shift+J`
   - Windows/Linux: `Ctrl+Shift+J`
3. View detailed console output, errors, and stack traces

**Tip**: The console shows:
- Test progress and results
- console.log() messages from tests
- JavaScript errors with stack traces
- Zotero API calls and operations

### Generate/Update All Snapshots
```bash
npm run test:snapshots:update
```

This runs the same test but with `UPDATE_SNAPSHOTS=1`, which:
1. Discovers all styles in `styles/cne/`
2. Generates current output for each style
3. Saves to snapshot files (creates or overwrites)
4. Skips comparison

## Test Fixture

Tests use `test/csl-tests/fixtures/cne-comprehensive-sample.json` which contains 19 items:
- Chinese examples (books, articles, newspapers, webpages, chapters)
- Japanese examples (books, articles, chapters, films)
- Korean examples (books, articles, chapters, newspapers, webpages)
- Mixed and English examples for comparison

This single fixture serves as the source of truth for all style tests.

## How It Works

### Test Flow

```
npm run test:snapshots
    ↓
Launches Zotero (via zotero-plugin test)
    ↓
Loads CNE plugin with all interceptors
    ↓
test/snapshot-regression.test.ts runs:
    ├─ Discovers all snapshots in test/snapshots/
    ├─ For each snapshot {style-name}.html:
    │   ├─ Loads fixture (19 items)
    │   ├─ Zotero.Styles.get('{style-name}')
    │   ├─ style.getCiteProc('en-US', 'html')
    │   ├─ Creates temp Zotero items from CSL-JSON
    │   ├─ engine.updateItems(itemIDs)
    │   ├─ Zotero.Cite.makeFormattedBibliography(engine, 'html')
    │   ├─ Compares output with snapshot
    │   └─ Cleans up temp items
    └─ Reports pass/fail for each style
```

### Why This Approach?

**Benefits**:
- No external citeproc server needed
- Tests run in real Zotero environment
- CNE interceptors are active (tests the full pipeline)
- Fast and reliable
- Direct API access

**Alternative** (not used):
- External citeproc-js-server requires separate process
- Server needs style files synced
- Extra network overhead
- Doesn't test CNE interceptors

## Troubleshooting

### Test Fails After Style Change

**Expected!** This means the style changed. Review the diff:
```bash
git diff test/snapshots/chicago-notes-bibliography-cne.html
```

If changes are correct, update snapshot:
```bash
npm run test:chicago:update
```

### Test Fails Without Style Change

**Investigate!** Something unexpected changed. Possible causes:
- CNE plugin code changed (interceptor behavior)
- Zotero API changed
- Fixture data corrupted
- External dependencies changed

**Debug**:
1. Check git status: `git status`
2. Review recent changes: `git log`
3. Run test with verbose output
4. Compare output manually

### Snapshot Missing

Run update to generate initial snapshot:
```bash
npm run test:chicago:update
```

### Style Not Found Error

Ensure style is installed:
```bash
ls styles/cne/chicago-notes-bibliography-cne.csl
```

Style must be loaded into Zotero. The test creates temporary items, so the style must exist in Zotero's styles directory or be loadable by `Zotero.Styles.get()`.

## Adding New Styles

To add a new CNE style variant:

1. **Create style file**: `styles/cne/new-style-cne.csl`
2. **Generate snapshot**: `npm run test:snapshots:update`
3. **Verify**: `open test/snapshots/new-style-cne.html`
4. **Commit**: `git add styles/cne/new-style-cne.csl test/snapshots/new-style-cne.html`

That's it! The test automatically discovers and tests the new style.

**No test file needed. No configuration needed. Just convention.**
