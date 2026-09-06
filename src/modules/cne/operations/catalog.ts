import { config, version } from "../../../../package.json";
import { getPref } from "../../../utils/prefs";
import { CREATOR_FIELDS, FIELD_PATHS } from "./values";
import {
  array,
  integer,
  object,
  string,
  validate,
  type Schema,
} from "./schema";
import { resolveItem, snapshot, snapshotItems, type ItemRef } from "./items";
import { planEdit, saveEdits } from "./write";
import { listStyles, previewEdit } from "./preview";
import { CneError } from "./errors";

const ref = object({
  libraryID: integer(1),
  key: { ...string(8), pattern: "^[A-Z0-9]{8}$" },
});
const changes = array(
  object({
    path: string(100),
    value: { type: ["string", "boolean", "null"], maxLength: 10000 },
  }),
  500,
  0,
);
const edit = object(
  {
    item: ref,
    expectedRevision: string(100),
    changes,
    mode: { type: "string", enum: ["replace", "fillMissing"] },
  },
  ["item", "expectedRevision", "changes"],
);
const previewOptions = {
  styleID: string(1000),
  locale: string(50),
  format: { type: "string", enum: ["html", "text"] },
  locator: string(200),
  label: {
    type: "string",
    enum: [
      "page",
      "chapter",
      "section",
      "paragraph",
      "volume",
      "issue",
      "line",
      "note",
      "figure",
      "table",
    ],
  },
} satisfies Record<string, Schema>;

interface Operation {
  description: string;
  effect: "read" | "write";
  inputSchema: Schema;
  // JSON is checked by this operation's schema before its handler is called.
  run: (input: any) => unknown;
}

const operations: Record<string, Operation> = {
  "libraries.list": {
    description: "List available library IDs and edit permissions.",
    effect: "read",
    inputSchema: object({}),
    run: () =>
      Zotero.Libraries.getAll().map((library) => ({
        libraryID: library.libraryID,
        name: library.name,
        editable: library.editable,
      })),
  },
  "selection.read": {
    description:
      "Read up to 50 selected bibliographic items from the active Zotero window.",
    effect: "read",
    inputSchema: object({}),
    run: () => {
      const pane = Zotero.getActiveZoteroPane();
      if (!pane)
        throw new CneError(
          "NO_ACTIVE_WINDOW",
          "Open a Zotero library window.",
          409,
        );
      const selected = pane
        .getSelectedItems()
        .filter((item) => item.isRegularItem() && !item.deleted);
      if (selected.length > 50)
        throw new CneError("TOO_MANY_ITEMS", "Select at most 50 items.");
      return snapshotItems(selected);
    },
  },
  "items.search": {
    description:
      "Search native Zotero title, creator and year fields within one library. Results are ordered by key; use offset/limit to page.",
    effect: "read",
    inputSchema: object(
      {
        libraryID: integer(1),
        query: string(300),
        offset: integer(),
        limit: integer(1, 50),
      },
      ["libraryID"],
    ),
    run: async ({ libraryID, query, offset = 0, limit = 25 }) => {
      if (!Zotero.Libraries.get(libraryID))
        throw new CneError(
          "LIBRARY_NOT_FOUND",
          "Unknown library. Choose a libraryID from libraries.list.",
          404,
          { libraryID },
        );
      const search = new Zotero.Search();
      search.addCondition("libraryID", "is", libraryID);
      if (query)
        search.addCondition("quicksearch-titleCreatorYear", "contains", query);
      search.addCondition("itemType", "isNot", "attachment");
      search.addCondition("itemType", "isNot", "note");
      search.addCondition("itemType", "isNot", "annotation");
      const items = (await Zotero.Items.getAsync(await search.search()))
        .filter((item) => item.isRegularItem() && !item.deleted)
        .sort((a, b) => a.key.localeCompare(b.key));
      return {
        total: items.length,
        offset,
        items: await snapshotItems(items.slice(offset, offset + limit)),
      };
    },
  },
  "items.read": {
    description:
      "Read native context, indexed creator metadata, permissions and content revisions.",
    effect: "read",
    inputSchema: object({ items: array(ref) }),
    run: async ({ items }: { items: ItemRef[] }) =>
      Promise.all(items.map(async (item) => snapshot(await resolveItem(item)))),
  },
  "items.validate": {
    description:
      "Validate proposed patches and revisions without saving. Returns proposed values and actual changes.",
    effect: "read",
    inputSchema: object({ edits: array(edit) }),
    run: async ({ edits }) =>
      Promise.all(
        edits.map(async (entry: any) => {
          const plan = planEdit({
            ...entry,
            item: await resolveItem(entry.item),
          });
          return {
            item: plan.before.item,
            revision: plan.before.revision,
            editable: plan.before.editable,
            values: plan.values,
            changes: plan.changes,
          };
        }),
      ),
  },
  "items.patch": {
    description:
      "Atomically apply field patches. Every revision must match. Null clears; fillMissing preserves existing values (including false). Returns actual changes and saved readback.",
    effect: "write",
    inputSchema: object({ edits: array(edit) }),
    run: async ({ edits }) =>
      saveEdits(
        await Promise.all(
          edits.map(async (entry: any) => ({
            ...entry,
            item: await resolveItem(entry.item),
          })),
        ),
      ),
  },
  "items.clear": {
    description:
      "Atomically clear recognized CNE metadata. Preserve native language and unrelated Extra lines. Every revision must match.",
    effect: "write",
    inputSchema: object({
      items: array(object({ item: ref, expectedRevision: string(100) })),
    }),
    run: async ({ items }) =>
      saveEdits(
        await Promise.all(
          items.map(async (entry: any) => {
            const item = await resolveItem(entry.item);
            return {
              item,
              expectedRevision: entry.expectedRevision,
              changes: Object.keys(snapshot(item).values)
                .filter((path) => path !== "language")
                .map((path) => ({ path, value: null })),
            };
          }),
        ),
      ),
  },
  "styles.list": {
    description:
      "List all installed visible styles and available preview forms.",
    effect: "read",
    inputSchema: object({}),
    run: listStyles,
  },
  "items.preview": {
    description:
      "Preview one saved item or a proposed patch without saving. Returns a first citation, its immediate repeat, and bibliography when supported.",
    effect: "read",
    inputSchema: object({ ...edit.properties, ...previewOptions }, [
      "item",
      "expectedRevision",
      "styleID",
    ]),
    run: async (input) =>
      previewEdit(
        {
          ...input,
          changes: input.changes ?? [],
          item: await resolveItem(input.item),
        },
        input,
      ),
  },
};

export function describeOperations() {
  return {
    apiVersion: "1",
    name: config.addonName,
    version,
    cneEnabled: Boolean(getPref("enable")),
    operations: Object.entries(operations).map(
      ([name, { run: _run, ...contract }]) => ({
        name,
        method: "POST",
        path: `/cne/v1/${name.replaceAll(".", "/")}`,
        ...contract,
      }),
    ),
    fields: {
      text: [...FIELD_PATHS, "originalLanguage", "language"],
      creators: CREATOR_FIELDS,
      creatorPath: "creators.{zeroBasedIndex}.{field}",
      clearValue: null,
    },
    semantics: {
      language: "Zotero's native item language.",
      originalLanguage:
        "CNE creator-language override; does not replace the native item language.",
      creators:
        "Indices follow native.creators, including every role. Re-read after any creator change.",
      generation:
        "Supply romanizations and translations yourself. CNE validates, stores and renders them; it does not call a model.",
      revisions:
        "Opaque content revisions. On conflict, read again and review the changes. Do not blindly retry.",
      errors:
        "Errors return {error: {code, message, details?}}. details.path identifies an input property or CNE field; details.item identifies the affected record. Fix invalid input before retrying. After a lost save response, read back before retrying.",
    },
  };
}

export async function executeOperation(name: string, input: unknown) {
  const operation = operations[name];
  if (!Object.hasOwn(operations, name))
    throw new CneError(
      "OPERATION_NOT_FOUND",
      "Unknown CNE operation. Use the catalog from GET /cne/v1.",
      404,
    );
  validate(operation.inputSchema, input);
  return operation.run(input);
}
