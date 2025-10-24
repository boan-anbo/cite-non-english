# Diagnostics & Logging Convention

When Zotero’s JS console drops messages or the test harness buffers output, fall back to assertion-driven diagnostics instead of ad-hoc logging. This keeps feedback deterministic and integrates with `npm test` (zotero-plugin Mocha runner).

## Core Loop

1. **Write a focused spec**
   - Place it under `test/csl-tests/**`.
   - Use a short descriptive name. If it’s temporary instrumentation, prefix the `describe` block with `[DIAG]`.

2. **Scope the run locally**
   - While iterating, gate the block with `describe.only(...)` or `it.only(...)` so `npm test` executes just the diagnostics.
   - Remove all `.only` markers before committing.

3. **Assert instead of logging**
   - Prefer `assert.deepEqual` / `assert.include` / `assert.match` to surface state. Mocha will print the diff automatically.
   - Include actionable messages, e.g.  
     ```ts
     assert.deepEqual(
       engine.opt?.['cite-lang-prefs']?.persons,
       ['translit', 'orig'],
       'cite-lang-prefs.persons should mirror the CNE style config'
     );
     ```
   - For large objects, assert on the specific properties you care about; avoid dumping entire structures to keep output readable.

4. **Snapshot or stringify when necessary**
   - If you truly need to inspect a JSON payload, use `assert.deepEqual(actual, expected)` so the diff shows the delta, or log once with `console.log(JSON.stringify(obj, null, 2))`—Mocha captures stdout reliably.

5. **Clean up**
   - If the check reveals a regression worth guarding, keep it as a permanent test (see `test/csl-tests/get-citeproc-interceptor.test.ts`).
   - Otherwise convert the diagnostic `describe`/`it` to `it.skip(...)` with a comment, or delete it entirely once the investigation is done.

## Quick Workflow Example

```ts
describe.only('[DIAG] Citeproc intercept', function () {
  it('records cite-lang-prefs from the style metadata', async function () {
    const engine = ...;
    assert.deepEqual(
      engine.opt?.['cite-lang-prefs']?.persons,
      ['translit', 'orig'],
      'Engine should request romanized + original slots'
    );
  });
});
```

Run `npm test` for fast feedback, iterate until the assertion passes, then remove `.only` and either promote the test or delete it.

## Rationale

- Assertions are consistent across environments—no reliance on Zotero’s buffered logging.
- Mocha’s diff output provides richer feedback than free-form logs.
- Keeping diagnostics in the test suite documents assumptions and makes it easy to resurrect past troubleshooting steps.
