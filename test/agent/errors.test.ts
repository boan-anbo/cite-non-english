import { assert } from "chai";
import {
  registerEndpoints,
  type Server,
} from "../../src/modules/cne/agent/http";
import { snapshot } from "../../src/modules/cne/operations/items";
import { createItem, edit } from "./helpers";
import { httpClient, TOKEN } from "./http-client";

describe("CNE actionable errors over HTTP", function () {
  this.timeout(15000);
  let cleanup: () => void;
  let request: ReturnType<typeof httpClient>;
  let first: Zotero.Item, second: Zotero.Item;

  before(async function () {
    const server = Zotero.Server as unknown as Server;
    assert.equal(Zotero.Prefs.get("httpServer.port"), 23124);
    await server.init();
    assert.equal(server.port, 23124);
    request = httpClient(`http://127.0.0.1:${server.port}`);
    cleanup = registerEndpoints(server, () => TOKEN);
    first = await createItem();
    second = await createItem();
  });

  after(async function () {
    cleanup?.();
    if (first) await first.eraseTx();
    if (second) await second.eraseTx();
  });

  async function failure(
    path: string,
    input: unknown,
    code: string,
    status = 400,
  ) {
    const response = await request(`/cne/v1/${path}`, input);
    assert.equal(response.status, status, response.text);
    const { error, result } = response.json();
    assert.isUndefined(result);
    assert.equal(error.code, code);
    assert.isString(error.message);
    return error;
  }

  it("locates missing and unknown properties, and gives enum choices for correction", async function () {
    const proposal = edit(first, []);
    const missing = await failure(
      "items/patch",
      {
        edits: [{ item: proposal.item, changes: [] }],
      },
      "INVALID_INPUT",
    );
    assert.equal(missing.details.path, "input.edits[0].expectedRevision");
    const unknown = await failure(
      "items/patch",
      {
        edits: [{ ...proposal, typo: true }],
      },
      "INVALID_INPUT",
    );
    assert.equal(unknown.details.path, "input.edits[0].typo");
    const invalid = await failure(
      "items/patch",
      {
        edits: [{ ...proposal, mode: "fill-missing" }],
      },
      "INVALID_INPUT",
    );
    assert.equal(invalid.details.path, "input.edits[0].mode");
    assert.sameMembers(invalid.details.enum, ["replace", "fillMissing"]);
    assert.include(invalid.message, "fillMissing");
    const corrected = await request("/cne/v1/items/validate", {
      edits: [
        {
          ...proposal,
          mode: invalid.details.enum.find((v: string) => v === "fillMissing"),
        },
      ],
    });
    assert.equal(corrected.status, 200, corrected.text);
  });

  it("reports concrete types, sizes and bounds without echoing input text", async function () {
    const ref = snapshot(first).item;
    for (const [input, path, constraint] of [
      [{ libraryID: String(ref.libraryID) }, "libraryID", { type: "integer" }],
      [{ libraryID: 0 }, "libraryID", { minimum: 1 }],
      [{ libraryID: ref.libraryID, limit: 51 }, "limit", { maximum: 50 }],
      [{ libraryID: ref.libraryID, query: "" }, "query", { minLength: 1 }],
      [
        { libraryID: ref.libraryID, query: "x".repeat(301) },
        "query",
        { maxLength: 300 },
      ],
    ] as const) {
      const error = await failure("items/search", input, "INVALID_INPUT");
      assert.equal(error.details.path, `input.${path}`);
      assert.include(error.details, constraint);
      assert.notInclude(JSON.stringify(error), "x".repeat(301));
    }
    const batch = await failure(
      "items/read",
      {
        items: Array.from({ length: 51 }, () => ref),
      },
      "INVALID_INPUT",
    );
    assert.equal(batch.details.path, "input.items");
    assert.equal(batch.details.maxItems, 50);
    const empty = await failure("items/read", { items: [] }, "INVALID_INPUT");
    assert.equal(empty.details.minItems, 1);
    const key = await failure(
      "items/read",
      {
        items: [{ ...ref, key: "bad-key" }],
      },
      "INVALID_INPUT",
    );
    assert.equal(key.details.path, "input.items[0].key");
    assert.equal(key.details.pattern, "^[A-Z0-9]{8}$");
  });

  it("identifies the bad item and field in a batch, then accepts the corrected edits", async function () {
    const before = [snapshot(first), snapshot(second)];
    const firstEdit = edit(first, [
      { path: "title.romanized", value: "Lishi" },
    ]);
    for (const [path, value, code, details] of [
      ["title.pinyin", "Lishi", "INVALID_FIELD", {}],
      [
        "creators.1.lastRomanized",
        "Wang",
        "INVALID_CREATOR",
        { creatorCount: 1 },
      ],
      [
        "creators.0.optionsForceComma",
        "true",
        "INVALID_VALUE",
        { type: "boolean" },
      ],
      ["title.romanized", " ", "INVALID_VALUE", { type: "string" }],
    ] as const) {
      const error = await failure(
        "items/patch",
        {
          edits: [firstEdit, edit(second, [{ path, value }])],
        },
        code,
      );
      assert.deepEqual(error.details.item, before[1].item);
      assert.equal(error.details.path, path);
      assert.include(error.details, details);
      assert.deepEqual([snapshot(first), snapshot(second)], before);
    }
    const corrected = await request("/cne/v1/items/patch", {
      edits: [
        firstEdit,
        edit(second, [{ path: "title.romanized", value: "Lishi" }]),
      ],
    });
    assert.equal(corrected.status, 200, corrected.text);
    const readback = await request("/cne/v1/items/read", {
      items: before.map(({ item }) => item),
    });
    assert.deepEqual(
      readback.json().result,
      corrected.json().result.map((entry: any) => entry.current),
    );
  });

  it("identifies missing resources and points back to discovery", async function () {
    const libraryID = 99999999;
    const library = await failure(
      "items/search",
      { libraryID },
      "LIBRARY_NOT_FOUND",
      404,
    );
    assert.equal(library.details.libraryID, libraryID);
    assert.include(library.message, "libraries.list");
    const ref = { ...snapshot(first).item, key: "ZZZZZZZZ" };
    const missing = await failure(
      "items/read",
      { items: [snapshot(first).item, ref] },
      "ITEM_NOT_FOUND",
      404,
    );
    assert.deepEqual(missing.details.item, ref);
    const styleID = "http://www.zotero.org/styles/cne-missing-test-style";
    const style = await failure(
      "items/preview",
      { ...edit(first, []), styleID },
      "STYLE_NOT_FOUND",
      404,
    );
    assert.equal(style.details.styleID, styleID);
    assert.include(style.message, "styles.list");
  });

  it("identifies duplicate items without changing them", async function () {
    const before = snapshot(first);
    const proposal = edit(first, [{ path: "title.english", value: "History" }]);
    const error = await failure(
      "items/patch",
      { edits: [proposal, proposal] },
      "DUPLICATE_ITEM",
    );
    assert.deepEqual(error.details.item, before.item);
    assert.deepEqual(snapshot(first), before);
  });

  it("gives recovery guidance for an unexpected save failure and rolls the batch back", async function () {
    const before = [snapshot(first), snapshot(second)];
    await Zotero.DB.queryAsync(
      `CREATE TEMP TRIGGER cne_http_error BEFORE UPDATE ON items WHEN NEW.itemID = ${second.id} BEGIN SELECT RAISE(ABORT, 'CNE HTTP error fixture'); END`,
    );
    try {
      const error = await failure(
        "items/patch",
        {
          edits: [first, second].map((item) =>
            edit(item, [
              { path: "title.english", value: "Unsaved translation" },
            ]),
          ),
        },
        "INTERNAL_ERROR",
        500,
      );
      assert.match(error.message, /read.*before retrying/i);
      assert.include(error.message, "error log");
      assert.notInclude(JSON.stringify(error), "CNE HTTP error fixture");
      assert.notProperty(error, "stack");
      const readback = await request("/cne/v1/items/read", {
        items: before.map(({ item }) => item),
      });
      assert.deepEqual(readback.json().result, before);
    } finally {
      await Zotero.DB.queryAsync("DROP TRIGGER cne_http_error");
    }
  });
});
