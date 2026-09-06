import type { CneMetadata } from "../../model/CneMetadata";
import {
  languageCodesMatch,
  updateDropdownOptions,
  updateWarningIcon,
} from "../../ui/languageSelector";
import { debouncedSave } from "../handlers/saveHandler";

export function syncLanguageControls(
  container: HTMLElement,
  metadata: CneMetadata,
): void {
  const dropdown = container.querySelector<HTMLSelectElement>(
    "#cne-language-dropdown",
  );
  if (!dropdown) return;
  if (dropdown.value !== metadata.language)
    updateDropdownOptions(dropdown, metadata.language);
  const label = container.querySelector('label[for="cne-language-dropdown"]');
  if (label) label.textContent = metadata.language || "Language";
  updateWarningIcon(container, metadata.language, metadata.hasData());
  for (const button of container.querySelectorAll(".cne-quick-btn")) {
    button.classList.toggle(
      "active",
      languageCodesMatch(
        button.getAttribute("data-language-code"),
        metadata.language,
      ),
    );
  }
}

export function setupLanguageBinding(
  container: HTMLElement,
  _item: Zotero.Item,
  metadata: CneMetadata,
): void {
  const dropdown = container.querySelector<HTMLSelectElement>(
    "#cne-language-dropdown",
  );
  if (!dropdown) return;
  const change = (value: string) => {
    metadata.language = value;
    syncLanguageControls(container, metadata);
    debouncedSave(metadata);
  };
  dropdown.addEventListener("change", () => change(dropdown.value));
  for (const button of container.querySelectorAll(".cne-quick-btn")) {
    button.addEventListener("click", () => {
      const code = button.getAttribute("data-language-code");
      if (code) change(metadata.language === code ? "" : code);
    });
  }
  container
    .querySelector("#cne-language-clear-btn")
    ?.addEventListener("click", () => change(""));
  syncLanguageControls(container, metadata);
}
