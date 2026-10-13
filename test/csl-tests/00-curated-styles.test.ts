import { assert } from "chai";
import { installCuratedStylesSilently } from "../../src/modules/cne/styles/installCuratedStyles";

function projectRoot(): string {
  let root = Zotero.DataDirectory.dir;
  for (let level = 0; level < 3; level++) {
    const parent = PathUtils.parent(root);
    if (!parent) throw new Error("Missing CSL test project root");
    root = parent;
  }
  return root;
}

// Run before global fixture setup, which explicitly installs styles for tests.
// Scaffold waits for plugin startup, including its bundled-style installer.
describe("Bundled style installation on startup", function () {
  it("installs the current contents of every bundled style", async function () {
    const bundled = await IOUtils.getChildren(
      PathUtils.join(projectRoot(), "styles", "cne"),
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

  it("installs missing and updates outdated styles from a packaged archive", async function () {
    const root = projectRoot();
    const files = (
      await IOUtils.getChildren(PathUtils.join(root, "styles", "cne"))
    ).filter((path) => path.endsWith(".csl"));
    assert.lengthOf(files, 7);
    const temporaryDirectory = await IOUtils.createUniqueDirectory(
      PathUtils.tempDir,
      "cne-packaged-styles",
    );
    const archive = Zotero.File.pathToFile(
      PathUtils.join(temporaryDirectory, "cne.xpi"),
    );
    const zip = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
    try {
      zip.open(archive, 0x02 | 0x08 | 0x20);
      try {
        for (const path of files) {
          zip.addEntryFile(
            `styles/cne/${PathUtils.filename(path)}`,
            Ci.nsIZipWriter.COMPRESSION_DEFAULT,
            Zotero.File.pathToFile(path),
            false,
          );
        }
      } finally {
        zip.close();
      }
      const archiveRoot = `jar:${Services.io.newFileURI(archive).spec}!/`;
      for (const state of ["missing", "outdated"]) {
        for (const path of files) {
          const installed = PathUtils.join(
            Zotero.DataDirectory.dir,
            "styles",
            PathUtils.filename(path),
          );
          if (state === "missing") {
            await IOUtils.remove(installed);
          } else {
            await IOUtils.writeUTF8(
              installed,
              (await IOUtils.readUTF8(path)).replace(
                "</title>",
                " (outdated)</title>",
              ),
            );
          }
        }
        await Zotero.Styles.reinit();
        await installCuratedStylesSilently(archiveRoot);
        for (const path of files) {
          const filename = PathUtils.filename(path);
          const installed = PathUtils.join(
            Zotero.DataDirectory.dir,
            "styles",
            filename,
          );
          assert.isTrue(
            await IOUtils.exists(installed),
            `${state}: ${filename} must be installed from the archive`,
          );
          assert.equal(
            await IOUtils.readUTF8(installed),
            await IOUtils.readUTF8(path),
            `${state}: ${filename}`,
          );
          const id = `http://www.zotero.org/styles/${filename.slice(0, -4)}`;
          assert.include(
            Zotero.Styles.getVisible().map((style) => style.styleID),
            id,
            `${state}: ${filename} must be visible in the style registry`,
          );
        }
      }
    } finally {
      const unpackedRoot = Services.io.newFileURI(
        Zotero.File.pathToFile(root),
      ).spec;
      await installCuratedStylesSilently(`${unpackedRoot}/`);
      await IOUtils.remove(temporaryDirectory, { recursive: true });
    }
  });
});
