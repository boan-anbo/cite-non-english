# CNE Citeproc Override Implementation

This document summarises the approach we used to guarantee that CNE
multi-slot preferences (e.g., `persons: ['translit', 'orig']`) remain in
place across every citeproc call, including the Style Editor and
citeproc‑rs.

## 1. The Original Problem

- We wrapped `Zotero.Style.prototype.getCiteProc()` so that every engine
  receives the CNE configuration.
- `extractCNEConfigFromStyle()` was extended to read the installed `.csl`
  file when the transient Style Editor copy lacked `<summary>` metadata.
- Despite the wrapper, `engine.opt['cite-lang-prefs'].persons` still
  reverted to `['orig']` as soon as citeproc ran an internal method
  (`setLangPrefsForCites()` or `rebuildProcessorState()`); the Style
  Editor therefore showed only the native slot.

## 2. Key Insight

`CSL.Engine.prototype.setLangPrefsForCites()` (and the citeproc‑rs
counterpart) normalises and then mutates `this.opt['cite-lang-prefs']` in
place. Any post-call mutation we performed was immediately overwritten
by citeproc’s own bookkeeping. Therefore the only reliable fix is to add
our own hook *inside* `setLangPrefsForCites()` so we always run after
citeproc finishes.

## 3. Implementation Summary

### 3.1 Install a Global Citeproc Hook

```ts
let originalJsSetLangPrefs: ((obj: any, conv?: any) => void) | null = null;
let originalRsSetLangPrefs: ((obj: any, conv?: any) => void) | null = null;

declare const CSL: any | undefined;

export function installCneLangPrefPatch(): void {
  if (typeof CSL !== 'undefined' && CSL?.Engine && !originalJsSetLangPrefs) {
    originalJsSetLangPrefs = CSL.Engine.prototype.setLangPrefsForCites;
    CSL.Engine.prototype.setLangPrefsForCites = function (obj: any, conv?: any) {
      originalJsSetLangPrefs!.call(this, obj, conv);
      try {
        (this as any)._cneLangOverride?.();
      } catch (err) {
        Zotero?.debug?.('[CNE Config] Error in JS lang override: ' + err);
      }
    };
  }

  const RsEngine = (Zotero as any)?.CiteprocRs?.Engine;
  if (RsEngine && !originalRsSetLangPrefs) {
    originalRsSetLangPrefs = RsEngine.prototype.setLangPrefsForCites;
    RsEngine.prototype.setLangPrefsForCites = function (obj: any, conv?: any) {
      originalRsSetLangPrefs!.call(this, obj, conv);
      try {
        (this as any)._cneLangOverride?.();
      } catch (err) {
        Zotero?.debug?.('[CNE Config] Error in RS lang override: ' + err);
      }
    };
  }
}
```

### 3.2 Configure Engines with an Override Hook

```ts
export function configureCiteprocForCNE(engine: any, config: CNEConfigOptions): void {
  installCneLangPrefPatch();
  const persons = config?.persons ?? ['translit'];

  engine._cneLangOverride = () => {
    enforcePersonsArray(engine.opt?.['cite-lang-prefs'], persons);
    enforcePersonsArray(engine.state?.opt?.['cite-lang-prefs'], persons);
  };

  engine.setLangPrefsForCites({ persons });
  engine._cneLangOverride?.();
}

function enforcePersonsArray(target: any, values: string[]): void {
  if (!target) return;
  const arr = Array.isArray(target.persons) ? target.persons : (target.persons = []);
  arr.length = 0;
  arr.push(...values);
}
```

### 3.3 Simplified GetCiteProc Wrapper

```ts
export class GetCiteProcInterceptor {
  private static originalGetCiteProc: any = null;
  private static intercepted = false;

  static intercept() {
    if (this.intercepted) return;

    const ZoteroStyle = (Zotero as any).Style;
    this.originalGetCiteProc = ZoteroStyle.prototype.getCiteProc;
    installCneLangPrefPatch();

    const self = this;
    ZoteroStyle.prototype.getCiteProc = function (...args: any[]) {
      const engine = self.originalGetCiteProc.call(this, ...args);
      if (!(engine as any)._cneConfigured) {
        const cneConfig = extractCNEConfigFromStyle(this);
        if (cneConfig) configureCiteprocForCNE(engine, cneConfig);
        (engine as any)._cneConfigured = true;
      }
      return engine;
    };

    this.intercepted = true;
  }

  static remove() {
    if (!this.intercepted || !this.originalGetCiteProc) return;
    const ZoteroStyle = (Zotero as any).Style;
    ZoteroStyle.prototype.getCiteProc = this.originalGetCiteProc;
    this.intercepted = false;
    this.originalGetCiteProc = null;
  }
}
```

## 4. Results

- `npm test` (zotero-plugin harness) now passes `67/67` with the new
  regression spec. The failing assertion that previously showed
  `['orig']` now reports `['translit','orig']`.
- Style Editor previews display romanized + native names automatically.
- The code is cleaner: no more ad-hoc array coercions or temporary
  wrappers around citeproc methods.

## 5. Follow-up

- Ensure any stale diagnostic files (console exports, `diag-*` snippets)
  are removed before committing.
- The snapshots listed in `git status` were already present before this
  fix; update or revert them separately if they’re unrelated.

