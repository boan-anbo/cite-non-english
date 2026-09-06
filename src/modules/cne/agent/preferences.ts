import { getPref, setPref } from "../../../utils/prefs";
import {
  agentAccessStatus,
  agentConnection,
  revokeAgentToken,
  syncAgentAccess,
} from "./access";

export function bindAgentPreferences(window: Window): void {
  const doc = window.document;
  const enable = doc.querySelector("#cne-agent-enable") as XUL.Checkbox;
  const status = doc.querySelector("#cne-agent-status")!;
  const copy = doc.querySelector("#cne-agent-copy") as XUL.Button;
  const revoke = doc.querySelector("#cne-agent-revoke") as XUL.Button;
  if (!enable) return;
  const refresh = () => {
    enable.checked = Boolean(getPref("agentEnabled"));
    status.textContent = agentAccessStatus();
    copy.disabled = !agentAccessStatus().startsWith("http://");
    revoke.disabled = copy.disabled;
  };
  enable.addEventListener("command", async () => {
    setPref("agentEnabled", enable.checked);
    await syncAgentAccess();
    refresh();
  });
  copy.addEventListener("command", () => {
    new ztoolkit.Clipboard()
      .addText(JSON.stringify(agentConnection(), null, 2), "text/unicode")
      .copy();
    status.textContent =
      "Connection copied. Share it only with agents you trust.";
  });
  revoke.addEventListener("command", () => {
    revokeAgentToken();
    refresh();
    status.textContent =
      "Previous token revoked. Copy the new connection to reconnect your agent.";
  });
  refresh();
}
