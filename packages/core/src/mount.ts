import type { AxeResults } from "axe-core";
import type { A11yHudElement } from "./element.js";
import {
  addIgnore,
  clearIgnores,
  exportIgnores,
  importIgnores,
  listIgnores,
  removeIgnore,
} from "./ignores.js";
import { runScan } from "./scan.js";
import type { A11yHudInstance, IgnoreEntry, MountOptions, Theme } from "./types.js";

export function mount(options: MountOptions = {}): A11yHudInstance {
  let el = document.querySelector<A11yHudElement>("a11y-hud");

  if (!el) {
    el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
  }

  if (options.theme !== undefined) el.setAttribute("theme", options.theme);

  if (options.scope !== undefined) {
    if (typeof options.scope === "string") {
      el.setAttribute("scope", options.scope);
    } else {
      el.scopeElement = options.scope;
    }
  }

  if (options.autoScan === false) {
    el.removeAttribute("auto-scan");
  } else if (options.autoScan === true) {
    el.setAttribute("auto-scan", "");
  }

  if (options.debounce !== undefined) {
    el.setAttribute("debounce", String(options.debounce));
  }

  if (options.runOnly !== undefined && options.runOnly.length > 0) {
    el.setAttribute("run-only", JSON.stringify(options.runOnly));
  }

  return {
    unmount(): void {
      el.remove();
    },
    setTheme(theme: Theme): void {
      el.setTheme(theme);
    },
    setRunOnly(tags: string[]): void {
      el.setRunOnly(tags);
    },
    async runScan(): Promise<AxeResults> {
      return el.runScan();
    },
    exportResults(): string | null {
      return el.exportResults();
    },
    ignores: {
      add(ruleId: string, selector?: string): void {
        addIgnore(ruleId, selector);
        void el.runScan();
      },
      remove(ruleId: string, selector?: string): void {
        removeIgnore(ruleId, selector);
        void el.runScan();
      },
      clear(): void {
        clearIgnores();
        void el.runScan();
      },
      list(): IgnoreEntry[] {
        return listIgnores();
      },
      exportJson(): string {
        return exportIgnores();
      },
      importJson(json: string): void {
        importIgnores(json);
        void el.runScan();
      },
    },
  };
}

export { runScan };
