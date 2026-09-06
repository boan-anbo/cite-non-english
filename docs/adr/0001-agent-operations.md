# CNE operations and local agent transport

Status: implemented on the agent-interface branch, September 2026.

## Problem

CNE's metadata parser and citation processing already support programmatic use,
but writes belonged to sidebar snapshots. Saving one snapshot could overwrite a
field written later by another actor. A single global debounce timer also allowed
editing a second item to cancel the first item's save. Adding an HTTP endpoint on
top of those writes would expose these defects to agents.

## Decision

Use a shared operation layer inside CNE, with Zotero adapters for storage and
citation rendering and a small transport adapter for local HTTP. There is no
companion-plugin dependency, independent daemon, or model-provider dependency.

- `operations/values.ts` defines field transformations over plain values. It
  derives title field paths from the existing CNE field/variant definitions.
- `operations/items.ts` owns Zotero item references, native context, and opaque
  content revisions. Keys are library-scoped; process-local numeric IDs never
  become the public identity.
- `operations/write.ts` plans patches and commits batches through Zotero's
  transaction API. The sidebar supplies a per-field baseline; external callers
  supply a content revision. Both use the same validation, merge, and persistence.
- `operations/preview.ts` owns the Zotero/citeproc seam. A fresh engine retrieves
  an unsaved clone through Zotero's own citation system, retaining native
  conversion rules and installed CNE callbacks. No temporary persistence or
  global retrieve-item patch is permitted.
- `operations/catalog.ts` is the one public operation catalog: contracts,
  effects, dispatch, and discovery. Its input schemas also perform runtime
  validation through the explicit subset in `schema.ts`.
- `agent/http.ts` translates catalog entries into Zotero endpoint constructors.
  It owns request authorization and serialization, not metadata rules.
- `agent/access.ts` owns opt-in registration and token lifecycle. Shutdown
  removes only routes still owned by this instance; it never stops Zotero's
  shared listener. Token rotation takes effect on subsequent requests.
- `CneMetadata` is a human draft. It retains in-flight keystrokes and conflicted
  values, merges independent external changes, and delegates saves to operations.

## Compatibility and failure semantics

The protocol namespace is `/cne/v1`. Additive operations and optional response
fields can extend v1; incompatible input or semantic changes need a new version.
Clients must discover operations rather than assuming a fixed list. Input objects
are strict to catch misspelled edits. Null is the explicit clearing operation.
There are no alternate field names, endpoint aliases, or compatibility adapters.

Recognized Extra fields continue to use the existing parser/serializer and
canonical persistence format. Unknown future fields survive recognized-field
edits and clear operations. Creator indices remain positions in Zotero's complete
creator list, including every role, and creator changes invalidate an outstanding
creator edit. This interface does not introduce stored creator IDs or migrate
existing item data.

Successful API writes return changed paths and saved readback. Batches commit
all-or-nothing; cached Zotero items are reloaded after SQL rollback. A conflict
requires review and a new read, never an automatic retry against a new revision.
There is no exactly-once claim: after a lost response the client must read back.

Browser requests are rejected by Zotero and CNE. CNE has its own bearer token,
including for reads, since custom endpoints do not inherit Local API auth.
Revocation prevents new requests; it does not undo a transaction already accepted.
No token is returned in discovery or API results. Native HTTP debug logging is
outside the adapter; the [CNE skill](../../skills/cne/SKILL.md) covers token handling.

## Extension points

A future CLI or MCP adapter can call these operation contracts without importing
sidebar code or defining another write path. More generation workflows can supply
validated patches; they do not belong in the storage or transport modules.

Zotero's endpoint registration and citation-engine retrieval are host seams, not
portable web APIs. Keep their assumptions in the adapter modules and test them
against actual Zotero versions before widening the compatibility claim. An engine
without the required preview seam returns `PREVIEW_UNSUPPORTED` explicitly.

## Evidence

The retained CSL fixtures remain the rendering authority. Added tests exercise
concurrent sidebar/agent writes, creator changes, read-only libraries, input
validation, SQLite rollback including cached items, visible sidebar refresh,
actual local HTTP authentication/discovery/save/readback, and unsaved preview
parity with saved rendering across all bundled styles. HTTP tests run on the
scaffold's separate local-server port; they do not operate on the user's library.
