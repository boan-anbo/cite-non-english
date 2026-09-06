import { assert } from "chai";
import {
  renderCneSection,
  disposeCneSection,
} from "../../src/modules/cne/section/renderer/mainRenderer";
import { snapshot } from "../../src/modules/cne/operations/items";
import { createItem, patch } from "./helpers";

describe("CNE sidebar and agent coexistence", function () {
  this.timeout(15000);
  let item: Zotero.Item;
  let body: HTMLElement;
  const field = (key: string) =>
    body.querySelector<HTMLInputElement>(`[data-bind="${key}"]`)!;
  const type = (key: string, text: string) => {
    const input = field(key);
    input.value = text;
    const event = body.ownerDocument!.createEvent("HTMLEvents");
    event.initEvent("input", true, false);
    input.dispatchEvent(event);
  };
  const render = () =>
    renderCneSection({ body, item, editable: true, tabType: "library" });

  beforeEach(async function () {
    try {
      Object.assign(globalThis, {
        ztoolkit: Zotero.CiteNonEnglish.data.ztoolkit,
        addon: Zotero.CiteNonEnglish,
      });
      item = await createItem();
      const doc = Zotero.getMainWindow().document;
      body = doc.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "div",
      ) as HTMLElement;
      doc.documentElement!.append(body);
      render();
    } catch (error) {
      assert.fail(`Sidebar setup: ${String(error)}`);
    }
  });

  afterEach(async function () {
    disposeCneSection(body);
    body.remove();
    await Zotero.Promise.delay(600);
    await item.eraseTx();
  });

  it("updates visible fields after an agent save without discarding ongoing typing or rebinding on render", async function () {
    type("title.english", "My translation");
    const input = field("title.english");
    await patch(item, [{ path: "title.romanized", value: "Lishi" }]);
    render();
    assert.strictEqual(field("title.english"), input);
    assert.equal(field("title.romanized").value, "Lishi");
    assert.equal(input.value, "My translation");
    await Zotero.Promise.delay(900);
    assert.equal(snapshot(item).values["title.english"], "My translation");
    assert.equal(snapshot(item).values["title.romanized"], "Lishi");
  });

  it("displays a conflict and retains typed text until explicit discard", async function () {
    type("title.romanized", "Local reading");
    await patch(item, [{ path: "title.romanized", value: "Agent reading" }]);
    await Zotero.Promise.delay(800);
    const error = body.querySelector<HTMLElement>(".cne-save-error")!;
    assert.isFalse(error.hidden);
    assert.equal(field("title.romanized").value, "Local reading");
    assert.equal(snapshot(item).values["title.romanized"], "Agent reading");
    error.querySelector<HTMLButtonElement>("button")!.click();
    assert.isTrue(error.hidden);
    assert.equal(field("title.romanized").value, "Agent reading");
  });

  it("disables textareas as well as other controls in a read-only pane", function () {
    renderCneSection({ body, item, editable: false, tabType: "library" });
    for (const control of body.querySelectorAll<HTMLInputElement>(
      "input, textarea, select, button",
    ))
      assert.isTrue(control.disabled);
  });

  it("refreshes creator fields and retains correct bindings after external name changes", async function () {
    item.setCreators([
      { lastName: "王", firstName: "小波", creatorType: "author" },
      { lastName: "李", firstName: "英", creatorType: "editor" },
    ]);
    await item.saveTx();
    assert.exists(field("author-1.lastRomanized"));
    type("author-1.lastRomanized", "Li");
    await Zotero.Promise.delay(900);
    assert.equal(snapshot(item).values["creators.1.lastRomanized"], "Li");
    assert.notProperty(snapshot(item).values, "creators.0.lastRomanized");
  });
});
