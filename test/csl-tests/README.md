# CSL Style Testing

Automated testing for our custom Chicago style with CNE (Cite Non-English) fields.

## Setup

The tests use Zotero's official `citeproc-js-server` to process citations programmatically.

### First Time Setup

1. **Server is already cloned** at `tools/citeproc-js-server/`
2. **Dependencies already installed**
3. **Our custom CSL style is already copied** to the server

### Start the Server

Before running tests, start the citeproc server:

```bash
cd tools/citeproc-js-server
npm start
```

The server runs at `http://127.0.0.1:8085`

## Running Tests

With the server running, in another terminal:

```bash
npm run test:csl
```

Or run directly:

```bash
npx mocha --import=tsx test/csl-tests/*.test.ts
```

## Test Structure

### Test Data

`fixtures/cne-book-sample.json` - CSL JSON test items with CNE fields

Example item with CNE fields:
```json
{
  "id": "item1",
  "type": "book",
  "title": "Comprehensive Studies in Japanese Buddhism",
  "cne-title-original": "日本仏教綜合研究",
  "cne-title-romanized": "Nihon bukkyō sōgō kenkyū",
  "cne-title-english": "Comprehensive Studies in Japanese Buddhism",
  "author": [{"family": "Suzuki", "given": "Daisetz Teitaro"}],
  "publisher": "Tokyo University Press",
  "issued": {"date-parts": [[1965]]}
}
```

### Test Cases

`csl-server.test.ts` contains tests that:
1. POST CSL JSON to the server
2. Get formatted citations back
3. Verify CNE fields appear correctly

## Workflow

### Testing a Style Change

1. **Edit the CSL**: Modify `styles/modified/chicago-notes-bibliography-cne-test.csl`

2. **Copy to server**:
   ```bash
   cp styles/modified/chicago-notes-bibliography-cne-test.csl tools/citeproc-js-server/csl/
   ```

3. **Restart server** (it auto-reloads on style changes):
   ```bash
   # In the server terminal, Ctrl+C then
   cd tools/citeproc-js-server && npm start
   ```

4. **Run tests**:
   ```bash
   npm run test:csl
   ```

5. **Check output** - Tests print the actual citation output for visual inspection

## What We're Testing

- ✅ `cne-title-original` field works in CSL
- ✅ Shows original script (日本仏教綜合研究)
- ✅ Regular items without CNE fields work normally
- ✅ Multiple item types (book, article) supported
- ✅ Full bibliography generation

## Example Output

```
📚 Citation output for item with CNE fields:
Suzuki, Daisetz Teitaro. [CNE-ORIGINAL: 日本仏教綜合研究]
Comprehensive Studies in Japanese Buddhism. Tokyo University Press, 1965.

📖 Citation output for regular item:
Smith, John. Regular English Book. Oxford University Press, 2020.
```

## Adding New Tests

1. Add test data to `fixtures/`
2. Add test case in `csl-server.test.ts`:

```typescript
it("should test something new", async function () {
  const result = await getCitation([yourTestItem]);
  console.log("Output:", result);
  assert.include(result, "expected content");
});
```

## Troubleshooting

**Server not responding?**
- Check it's running: `curl http://127.0.0.1:8085`
- Restart: Ctrl+C in server terminal, then `npm start`

**Style changes not reflecting?**
- Make sure you copied the updated CSL to `tools/citeproc-js-server/csl/`
- Restart the server to reload styles

**Test failures?**
- Check the console output - it shows actual citation format
- Compare with what you expected
- Adjust assertions or fix the CSL style
