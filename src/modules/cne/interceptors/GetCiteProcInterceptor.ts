/**
 * GetCiteProc Interceptor - configures citeproc engines on creation.
 */

import { extractCNEConfigFromStyle } from '../config/parseCNEConfig';
import { configureCiteprocForCNE, installCneLangPrefPatch } from '../config/configureCiteproc';

export class GetCiteProcInterceptor {
  private static originalGetCiteProc: any = null;
  private static intercepted = false;

  static intercept() {
    if (this.intercepted) {
      return;
    }

    const ZoteroStyle = (Zotero as any).Style;
    this.originalGetCiteProc = ZoteroStyle.prototype.getCiteProc;
    installCneLangPrefPatch();

    const self = this;
    ZoteroStyle.prototype.getCiteProc = function (...args: any[]) {
      const engine = self.originalGetCiteProc.call(this, ...args);

      if (!(engine as any)._cneConfigured) {
        const cneConfig = extractCNEConfigFromStyle(this);
        if (cneConfig) {
          configureCiteprocForCNE(engine, cneConfig);
          (engine as any)._cneConfigApplied = cneConfig;
          (engine as any)._cneLangPrefs = engine.opt?.['cite-lang-prefs']?.persons;
        }
        (engine as any)._cneConfigured = true;
      }

      return engine;
    };

    this.intercepted = true;
  }

  static remove() {
    if (!this.intercepted || !this.originalGetCiteProc) {
      return;
    }
    const ZoteroStyle = (Zotero as any).Style;
    ZoteroStyle.prototype.getCiteProc = this.originalGetCiteProc;
    this.intercepted = false;
    this.originalGetCiteProc = null;
  }
}
