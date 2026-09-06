import { assert } from "chai";

// Test credentials only, scoped to the disposable scaffold profile.
export const TOKEN = "cne-fixture-token";

export function httpClient(base: string) {
  return async function request(
    path: string,
    data?: unknown,
    authorization = `Bearer ${TOKEN}`,
    extraHeaders = {},
  ) {
    assert.equal(Zotero.Prefs.get("httpServer.port"), 23124);
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
  };
}
