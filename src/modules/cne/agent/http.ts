import { describeOperations, executeOperation } from "../operations/catalog";
import { CneError, errorResult } from "../operations/errors";

export interface Request {
  method: string;
  pathname: string;
  headers: Record<string, string>;
  data?: unknown;
}
export interface Endpoint {
  supportedMethods: string[];
  supportedDataTypes: string[];
  init(request: Request): Promise<[number, Record<string, string>, string]>;
}
export interface Server {
  Endpoints: Record<string, new () => Endpoint>;
  readonly port: number;
  init(): Promise<void> | void;
}

function authorize(request: Request, token: string): void {
  const headers = Object.fromEntries(
    Object.entries(request.headers).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  // Agents use local HTTP clients. Web pages, including local-file pages, get no access.
  if (
    headers.origin ||
    (headers["sec-fetch-site"] && headers["sec-fetch-site"] !== "none")
  ) {
    throw new CneError(
      "FORBIDDEN_ORIGIN",
      "Browser-origin requests are not allowed. Use a local HTTP client on the Zotero host.",
      403,
    );
  }
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(headers.host ?? "")) {
    throw new CneError(
      "FORBIDDEN_HOST",
      "Use the loopback baseURL from Copy connection in Zotero Settings → CNE → Agent access.",
      403,
    );
  }
  const supplied = headers.authorization?.replace(/^Bearer /, "") ?? "";
  let difference = token.length ^ supplied.length;
  for (let i = 0; i < token.length; i++)
    difference |= token.charCodeAt(i) ^ (supplied.charCodeAt(i) || 0);
  if (!token || difference)
    throw new CneError(
      "UNAUTHORIZED",
      "Use the Authorization header from Copy connection in Zotero Settings → CNE → Agent access. Recopy after token revocation.",
      403,
    );
}

/** Register only CNE-owned routes; never change or stop Zotero's shared listener. */
export function registerEndpoints(
  server: Server,
  getToken: () => string,
): () => void {
  const paths = new Map<string, string | null>([["/cne/v1", null]]);
  for (const operation of describeOperations().operations)
    paths.set(operation.path, operation.name);
  for (const path of paths.keys()) {
    if (server.Endpoints[path])
      throw new CneError(
        "ROUTE_CONFLICT",
        `An endpoint already owns ${path}.`,
        409,
      );
  }
  let active = true;
  const owned = new Map<string, new () => Endpoint>();
  for (const [path, name] of paths) {
    const Constructor = class implements Endpoint {
      supportedMethods = [name ? "POST" : "GET"];
      supportedDataTypes = ["application/json"];
      async init(
        request: Request,
      ): Promise<[number, Record<string, string>, string]> {
        const headers = {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        };
        try {
          if (!active)
            throw new CneError(
              "DISABLED",
              "CNE agent access is disabled.",
              503,
            );
          authorize(request, getToken());
          if (!this.supportedMethods.includes(request.method))
            throw new CneError(
              "INVALID_METHOD",
              "Use the method declared by discovery.",
            );
          if (
            request.data &&
            new TextEncoder().encode(JSON.stringify(request.data)).byteLength >
              1024 * 1024
          )
            throw new CneError(
              "INPUT_TOO_LARGE",
              "Request data must be at most 1 MiB.",
            );
          const result = name
            ? await executeOperation(name, request.data)
            : describeOperations();
          return [200, headers, JSON.stringify({ result })];
        } catch (error) {
          if (!(error instanceof CneError))
            Zotero.logError(
              error instanceof Error
                ? error
                : new Error(`CNE operation failed: ${String(error)}`),
            );
          return [
            error instanceof CneError ? error.status : 500,
            headers,
            JSON.stringify(errorResult(error)),
          ];
        }
      }
    };
    owned.set(path, Constructor);
    server.Endpoints[path] = Constructor;
  }
  return () => {
    active = false;
    for (const [path, constructor] of owned)
      if (server.Endpoints[path] === constructor) delete server.Endpoints[path];
  };
}
