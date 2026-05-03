import type { AxeResults } from "axe-core";
import type { A11yHudElement } from "./element.js";
import { runScan } from "./scan.js";
import type { A11yHudInstance, MountOptions, Theme } from "./types.js";

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

  return {
    unmount(): void {
      el.remove();
    },
    setTheme(theme: Theme): void {
      el.setTheme(theme);
    },
    async runScan(): Promise<AxeResults> {
      return el.runScan();
    },
  };
}

export { runScan };
