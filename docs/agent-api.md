# Local agent access

CNE exposes an opt-in JSON API inside Zotero. It needs no companion plugin,
model account, MCP server, or separate process. Zotero must be running.

In **Zotero Settings → CNE → Agent access**, enable access and choose
**Copy connection**. Give that connection to your local agent. It contains a
secret bearer token with permission to read bibliographic context and edit CNE
metadata across your editable libraries. **Revoke token** disconnects existing
clients; copy the new connection to reconnect. Disabling access removes CNE's
routes. Other Zotero services keep running.

The default address is `http://127.0.0.1:23119/cne/v1`; the copied connection uses
Zotero's actual port. This token is separate from Zotero's web and local API keys.
Use an ordinary local HTTP client, not JavaScript in a web page. Browser-origin
requests are rejected. Store the token privately, outside prompts shared with
untrusted services, source control, and logs. Zotero's verbose HTTP debugging can
record request headers; avoid enabling it while using a real token.

## Discover first

`GET /cne/v1` with `Authorization: Bearer TOKEN` returns `{ "result": ... }`:
API and plugin versions, current CNE enable state, supported fields, and an
operation catalog. Every catalog entry declares its POST path, read/write effect,
description, and JSON Schema for input. All operations take a JSON object;
unknown properties and types are rejected without coercion.

| Operation        | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `libraries.list` | Library IDs, names, and edit permissions                         |
| `selection.read` | Current selection, up to 50 bibliographic items                  |
| `items.search`   | Native title/creator/year search within one library, with paging |
| `items.read`     | Batch read by `{libraryID, key}`                                 |
| `items.validate` | Check proposed patches and return their changes without saving   |
| `items.patch`    | Atomic batch of field edits or fill-missing edits                |
| `items.clear`    | Clear recognized CNE metadata, preserving native language        |
| `styles.list`    | All installed visible citation styles and their available forms  |
| `items.preview`  | Real citation and bibliography output for saved or proposed data |

For example, `items.read` is `POST /cne/v1/items/read`. There are no aliases.
Schemas bound batch sizes to 50 items, patch size to 500 changes per item, text
values to 10,000 characters, and request JSON to 1 MiB. Search uses `offset` and
`limit`; its pages reflect the live library rather than a frozen search snapshot.

## Item data and patches

A read returns:

```json
{
  "item": { "libraryID": 1, "key": "ABCD1234" },
  "revision": "opaque-content-revision",
  "editable": true,
  "native": {
    "itemType": "book",
    "title": "中国历史研究",
    "language": "zh-CN",
    "creators": [
      { "creatorType": "author", "lastName": "王", "firstName": "小波" }
    ]
  },
  "values": { "language": "zh-CN", "title.original": "中国历史研究" }
}
```

`native` contains Zotero's item JSON, excluding raw Extra. `values` contains
recognized CNE fields plus the native language. Missing paths are absent.

Text paths are `{field}.{variant}`: fields are `title`, `container-title`,
`publisher`, `journal`, and `series`; variants are `original`, `romanized`,
`romanizedShort`, and `english`. Stored variants remain accessible even when the
sidebar or a particular style does not display them. `language` changes Zotero's
native field; `originalLanguage` changes CNE's creator-language override.

Creator paths are `creators.{index}.{field}`, where the index is the zero-based
position in **native.creators, across every role**. Fields are `lastRomanized`,
`firstRomanized`, `lastOriginal`, `firstOriginal`, `optionsOriginalSpacing`, and
`optionsForceComma`. The last two take booleans. Use `null` to clear a field;
empty strings and multiline values are rejected. Null can also remove metadata
left behind at an index whose native creator was deleted. `false` is a stored value,
not a missing value.

```json
{
  "edits": [
    {
      "item": { "libraryID": 1, "key": "ABCD1234" },
      "expectedRevision": "revision-returned-by-read",
      "mode": "fillMissing",
      "changes": [
        { "path": "title.romanized", "value": "Zhongguo lishi yanjiu" },
        { "path": "creators.0.lastRomanized", "value": "Wang" },
        { "path": "creators.0.firstRomanized", "value": "Xiaobo" }
      ]
    }
  ]
}
```

`mode` defaults to `replace`, which changes only supplied paths. `fillMissing`
preserves existing values. Neither mode changes unmentioned CNE fields or
unrelated Extra lines. Clearing recognized metadata preserves unknown future
CNE fields. Native creator names and their order are context, not writable here.

CNE does not generate pinyin or translations. An agent reads the original text,
supplies its proposed reading, and uses CNE to validate, preview, and save it.
This keeps ambiguous readings and model choice with the agent and user.

## Preview before saving

Call `items.preview` with `item`, `expectedRevision`, `styleID`, and optionally
`changes`, `mode`, `locale`, `format` (`html` or `text`), `locator`, and `label`.
Use style IDs returned by `styles.list`. The default locale is `en-US`.

The result includes the actual proposed changes, source revision, style/locale,
first `citation`, `subsequentCitation` (an immediate repeat in the next note),
and `bibliography` (`null` for a style without one). This is a specified two-citation
history, not a reconstruction of an arbitrary word-processor document.

Preview uses Zotero's real CSL conversion and CNE configuration with an unsaved
item clone and an isolated engine. It never temporarily saves metadata. Global
CNE enable/formatting preferences apply. An unsupported citation engine produces
an explicit error rather than substituted output. Render returned HTML only in
a trusted citation-display context; plain text is available for copy and tools.

## Saving, conflicts, and recovery

Every API write requires the last read's `expectedRevision`, including
fill-missing and clear operations. Revisions reflect item content rather than
Zotero's sync counter. A successful patch returns an array of
`{beforeRevision, changes, current}`; `current` is saved item readback in the same
shape as a read. A no-op returns an empty `changes` array without saving.

A batch is one transaction. Any invalid value, stale revision, read-only item,
or failed save prevents the entire batch from committing. After a timeout, read
again to learn whether the save committed; do not assume it failed.

Errors from CNE have the shape:

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "The item changed. Read it again before retrying.",
    "details": { "current": {} }
  }
}
```

`REVISION_CONFLICT` (409) requires a fresh read and review, especially after a
creator reorder. `INVALID_INPUT`, `INVALID_FIELD`, `INVALID_VALUE`,
`INVALID_CREATOR`, and `INVALID_PATCH` (400) identify invalid requests.
`READ_ONLY` and `UNAUTHORIZED` use 403; missing items/styles use 404. Zotero may
reject malformed HTTP or browser requests before CNE runs; those failures need
not contain CNE JSON. Do not treat a missing/closed connection as an empty result.

The sidebar uses the same field operations. Independent human and agent edits
merge; conflicting edits retain the human's draft and show an error with an
explicit discard/reload control. Successful agent saves update visible fields.

## Minimal client example

Save the copied connection privately as `cne-connection.json`. This example
uses Python's standard library; it supplies an illustrative reading for a
selected Chinese item. Review the selection and reading before using it.

```python
import json
from urllib.request import Request, urlopen

with open("cne-connection.json") as f:
    connection = json.load(f)

def call(operation, data):
    request = Request(
        connection["baseURL"] + "/" + operation.replace(".", "/"),
        data=json.dumps(data).encode(),
        headers={**connection["headers"], "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        return json.load(response)["result"]

item = call("selection.read", {})[0]
proposal = {
    "item": item["item"],
    "expectedRevision": item["revision"],
    "mode": "fillMissing",
    "changes": [{"path": "title.romanized", "value": "Zhongguo lishi yanjiu"}],
}
styles = call("styles.list", {})
preview = call("items.preview", {
    **proposal, "styleID": styles[0]["id"], "format": "text",
})
print(preview["bibliography"] or preview["citation"])
# After reviewing the preview:
saved = call("items.patch", {"edits": [proposal]})
print(saved[0]["changes"])
```

## Development checks

`npm run build`, `npm run lint:check`, and `npm test` check the implementation.
For a focused integration run, use `CNE_TEST_ENTRIES=test/agent npm test`.
The scaffold supplies a disposable profile and separate HTTP port. Tests cover
real Zotero storage, sidebar DOM, authentication, and citeproc rather than a
mock library. Current local host verification uses Zotero 10.0; test other host
versions before making additional compatibility claims.
