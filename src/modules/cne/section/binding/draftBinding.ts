import { checkCreatorsChanged } from "./creatorChangeDetector";
import { refreshAuthorFields } from "../renderer/authorRefresh";
import type { CneMetadata } from "../../model/CneMetadata";
import { toValues } from "../../operations/values";
import { cancelSave } from "../handlers/saveHandler";
import { updateAllUI } from "../updaters/uiUpdaters";
import { syncLanguageControls } from "./languageBinding";

export function bindDraft(
  container: HTMLElement,
  metadata: CneMetadata,
  editable: boolean,
): () => void {
  const doc = container.ownerDocument!;
  const status = doc.createElement("div");
  status.setAttribute("role", "alert");
  status.className = "cne-save-error";
  const message = doc.createElement("span");
  const reload = doc.createElement("button");
  reload.textContent = "Discard edits and reload";
  reload.addEventListener("click", () => {
    cancelSave(metadata);
    metadata.reload();
  });
  status.append(message, reload);
  container.append(status);
  const sync = () => {
    if (
      !metadata.error &&
      checkCreatorsChanged(container, metadata.getItem())
    ) {
      void refreshAuthorFields(container, metadata.getItem(), metadata);
    }
    const values = toValues(metadata.data);
    for (const element of container.querySelectorAll<HTMLInputElement>(
      "[data-bind]",
    )) {
      const path = element
        .getAttribute("data-bind")!
        .replace(/^author-(\d+)\./, "creators.$1.");
      if (element.type === "checkbox") element.checked = Boolean(values[path]);
      else if (element.value !== String(values[path] ?? ""))
        element.value = String(values[path] ?? "");
    }
    for (const element of container.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >("input, textarea, select, button"))
      element.disabled = !editable;
    status.hidden = !metadata.error;
    message.textContent = metadata.error
      ? `${metadata.error} Your unsaved edits are retained. `
      : "";
    syncLanguageControls(container, metadata);
    updateAllUI(container, metadata);
  };
  sync();
  const unsubscribe = metadata.subscribe(sync);
  const observer = Zotero.Notifier.registerObserver(
    {
      notify(event, type, ids) {
        if (
          type === "item" &&
          event === "modify" &&
          ids.map(Number).includes(metadata.getItem().id)
        )
          metadata.refresh();
      },
    },
    ["item"],
    "cne-draft",
  );
  return () => {
    unsubscribe();
    Zotero.Notifier.unregisterObserver(observer);
  };
}
