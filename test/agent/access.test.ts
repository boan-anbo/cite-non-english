import { assert } from "chai";
import { getPref, setPref } from "../../src/utils/prefs";
import {
  agentAccessStatus,
  agentConnection,
  revokeAgentToken,
  stopAgentAccess,
  syncAgentAccess,
} from "../../src/modules/cne/agent/access";

describe("CNE opt-in access lifecycle", function () {
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
