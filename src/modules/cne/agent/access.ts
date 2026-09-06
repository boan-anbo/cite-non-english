import { getPref, setPref } from "../../../utils/prefs";
import { registerEndpoints, type Server } from "./http";

let unregister: (() => void) | undefined;
let generation = 0;
let status = "Disabled";

function token(): string {
  return String(getPref("agentToken") || "");
}
function newToken(): string {
  const bytes = new Uint8Array(32);
  Zotero.getMainWindow().crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function revokeAgentToken(): void {
  setPref("agentToken", newToken());
}

export function stopAgentAccess(): void {
  generation++;
  unregister?.();
  unregister = undefined;
  status = "Disabled";
}

export async function syncAgentAccess(): Promise<void> {
  stopAgentAccess();
  if (!getPref("agentEnabled")) return;
  const starting = generation;
  try {
    if (!token()) revokeAgentToken();
    const server = Zotero.Server as unknown as Server;
    await server.init();
    // The user may disable access while the host server is starting.
    if (starting !== generation) return;
    const port = server.port;
    unregister = registerEndpoints(server, token);
    status = `http://127.0.0.1:${port}/cne/v1`;
  } catch {
    status =
      "Could not start agent access. Check the Zotero local server and port.";
  }
}

export function agentAccessStatus(): string {
  return status;
}

export function agentConnection() {
  if (!unregister) throw new Error("Enable CNE agent access first.");
  return {
    baseURL: status,
    headers: { Authorization: `Bearer ${token()}` },
    discovery: "GET /cne/v1",
  };
}
