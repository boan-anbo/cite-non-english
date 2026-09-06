import { assert } from "chai";
import { getPref, setPref } from "../../src/utils/prefs";
import {
  registerEndpoints,
  type Server,
} from "../../src/modules/cne/agent/http";
import {
  agentAccessStatus,
  agentConnection,
  revokeAgentToken,
  stopAgentAccess,
  syncAgentAccess,
} from "../../src/modules/cne/agent/access";

describe("CNE opt-in access lifecycle", function () {
  it("reports an endpoint collision as its actual cause instead of a generic port failure", async function () {
    const enabled = getPref("agentEnabled");
    const token = getPref("agentToken");
    const server = Zotero.Server as unknown as Server;
    let cleanup: (() => void) | undefined;
    try {
      assert.equal(Zotero.Prefs.get("httpServer.port"), 23124);
      await server.init();
      cleanup = registerEndpoints(server, () => "cne-collision-test-token");
      setPref("agentEnabled", true);
      await syncAgentAccess();
      assert.include(agentAccessStatus(), "ROUTE_CONFLICT");
      assert.include(agentAccessStatus(), "/cne/v1");
      assert.throws(agentConnection, /Enable/);
    } finally {
      stopAgentAccess();
      cleanup?.();
      setPref("agentEnabled", enabled);
      setPref("agentToken", token);
    }
  });

  it("starts disabled, creates a secret connection, rotates it and removes its routes", async function () {
    const enabled = getPref("agentEnabled"),
      token = getPref("agentToken");
    try {
      setPref("agentEnabled", false);
      setPref("agentToken", "");
      await syncAgentAccess();
      assert.equal(agentAccessStatus(), "Disabled");
      assert.throws(agentConnection, /Enable/);
      assert.notProperty(Zotero.Server.Endpoints, "/cne/v1");
      setPref("agentEnabled", true);
      await syncAgentAccess();
      const first = agentConnection();
      assert.match(first.headers.Authorization, /^Bearer [a-f0-9]{64}$/);
      assert.equal(first.baseURL, "http://127.0.0.1:23124/cne/v1");
      revokeAgentToken();
      assert.notEqual(
        agentConnection().headers.Authorization,
        first.headers.Authorization,
      );
      setPref("agentEnabled", false);
      await syncAgentAccess();
      assert.notProperty(Zotero.Server.Endpoints, "/cne/v1");
      assert.equal(Zotero.Server.port, 23124);
    } finally {
      stopAgentAccess();
      setPref("agentEnabled", enabled);
      setPref("agentToken", token);
    }
  });
});
