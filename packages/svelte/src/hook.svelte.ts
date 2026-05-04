import type { A11yHudElement, A11yHudInstance, AxeResults, Theme } from "a11y-hud";
import { mount } from "a11y-hud";
import { onDestroy, onMount } from "svelte";
import type { UseA11yHudOptions, UseA11yHudReturn } from "./types.js";

export function useA11yHud(getOptions: () => UseA11yHudOptions = () => ({})): UseA11yHudReturn {
  let mounted = $state(false);
  let instanceRef: A11yHudInstance | null = null;
  let elementRef: A11yHudElement | null = null;

  onMount(() => {
    const opts = getOptions();
    const { theme, autoScan, debounce, runOnly } = opts;
    instanceRef = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
      ...(runOnly !== undefined && { runOnly }),
    });
    elementRef = document.querySelector<A11yHudElement>("a11y-hud");
    mounted = true;
  });

  onDestroy(() => {
    instanceRef?.unmount();
    instanceRef = null;
    elementRef = null;
  });

  // Render-settled: scope sync + rescan
  $effect(() => {
    if (!mounted) return;
    const { scope } = getOptions();
    const el = elementRef;
    if (!el) return;
    el.scopeElement = scope ?? undefined;
    void instanceRef?.runScan();
  });

  // Theme sync — runs when mounted becomes true or theme changes.
  $effect(() => {
    if (mounted) {
      const { theme } = getOptions();
      if (theme !== undefined) instanceRef?.setTheme(theme);
    }
  });

  // autoScan sync
  $effect(() => {
    if (mounted) {
      const el = elementRef;
      if (el) {
        const { autoScan } = getOptions();
        if (autoScan === false) {
          el.removeAttribute("auto-scan");
        } else {
          el.setAttribute("auto-scan", "");
        }
      }
    }
  });

  // debounce sync
  $effect(() => {
    if (mounted) {
      const el = elementRef;
      if (el) {
        const { debounce } = getOptions();
        if (debounce !== undefined) el.setAttribute("debounce", String(debounce));
      }
    }
  });

  // runOnly sync
  $effect(() => {
    if (mounted) {
      const { runOnly } = getOptions();
      if (runOnly !== undefined) instanceRef?.setRunOnly(runOnly);
    }
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

  const ignores = {
    add(ruleId: string, selector?: string): void {
      instanceRef?.ignores.add(ruleId, selector);
    },
    remove(ruleId: string, selector?: string): void {
      instanceRef?.ignores.remove(ruleId, selector);
    },
    clear(): void {
      instanceRef?.ignores.clear();
    },
    list() {
      return instanceRef?.ignores.list() ?? [];
    },
    exportJson(): string {
      return instanceRef?.ignores.exportJson() ?? "[]";
    },
    importJson(json: string): void {
      instanceRef?.ignores.importJson(json);
    },
  };

  return { runScan, setTheme, setRunOnly, exportResults, ignores };
}
