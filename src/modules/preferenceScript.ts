import { config } from "../../package.json";
import { getPref, setPref } from "../utils/prefs";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
    };
  } else {
    addon.data.prefs.window = _window;
  }
  bindPrefEvents();
}

function bindPrefEvents() {
  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-enable`,
    )
    ?.addEventListener("command", (e: Event) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`,
      );
    });

  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-input`,
    )
    ?.addEventListener("change", (e: Event) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as HTMLInputElement).value}!`,
      );
    });

  // Japanese spacing checkbox handler
  const spacingCheckbox = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-enable-japanese-spacing`,
  ) as XUL.Checkbox | null;

  if (spacingCheckbox) {
    // Initialize checkbox state from preference
    const spacingLanguages = (getPref('spacingLanguages') as string) || '';
    spacingCheckbox.checked = spacingLanguages.includes('ja');

    // Save preference when checkbox changes
    spacingCheckbox.addEventListener("command", (e: Event) => {
      const checked = (e.target as XUL.Checkbox).checked;
      setPref('spacingLanguages', checked ? 'ja' : '');
      ztoolkit.log(`Japanese spacing ${checked ? 'enabled' : 'disabled'}`);
    });
  }
}
