---
name: cne
description: Use Cite Non-English (CNE) in Zotero to read references, add or correct pinyin, romanization and translations, preview citations, and save or clear CNE metadata through its local API. Use when connecting an agent to CNE or troubleshooting that connection.
---

# CNE

CNE handles Zotero access, validation, citation rendering, and persistence.
Supply the language judgment yourself; CNE does not generate translations or pinyin.

## Connect and discover

In **Zotero Settings → CNE → Agent access**, enable access and choose **Copy connection**.
Use its `baseURL` and authentication `headers` with an ordinary HTTP client on the
Zotero host. Keep the bearer token out of source control and logs, including
Zotero's verbose HTTP debugging. This is CNE's token, not a Zotero API key.

`GET {baseURL}` returns `{ "result": ... }` with operations, fields, and input
schemas. Discover these before constructing requests. Operations use JSON `POST`
with the copied headers plus `Content-Type: application/json`. Catalog paths
already include `/cne/v1`; resolve them against the origin, not the full `baseURL`.

## Work

1. Start with `POST {baseURL}/selection/read` and `{}`. For a library, use
   `libraries.list` → paginated `items.search`; filter returned `values` for missing
   fields. Use `items.read` for known `{libraryID, key}` references.
2. Read `native` and `values`, then propose edits using the returned revision:

   ```json
   {
     "item": { "libraryID": 1, "key": "ABCD1234" },
     "expectedRevision": "revision-from-read",
     "mode": "fillMissing",
     "changes": [
       { "path": "title.romanized", "value": "Zhongguo lishi yanjiu" }
     ]
   }
   ```

3. Check proposals with `items.validate` and `{ "edits": [...] }`. For citation
   output, discover installed IDs with `styles.list`, then call `items.preview`
   with the proposal plus `styleID` and optionally `format: "text"`. Neither saves.
4. Save within the user's requested scope using `items.patch` and `{ "edits": [...] }`,
   up to 50 items atomically. Returned `current` records are saved readback.
   Use `items.clear` only when clearing all recognized CNE metadata is intended.

- `fillMissing` preserves existing values, including `false`; default `replace`
  changes only supplied paths. `null` clears a field; empty/multiline text is invalid.
- `creators.N.*` uses zero-based **native.creators order across all roles**.
  Native names and creator order are context, not writable through this API.
- `language` is Zotero's native field; `originalLanguage` is CNE's creator-language
  override. Preview follows the current CNE settings and enable state.

## Recover

CNE errors return `{error: {code, message, details?}}`.
Use `code` to distinguish failures; `details.path` locates the input or CNE field,
`details.item` identifies the record, and constraint details give accepted types,
choices or limits. Fix invalid input before retrying; never treat an error as an
empty result. Unexpected internal failures point to Zotero's error log.
Zotero may reject malformed HTTP before CNE; inspect status/body if it is not JSON.

- **Port unreachable:** check Zotero is running and the installed CNE build has
  Agent access enabled; recopy the actual port. Remote/container loopback is a
  different host: execute on the Zotero host. If access cannot start, inspect the
  settings status and that port's listener to identify the cause.
- **Endpoint 404:** check the copied URL, active Zotero instance, enabled access,
  and accidental doubled `/cne/v1`.
- **`UNAUTHORIZED`:** recopy the connection; revocation invalidates old tokens.
- **`FORBIDDEN_ORIGIN` / `FORBIDDEN_HOST`:** use the copied loopback address with a
  native HTTP client. Browser requests may be rejected before CNE returns JSON.
- **Empty selection / `NO_ACTIVE_WINDOW`:** open the library window and select
  bibliographic items, or use explicit library/item references.
- **`REVISION_CONFLICT`:** reread and review changed fields and creator order;
  never blindly substitute a fresh revision. After a **save timeout**, read back
  before retrying: the transaction may have committed.
- **`READ_ONLY` / `STYLE_NOT_FOUND`:** check edit permissions / rediscover styles.
  A failed batch commits nothing.
