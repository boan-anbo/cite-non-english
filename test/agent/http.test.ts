import { assert } from "chai";
import {
  registerEndpoints,
  type Server,
} from "../../src/modules/cne/agent/http";
import { snapshot } from "../../src/modules/cne/operations/items";
import { createItem, edit } from "./helpers";

// Test credentials only, scoped to the disposable scaffold profile.
const TOKEN = "cne-fixture-token";

describe("CNE local HTTP adapter in Zotero", function () {
  this.timeout(15000);
  let cleanup: () => void;
  let item: Zotero.Item;
  let base: string;
  let token = TOKEN;
  const server = Zotero.Server as unknown as Server;

  async function request(
    path: string,
    data?: unknown,
    authorization = `Bearer ${TOKEN}`,
    extraHeaders = {},
  ) {
    const response = await Zotero.HTTP.request(
      data === undefined ? "GET" : "POST",
      `${base}${path}`,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CNE-Integration-Test/1",
          Authorization: authorization,
          ...extraHeaders,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
        successCodes: false,
      },
    );
    return {
      status: response.status,
      text: response.responseText,
      json: () => JSON.parse(response.responseText),
    };
  }

  before(async function () {
    // Never run against or shut down the user's normal Zotero listener.
    assert.equal(Zotero.Prefs.get("httpServer.port"), 23124);
    await server.init();
    assert.equal(server.port, 23124);
    base = `http://127.0.0.1:${server.port}`;
    cleanup = registerEndpoints(server, () => token);
    item = await createItem();
  });

  after(async function () {
    cleanup?.();
    if (item) await item.eraseTx();
  });

  it("requires its own token even for discovery and library reads", async function () {
    assert.equal((await request("/cne/v1", undefined, "")).status, 403);
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
