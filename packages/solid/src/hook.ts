import type { A11yHudElement, A11yHudInstance, AxeResults, Theme } from "a11y-hud";
import { mount } from "a11y-hud";
import { createEffect, onCleanup, onMount } from "solid-js";
import type { CreateA11yHudOptions, CreateA11yHudReturn } from "./types.js";

export function createA11yHud(options: CreateA11yHudOptions = {}): CreateA11yHudReturn {
  let instanceRef: A11yHudInstance | null = null;
  let elementRef: A11yHudElement | null = null;

  onMount(() => {
    const { theme, autoScan, debounce, runOnly } = options;
    const instance = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
      ...(runOnly !== undefined && { runOnly }),
    });
    instanceRef = instance;
    elementRef = document.querySelector<A11yHudElement>("a11y-hud");
    // NOTE: Do NOT run scan here — the scope effect (below) runs after onMount
    // and handles the initial scan.
  });

  onCleanup(() => {
    instanceRef?.unmount();
    instanceRef = null;
    elementRef = null;
  });

  // Render-settled: scope sync + rescan after prop changes.
  // Runs after onMount (registration order). On initial render: does the first scan.
  // On scope change (if options.scope is a reactive getter): rescans.
  createEffect(() => {
    if (!instanceRef || !elementRef) return;
    const el = elementRef;
    el.scopeElement = options.scope ?? undefined; // reactive read
    void instanceRef.runScan();
  });

  // Theme sync
  createEffect(() => {
    if (!instanceRef) return;
    const theme = options.theme; // reactive read
    if (theme !== undefined) instanceRef.setTheme(theme);
  });

  // autoScan sync
  createEffect(() => {
    const el = elementRef;
    if (!el) return;
    const autoScan = options.autoScan; // reactive read
    if (autoScan === false) {
      el.removeAttribute("auto-scan");
    } else {
      el.setAttribute("auto-scan", "");
    }
  });

  // debounce sync
  createEffect(() => {
    const el = elementRef;
    if (!el) return;
    const debounce = options.debounce; // reactive read
    if (debounce === undefined) return;
    el.setAttribute("debounce", String(debounce));
  });

  // runOnly sync
  createEffect(() => {
    if (!instanceRef) return;
    const runOnly = options.runOnly; // reactive read
    if (runOnly !== undefined) instanceRef.setRunOnly(runOnly);
  });

  function runScan(): Promise<AxeResults> {
    return instanceRef?.runScan() ?? Promise.resolve(null as unknown as AxeResults);
  }

  function setTheme(t: Theme): void {
    instanceRef?.setTheme(t);
  }

  function setRunOnly(tags: string[]): void {
    instanceRef?.setRunOnly(tags);
  }

  function exportResults(): string | null {
    return instanceRef?.exportResults() ?? null;
  }

  return { runScan, setTheme, setRunOnly, exportResults };
}
