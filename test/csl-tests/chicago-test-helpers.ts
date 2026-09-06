export const CHICAGO_STYLES = [
  "chicago-notes-bibliography",
  "chicago-shortened-notes-bibliography",
  "chicago-author-date",
] as const;

// The retained upstream templates are the oracle for native Zotero fields.
export async function installRetainedChicagoStyles() {
  let root = Zotero.DataDirectory.dir;
  for (let level = 0; level < 3; level++) {
    const parent = PathUtils.parent(root);
    if (!parent) throw new Error("Missing CSL test project root");
    root = parent;
  }
  for (const name of CHICAGO_STYLES) {
    await IOUtils.copy(
      PathUtils.join(root, "styles", "templates", `${name}-template.csl`),
      PathUtils.join(Zotero.DataDirectory.dir, "styles", `${name}.csl`),
    );
  }
  await Zotero.Styles.reinit();
}
