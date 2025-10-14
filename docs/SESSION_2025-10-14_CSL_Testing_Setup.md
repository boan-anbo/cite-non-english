# Session Summary: CSL Testing Infrastructure Setup
**Date**: October 14, 2025
**Focus**: Setting up automated CSL style testing for CNE fields

---

## Context from Previous Session

This session continued work on the CNE (Cite Non-English) plugin after completing a major refactoring from "CJK" to "CNE" to broaden the scope.

**Previous commits**:
- `768c8b1` - Refactored from CJK to CNE namespace
- `f5b6b1c` - Added architecture documentation
- `355529d` - Initial CJK citation fields implementation

**Key naming convention established**:
- Package: `cite-non-english`
- Display name: `CNE (Cite Non-English)`
- Addon ref: `cne`
- Namespace: `cne-*` (hyphenated, not dotted - important for CSL!)

---

## Major Accomplishment: CSL Testing Infrastructure

### Problem Identified

Manual testing of CSL styles was inefficient:
1. Edit CSL style file
2. Load in Zotero
3. Manually check preview
4. Repeat for each change

We needed automated, programmatic testing.

### Solution Implemented

Set up automated CSL testing using Zotero's official `citeproc-js-server`:

**Architecture**:
```
cite-cjk/
├── styles/
│   ├── originals/
│   │   └── chicago-notes-bibliography-annotated.csl
│   └── modified/
│       └── chicago-notes-bibliography-cne-test.csl (test style)
├── test/csl-tests/
│   ├── README.md (comprehensive testing guide)
│   ├── csl-server.test.ts (5 passing tests)
│   └── fixtures/
│       └── cne-book-sample.json (test data)
└── tools/
    └── citeproc-js-server/ (git submodule)
```

### Key Discovery: Variable Name Format

**CRITICAL FINDING**: CSL requires hyphenated variable names, not dotted!

Testing revealed:
- ✅ **Works**: `cne-title-original: 日本仏教綜合研究`
- ❌ **Doesn't work**: `cne.title-original: 日本仏教綜合研究`

This applies to:
1. Extra field format in Zotero items
2. Variable references in CSL styles: `<text variable="cne-title-original"/>`

**Documentation updated throughout**:
- README.md - Changed all examples from `cne.*` to `cne-*`
- ARCHITECTURE.md - Updated namespace examples
- All test fixtures use hyphenated format

### Test Suite Details

**Test file**: `test/csl-tests/csl-server.test.ts`

**5 passing tests** (runtime ~2s):
1. Server connectivity check
2. CNE item with `cne-title-original` field renders correctly
3. Regular items without CNE fields work normally
4. Both items process in bibliography together
5. Different item types (book, article-journal) work

**Example output**:
```
📚 Citation output for item with CNE fields:
Suzuki, Daisetz Teitaro. [CNE-ORIGINAL: 日本仏教綜合研究]
Comprehensive Studies in Japanese Buddhism. Tokyo University Press, 1965.

📖 Citation output for regular item:
Smith, John. Regular English Book. Oxford University Press, 2020.
```

### Technical Implementation

**Dependencies added**:
- `tsx` (v4.20.6) - TypeScript execution for tests
- `mocha` - Test runner (already present)
- `chai` - Assertions (already present)

**New npm script**:
```json
"test:csl": "mocha --import=tsx test/csl-tests/*.test.ts"
```

**Git submodule setup**:
```bash
# Server added as submodule at tools/citeproc-js-server
git submodule add https://github.com/zotero/citeproc-js-server.git tools/citeproc-js-server

# Submodule has its own nested submodules:
# - csl/ (10,000+ citation styles)
# - csl-locales/ (locale files)
```

**.gitignore updated**:
```
# Development tools - ignore node_modules only
tools/citeproc-js-server/node_modules/
```

Submodule content itself is tracked (just references), but its node_modules are ignored.

---

## Workflow for Style Development

### Setup (first time only):

```bash
# Clone repo with submodules
git clone --recurse-submodules <repo-url>
cd cite-cjk

# Install dependencies
npm install
cd tools/citeproc-js-server && npm install

# Copy test style to server
cd ../..
cp styles/modified/chicago-notes-bibliography-cne-test.csl tools/citeproc-js-server/csl/
```

### Development cycle:

```bash
# Terminal 1: Start citeproc server
cd tools/citeproc-js-server && npm start
# Server runs at http://127.0.0.1:8085

# Terminal 2: Run tests
npm run test:csl

# When editing styles:
# 1. Edit styles/modified/chicago-notes-bibliography-cne-test.csl
# 2. Copy to server: cp styles/modified/*.csl tools/citeproc-js-server/csl/
# 3. Restart server (Ctrl+C, npm start)
# 4. Run tests: npm run test:csl
```

---

## Files Changed in This Session

### New Files (Committed):

**Commit `f8c1e2b`: feat: Add CSL style testing infrastructure**
- `.gitmodules` - Submodule configuration
- `styles/originals/chicago-notes-bibliography-annotated.csl` - Reference style
- `styles/modified/chicago-notes-bibliography-cne-test.csl` - Test style with CNE fields
- `test/csl-tests/README.md` - Comprehensive testing guide
- `test/csl-tests/csl-server.test.ts` - 5 automated tests
- `test/csl-tests/fixtures/cne-book-sample.json` - Test data
- `tools/citeproc-js-server` - Git submodule reference

**Commit `cd01ed4`: docs: Update CSL testing README**
- `test/csl-tests/README.md` - Updated for submodule workflow

### Modified Files:

- `.gitignore` - Added `tools/citeproc-js-server/node_modules/`
- `README.md` - Fixed namespace format (`cne.*` → `cne-*`), added CSL testing section
- `package.json` - Added `tsx` dependency, `test:csl` script
- `package-lock.json` - Dependency updates

### Cleaned Up:

- `.DS_Store` files removed
- `/tmp/commit_message.txt` removed
- `test/csl-tests/expected/` empty directory removed

---

## Current State

### Commit History:

```
cd01ed4 docs: Update CSL testing README to reflect git submodule setup
f8c1e2b feat: Add CSL style testing infrastructure
768c8b1 refactor: Rename from CJK to CNE (Cite Non-English) to broaden scope
f5b6b1c docs: Add architecture documentation and reference materials
355529d feat: Add CJK citation fields manager with ItemPane section
```

### Repository Status:

```bash
$ git status
On branch main
nothing to commit, working tree clean

$ git submodule status
 116e17f27077c0ae2d6d45de0fef587f79eac76f tools/citeproc-js-server (heads/master)
```

### Background Processes Running:

1. **Zotero plugin dev server** (`npm start`)
   - Running at process dfd29c
   - Serving CNE plugin to Zotero

2. **Citeproc-js server** (`cd tools/citeproc-js-server && npm start`)
   - Running at process e86114
   - Listening on http://127.0.0.1:8085
   - Ready for CSL tests

---

## Next Steps (Recommended)

### Immediate: Update Plugin Code

The plugin still uses **dotted namespace** (`cne.title-original`) but we discovered CSL needs **hyphens** (`cne-title-original`).

**Files to update**:
1. `src/modules/cne/constants.ts` - Change `NAMESPACE = "cne"` logic
2. `src/modules/cne/model/extraFieldParser.ts` - Update regex patterns
3. `src/modules/cne/types.ts` - Update field name types (if needed)
4. `src/modules/cne/model/CneMetadata.ts` - Update serialization logic

**Migration strategy**:
- Support both formats for reading (backward compatibility)
- Write only hyphenated format going forward
- Update UI labels/tooltips to show hyphenated format

### After Plugin Update:

1. **Test the plugin**:
   ```bash
   npm start  # Launch Zotero with plugin
   # Add test item with CNE fields
   # Verify Extra field uses hyphenated format
   ```

2. **Verify CSL integration**:
   ```bash
   # Start citeproc server
   cd tools/citeproc-js-server && npm start

   # Run tests (should still pass)
   npm run test:csl
   ```

3. **Build production CSL style**:
   - Copy `chicago-notes-bibliography-cne-test.csl`
   - Rename to production style
   - Remove test markers like `[CNE-ORIGINAL: ...]`
   - Format as: `Original Title [Romanization] (Translation)`

4. **Expand test coverage**:
   - Add tests for all supported fields (booktitle, publisher, journal, series)
   - Test different citation formats (note vs bibliography)
   - Test edge cases (missing variants, special characters)

### Documentation:

5. **Update plugin README** with example workflow:
   - Show how to add CNE fields to items
   - Demonstrate citation output with real examples
   - Link to test suite for verification

6. **Create style guide** for contributors:
   - CSL variable naming conventions
   - How to test style changes
   - How to add new CNE fields

---

## Technical Notes

### CSL Variable Name Discovery Process:

1. **Initial assumption**: Used dotted format `cne.title-original` (common in other namespaces)
2. **Created test style**: Modified Chicago style to display CNE fields
3. **Manual test in Zotero**: Added Extra field with `cne.title-original` - didn't work
4. **Hypothesis**: CSL might need hyphens instead of dots
5. **Changed to hyphens**: `cne-title-original` - worked immediately!
6. **Verified with automated tests**: All 5 tests passing
7. **Updated all documentation**: README, examples, test data

### Submodule Management:

**Adding submodule**:
```bash
git submodule add https://github.com/zotero/citeproc-js-server.git tools/citeproc-js-server
git submodule update --init --recursive
```

**For collaborators**:
```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>

# Or after regular clone:
git submodule update --init --recursive
```

**Updating submodule**:
```bash
cd tools/citeproc-js-server
git pull origin master
cd ../..
git add tools/citeproc-js-server
git commit -m "chore: Update citeproc-js-server submodule"
```

### Test Architecture:

**Why citeproc-js-server over direct citeproc-js?**
1. Official Zotero implementation - most accurate
2. Better maintained
3. Easier setup as standalone service
4. Can test multiple styles in parallel
5. Matches production citation processing

**Test data format** (CSL-JSON):
```json
{
  "id": "item1",
  "type": "book",
  "title": "Main Title",
  "cne-title-original": "原始標題",
  "cne-title-romanized": "Yuánshǐ biāotí",
  "cne-title-english": "Original Title",
  "author": [{"family": "Surname", "given": "Given"}],
  "publisher": "Publisher Name",
  "issued": {"date-parts": [[2025]]}
}
```

---

## Lessons Learned

1. **Always test assumptions**: The dotted namespace seemed logical but didn't work in CSL
2. **Automate early**: Manual testing was tedious; automated tests caught issues instantly
3. **Document discoveries**: The hyphen requirement is now documented everywhere
4. **Git submodules work well**: For large external dependencies like style repositories
5. **Incremental testing**: Small test suite with 5 tests covers core functionality adequately

---

## Open Questions / Future Considerations

1. **Performance**: How does CSL handle 10,000+ styles? (citeproc-js-server includes all)
2. **Style distribution**: Should we bundle CNE style with plugin or document separately?
3. **Field expansion**: What other fields need parallel versions? (author, editor, etc.)
4. **Backward compatibility**: How to migrate existing items from dotted to hyphenated?
5. **CSL spec**: Should we propose `translated-title` and `transliterated-title` to CSL standard?

---

## References

### Repository State:
- Working directory: `/Users/boan/script/cite-cjk`
- Branch: `main`
- Last commit: `cd01ed4` (docs: Update CSL testing README)
- Clean working tree

### External Resources:
- [citeproc-js-server](https://github.com/zotero/citeproc-js-server)
- [CSL Specification](https://docs.citationstyles.org/en/stable/specification.html)
- [Zotero Extra Field Documentation](https://www.zotero.org/support/kb/item_types_and_fields#citing_fields_from_extra)

### Related Plugins:
- [title-without-articles](https://github.com/boan-anbo/zotero-title-without-articles) - Similar approach using Extra field + custom CSL

---

## Session End State

**All changes committed and documented.**
**Ready to continue development with plugin code refactoring to use hyphenated format.**

Background processes still running:
- Zotero dev server (process dfd29c)
- Citeproc server (process e86114)

When switching Claude Code context to cite-cjk directory, these processes should continue running.
