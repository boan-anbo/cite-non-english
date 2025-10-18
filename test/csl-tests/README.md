# CSL Style Testing

Automated testing for Chicago 18th Edition Notes and Bibliography style with CNE (Cite Non-English) fields.

## Running Tests

```bash
# Run all tests (including snapshot generation)
npm test

# Run tests with Zotero window open for inspection
npm run test:inspect

# Update HTML snapshots
npm run test:snapshots:update

# Open generated snapshot in browser
npm run test:snapshots:open
```

## Architecture

### 1. Global Setup (`00-global-setup.test.ts`)
- Creates Zotero items from TypeScript fixtures
- Runs once before all tests
- Validates Extra fields contain CNE metadata

### 2. Style Tests (`chicago-18th.test.ts`)
- Renders bibliography in memory using Zotero's CSL processor
- Asserts against TypeScript expectations
- No file I/O, fast execution

### 3. Snapshot Generator (`snapshot-generator.test.ts`)
- Generates HTML snapshots for user documentation
- Writes to `snapshots/` directory (outside `test/` to avoid watch loops)
- NOT used for regression testing

### Test Data

Fixtures are defined in TypeScript:
- `fixtures/unified-fixtures.ts` - All test items (Chinese, Japanese, Korean)
- `expectations/chicago-18th/en-US/*.ts` - Expected formatted output

Example fixture:
```typescript
{
  itemType: 'book',
  title: '清代以来三峡地区水旱灾害的初步研究',
  creators: [{firstName: 'Linfu', lastName: 'Hua', creatorType: 'author'}],
  extra: `cne-title-romanized: Qingdai yilai Sanxia...
cne-title-english: A preliminary study of floods...
cne-creator-0-last-romanized: Hua
cne-creator-0-last-original: 华`
}
```

## Adding New Tests

### 1. Add Fixture
In `fixtures/unified-fixtures.ts`:
```typescript
[FIXTURE_IDS.NEW_ITEM]: {
  itemType: 'article',
  title: 'Original title',
  extra: `cne-title-romanized: Romanized title
cne-title-english: English translation`
}
```

### 2. Add Expectation
In `expectations/chicago-18th/en-US/chinese.ts`:
```typescript
export const chineseExpectations: Record<string, string> = {
  [FIXTURE_IDS.NEW_ITEM]: 'Expected formatted output here',
}
```

### 3. Run Tests
```bash
npm test
```

The test will automatically pick up the new fixture and expectation.

## What We're Testing

### CNE Fields
- ✅ `cne-title-romanized`, `cne-title-original`, `cne-title-english`
- ✅ `cne-container-title-*` for book sections, articles
- ✅ `cne-journal-*` for journal articles
- ✅ `cne-creator-N-*` for romanized and original script names

### Languages Covered
- 🇨🇳 Chinese (Simplified & Traditional)
- 🇯🇵 Japanese
- 🇰🇷 Korean

### Field Name Format

**Extra fields use hyphenated format:**
```
cne-title-romanized: Pinyin romanization
cne-title-original: 汉字原文
cne-title-english: English translation
```

**CSL variables also use hyphens:**
```xml
<text variable="cne-title-romanized"/>
<text variable="cne-title-original"/>
```

## Files

```
test/csl-tests/
├── 00-global-setup.test.ts       # Creates Zotero items
├── chicago-18th.test.ts          # Main test suite
├── snapshot-generator.test.ts    # Generates HTML snapshots
├── fixtures/
│   ├── unified-fixtures.ts       # All test items
│   ├── constants.ts              # Fixture IDs
│   └── types.ts                  # TypeScript types
├── expectations/
│   └── chicago-18th/
│       └── en-US/
│           ├── chinese.ts        # Expected Chinese output
│           ├── japanese.ts       # Expected Japanese output
│           └── korean.ts         # Expected Korean output
└── test-helpers.ts               # Shared test utilities
```

## Troubleshooting

**Tests fail with "Plugin awaiting timeout"?**
- The CNE plugin isn't loading properly
- Check `src/index.ts` initialization code
- Look for errors in Zotero's error console

**Diff shows unexpected characters?**
- Check character encoding (UTF-8)
- Ensure Extra fields use correct romanization systems

**Snapshot generation stuck in loop (test:inspect)?**
- Snapshots should write to `snapshots/` (not `test/`)
- Check `test-helpers.ts` saveSnapshot() path logic
