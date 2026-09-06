import { assert } from "chai";
import {
  registerEndpoints,
  type Server,
} from "../../src/modules/cne/agent/http";
import {
  snapshot,
  type ItemSnapshot,
} from "../../src/modules/cne/operations/items";
import { createItem, edit } from "./helpers";
import { httpClient, TOKEN } from "./http-client";

describe("CNE local HTTP adapter in Zotero", function () {
  this.timeout(15000);
  let cleanup: () => void;
  let item: Zotero.Item;
  let request: ReturnType<typeof httpClient>;
  let token = TOKEN;
  const server = Zotero.Server as unknown as Server;

  before(async function () {
    // Never run against or shut down the user's normal Zotero listener.
    assert.equal(Zotero.Prefs.get("httpServer.port"), 23124);
    await server.init();
    assert.equal(server.port, 23124);
    request = httpClient(`http://127.0.0.1:${server.port}`);
    cleanup = registerEndpoints(server, () => token);
    item = await createItem();
  });

  after(async function () {
    cleanup?.();
    if (item) await item.eraseTx();
  });

  it("requires its own token even for discovery and library reads", async function () {
    const unauthorized = await request("/cne/v1", undefined, "");
    assert.equal(unauthorized.status, 403);
    assert.equal(unauthorized.json().error.code, "UNAUTHORIZED");
    assert.include(unauthorized.json().error.message, "Copy connection");
    assert.equal(
      (
        await request(
          "/cne/v1/items/read",
          { items: [snapshot(item).item] },
          "Bearer wrong",
        )
      ).status,
      403,
    );
    const response = await request("/cne/v1");
    assert.equal(response.status, 200, response.text);
    assert.equal(response.json().result.apiVersion, "1");
    assert.notInclude(response.text, TOKEN);
  });

  it("exercises discovery, selected-item read, pinyin preview, save and readback over HTTP", async function () {
    await Zotero.getActiveZoteroPane()!.selectItem(item.id);
    const selection = await request("/cne/v1/selection/read", {});
    assert.equal(selection.status, 200, selection.text);
    assert.deepEqual(selection.json().result[0].item, snapshot(item).item);
    const change = edit(item, [
      { path: "title.romanized", value: "Zhongguo lishi yanjiu" },
    ]);
    const preview = await request("/cne/v1/items/preview", {
      ...change,
      styleID: "http://www.zotero.org/styles/apa-7th-cne",
      format: "text",
    });
    assert.equal(preview.status, 200, preview.text);
    assert.include(preview.json().result.bibliography, "Zhongguo lishi yanjiu");
    const saved = await request("/cne/v1/items/patch", { edits: [change] });
    assert.equal(saved.status, 200, saved.text);
    const read = await request("/cne/v1/items/read", { items: [change.item] });
    assert.deepEqual(read.json().result[0], saved.json().result[0].current);
    const stale = await request("/cne/v1/items/patch", { edits: [change] });
    assert.equal(stale.status, 409, stale.text);
    assert.equal(stale.json().error.code, "REVISION_CONFLICT");
    assert.deepEqual(stale.json().error.details.current, read.json().result[0]);
  });

  it("rejects web origins and undeclared JSON properties", async function () {
    const browser = await request("/cne/v1", undefined, `Bearer ${TOKEN}`, {
      Origin: "https://example.com",
    });
    assert.include([0, 403], browser.status);
    const malformed = await request("/cne/v1/items/read", {
      items: [snapshot(item).item],
      surprise: true,
    });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.json().error.code, "INVALID_INPUT");
  });

  it("finds missing romanization across pages, batch-fills it, previews translations and clears a short title", async function () {
    const fixtures: Zotero.Item[] = [];
    // Supplied readings test the client workflow, not a model's language quality.
    const query = "CNE README workflow fixture";
    try {
      for (let index = 0; index < 3; index++) {
        const fixture = await createItem();
        fixtures.push(fixture);
        fixture.setField("title", `${query} ${index}: 中国历史研究`);
        if (index === 0) {
          fixture.setField(
            "extra",
            `${fixture.getField("extra")}\ncne-title-romanized: Existing reading`,
          );
        }
        await fixture.saveTx();
      }
      const existing = snapshot(fixtures[0]);
      const found: ItemSnapshot[] = [];
      for (let offset = 0; offset < 3; offset++) {
        const response = await request("/cne/v1/items/search", {
          libraryID: fixtures[0].libraryID,
          query,
          offset,
          limit: 1,
        });
        assert.equal(response.status, 200, response.text);
        const page = response.json().result;
        assert.equal(page.total, 3);
        assert.lengthOf(page.items, 1);
        found.push(page.items[0]);
      }
      assert.sameMembers(
        found.map(({ item }) => item.key),
        fixtures.map(({ key }) => key),
      );
      const missing = found.filter(({ values }) => !values["title.romanized"]);
      assert.lengthOf(missing, 2);
      const edits = missing.map((record) => ({
        item: record.item,
        expectedRevision: record.revision,
        mode: "fillMissing",
        changes: [
          { path: "title.romanized", value: "Zhongguo lishi yanjiu" },
          { path: "title.english", value: "Studies in Chinese history" },
          { path: "title.romanizedShort", value: "Lishi yanjiu" },
          { path: "creators.0.lastRomanized", value: "Wang" },
          { path: "creators.0.firstRomanized", value: "Xiaobo" },
        ],
      }));
      const validation = await request("/cne/v1/items/validate", { edits });
      assert.equal(validation.status, 200, validation.text);
      assert.lengthOf(validation.json().result, 2);
      const styles = await request("/cne/v1/styles/list", {});
      const styleIDs = styles.json().result.map(({ id }: { id: string }) => id);
      for (const name of [
        "chicago-notes-bibliography-cne",
        "apa-7th-cne",
        "modern-language-association-9th-in-text-cne",
      ]) {
        const styleID = `http://www.zotero.org/styles/${name}`;
        assert.include(styleIDs, styleID);
        const preview = await request("/cne/v1/items/preview", {
          ...edits[0],
          styleID,
          format: "text",
        });
        assert.equal(preview.status, 200, preview.text);
        assert.include(
          preview.json().result.bibliography,
          "Zhongguo lishi yanjiu",
        );
      }
      const beforeSave = await request("/cne/v1/items/read", {
        items: found.map(({ item }) => item),
      });
      assert.deepEqual(beforeSave.json().result, found);
      const saved = await request("/cne/v1/items/patch", { edits });
      assert.equal(saved.status, 200, saved.text);
      const readback = await request("/cne/v1/items/read", {
        items: missing.map(({ item }) => item),
      });
      assert.deepEqual(
        readback.json().result,
        saved
          .json()
          .result.map(({ current }: { current: ItemSnapshot }) => current),
      );
      for (const current of readback.json().result as ItemSnapshot[]) {
        assert.equal(
          current.values["title.romanized"],
          "Zhongguo lishi yanjiu",
        );
        assert.equal(current.values["creators.0.lastRomanized"], "Wang");
        assert.equal(current.values["creators.0.firstRomanized"], "Xiaobo");
        assert.equal(
          current.values["title.english"],
          "Studies in Chinese history",
        );
      }
      assert.deepEqual(snapshot(fixtures[0]), existing);
      const current = readback.json().result[0] as ItemSnapshot;
      const correction = await request("/cne/v1/items/patch", {
        edits: [
          {
            item: current.item,
            expectedRevision: current.revision,
            changes: [
              { path: "title.english", value: "Research on Chinese history" },
              { path: "title.romanizedShort", value: null },
            ],
          },
        ],
      });
      assert.equal(correction.status, 200, correction.text);
      const corrected = await request("/cne/v1/items/read", {
        items: [current.item],
      });
      assert.equal(
        corrected.json().result[0].values["title.english"],
        "Research on Chinese history",
      );
      assert.notProperty(
        corrected.json().result[0].values,
        "title.romanizedShort",
      );
      assert.equal(
        corrected.json().result[0].values["title.romanized"],
        "Zhongguo lishi yanjiu",
      );
    } finally {
      for (const fixture of fixtures) await fixture.eraseTx();
    }
  });

  it("revokes the old token immediately without replacing routes", async function () {
    token = "cne-new-fixture-token";
    assert.equal((await request("/cne/v1")).status, 403);
    assert.equal(
      (await request("/cne/v1", undefined, `Bearer ${token}`)).status,
      200,
    );
    token = TOKEN;
  });

  it("rejects route collisions and removes only routes it still owns", async function () {
    assert.throws(() => registerEndpoints(server, () => TOKEN), /already owns/);
    const original = server.Endpoints["/cne/v1"];
    class OtherEndpoint extends original {}
    server.Endpoints["/cne/v1"] = OtherEndpoint;
    cleanup();
    assert.strictEqual(server.Endpoints["/cne/v1"], OtherEndpoint);
    assert.notProperty(server.Endpoints, "/cne/v1/items/read");
    delete server.Endpoints["/cne/v1"];
    assert.equal(server.port, 23124);
    cleanup = registerEndpoints(server, () => token);
    assert.equal((await request("/cne/v1")).status, 200);
  });
});
