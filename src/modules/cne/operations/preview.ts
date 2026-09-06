import { serializeToExtra } from "../metadata-parser";
import { CneError } from "./errors";
import { fromValues } from "./values";
import { planEdit, type Edit } from "./write";

export function listStyles() {
  return Zotero.Styles.getVisible().map(
    (style: {
      styleID: string;
      title: string;
      class: string;
      hasBibliography: boolean;
    }) => ({
      id: style.styleID,
      title: style.title,
      class: style.class,
      forms: [
        "citation",
        "subsequentCitation",
        ...(style.hasBibliography ? ["bibliography"] : []),
      ],
    }),
  );
}

export interface PreviewOptions {
  styleID: string;
  locale?: string;
  format?: "html" | "text";
  locator?: string;
  label?: string;
}

/** Isolated engine and unsaved item clone; no database writes or global item substitution. */
export function previewEdit(edit: Edit, options: PreviewOptions) {
  const plan = planEdit(edit);
  const style = Zotero.Styles.get(options.styleID);
  if (!style)
    throw new CneError(
      "STYLE_NOT_FOUND",
      "Choose an installed style from styles.list.",
      404,
      { styleID: options.styleID },
    );
  const format = options.format ?? "html";
  const engine = style.getCiteProc(options.locale ?? "en-US", format);
  try {
    // Keep this Zotero/citeproc seam here. Do not patch shared engines or the global converter.
    const sys = engine.sys;
    if (!sys || typeof sys.retrieveItem !== "function") {
      throw new CneError(
        "PREVIEW_UNSUPPORTED",
        "The active citation engine does not support isolated item previews.",
        503,
      );
    }
    const draft = edit.item.clone(edit.item.libraryID);
    draft.setField(
      "extra",
      serializeToExtra(
        String(edit.item.getField("extra") || ""),
        fromValues(plan.values),
      ),
    );
    draft.setField("language", String(plan.values.language ?? ""));
    const retrieve = sys.retrieveItem.bind(sys);
    const id = edit.item.id;
    sys.retrieveItem = (requested: string | number) => {
      if (String(requested) !== String(id))
        throw new CneError(
          "PREVIEW_FAILED",
          "Unexpected item requested by the preview engine.",
          500,
        );
      return { ...retrieve(draft), id };
    };
    engine.updateItems([id]);
    const citations: string[] = [];
    for (let index = 0; index < 2; index++) {
      const result = engine.processCitationCluster(
        {
          citationID: `cne-preview-${index}`,
          citationItems: [
            {
              id,
              ...(options.locator
                ? { locator: options.locator, label: options.label ?? "page" }
                : {}),
            },
          ],
          properties: { noteIndex: index + 1 },
        },
        index ? [["cne-preview-0", 1]] : [],
        [],
      );
      const rendered = result[1].find(
        (entry: [number, string]) => entry[0] === index,
      )?.[1];
      if (typeof rendered !== "string")
        throw new CneError(
          "PREVIEW_FAILED",
          "The citation engine returned no citation.",
          500,
        );
      citations.push(rendered);
    }
    return {
      item: plan.before.item,
      revision: plan.before.revision,
      changes: plan.changes,
      styleID: options.styleID,
      locale: options.locale ?? "en-US",
      format,
      citation: citations[0],
      subsequentCitation: citations[1],
      bibliography: style.hasBibliography
        ? Zotero.Cite.makeFormattedBibliography(engine, format)
        : null,
    };
  } finally {
    engine.free();
  }
}
