declare const rootURI: string;
declare const Services: any;
declare const PathUtils: any;
declare const IOUtils: any;

type CuratedStyle = {
  id: string;
  title: string;
  filename: string;
};

const CURATED_STYLES: CuratedStyle[] = [
  {
    id: "http://www.zotero.org/styles/chicago-notes-bibliography-cne",
    title: "Chicago Manual of Style 18th edition (notes and bibliography) - CNE",
    filename: "chicago-notes-bibliography-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/chicago-author-date-cne",
    title: "Chicago Manual of Style 18th edition (author-date) - CNE",
    filename: "chicago-author-date-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/apa-7th-cne",
    title: "APA 7th edition - CNE",
    filename: "apa-7th-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/modern-language-association-8th-cne",
    title: "MLA 8th edition - CNE",
    filename: "modern-language-association-8th-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/modern-language-association-9th-in-text-cne",
    title: "MLA 9th edition (in-text) - CNE",
    filename: "modern-language-association-9th-in-text-cne.csl",
  },
  {
    id: "http://www.zotero.org/styles/modern-language-association-9th-notes-cne",
    title: "MLA 9th edition (notes and bibliography) - CNE",
    filename: "modern-language-association-9th-notes-cne.csl",
  },
];

/**
 * Copy bundled CNE styles into the user's Zotero profile if they are missing or outdated.
 * This mirrors the strategy used in tests (IOUtils.copy) and avoids user prompts by
 * writing directly to the styles directory before reinitialising Zotero.Styles.
 */
export async function installCuratedStylesSilently(): Promise<void> {
  await Zotero.Styles.init();

  const stylesDir = PathUtils.join(Zotero.DataDirectory.dir, "styles");
  await IOUtils.makeDirectory(stylesDir, { ignoreExisting: true });

  let updated = false;

  for (const style of CURATED_STYLES) {
    const targetPath = PathUtils.join(stylesDir, style.filename);
    const bundledURL = Services.io.newURI(rootURI).resolve(`styles/cne/${style.filename}`);

    try {
      const bundledContents = await Zotero.File.getContentsFromURLAsync(bundledURL);

      let needsWrite = true;
      if (await IOUtils.exists(targetPath)) {
        try {
          const existingContents = await IOUtils.readUTF8(targetPath);
          needsWrite = existingContents !== bundledContents;
        } catch (readError) {
          const err = readError instanceof Error ? readError : new Error(String(readError));
          Zotero.logError(err);
        }
      }

      if (needsWrite) {
        await IOUtils.writeUTF8(targetPath, bundledContents);
        updated = true;
      }
    } catch (error) {
      Zotero.logError(new Error(`Failed to install ${style.title}: ${error}`));
    }
  }

  if (updated) {
    await Zotero.Styles.reinit();
  }
}
