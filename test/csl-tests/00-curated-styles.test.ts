import { assert } from "chai";

// Run before global fixture setup, which explicitly installs styles for tests.
// Scaffold waits for plugin startup, including its bundled-style installer.
describe("Bundled style installation on startup", function () {
  it("installs the current contents of every bundled style", async function () {
    let root = Zotero.DataDirectory.dir;
    for (let level = 0; level < 3; level++) {
      const parent = PathUtils.parent(root);
      if (!parent) throw new Error("Missing CSL test project root");
      root = parent;
    }
    const bundled = await IOUtils.getChildren(
      PathUtils.join(root, "styles", "cne"),
    );
    const files = bundled.filter((path) => path.endsWith(".csl"));
    assert.isNotEmpty(files);
    for (const path of files) {
      const installed = PathUtils.join(
        Zotero.DataDirectory.dir,
        "styles",
        PathUtils.filename(path),
      );
      assert.equal(
        await IOUtils.readUTF8(installed),
        await IOUtils.readUTF8(path),
      );
    }
  });
});
