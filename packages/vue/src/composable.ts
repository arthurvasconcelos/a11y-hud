import type { A11yHudElement, A11yHudInstance, AxeResults, Theme } from "a11y-hud";
import { mount } from "a11y-hud";
import { onMounted, onUnmounted, shallowRef, watch } from "vue";
import type { UseA11yHudOptions, UseA11yHudReturn } from "./types.js";

export function useA11yHud(options: UseA11yHudOptions = {}): UseA11yHudReturn {
  const instanceRef = shallowRef<A11yHudInstance | null>(null);
  const elementRef = shallowRef<A11yHudElement | null>(null);

  onMounted(() => {
    const { theme, autoScan, debounce, runOnly } = options;
    const instance = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
      ...(runOnly !== undefined && { runOnly }),
    });
    instanceRef.value = instance;
    elementRef.value = document.querySelector<A11yHudElement>("a11y-hud");
    const el = elementRef.value;
    if (el) {
      el.scopeElement = options.scope ?? undefined;
    }
    void instance.runScan();
  });

  onUnmounted(() => {
    instanceRef.value?.unmount();
    instanceRef.value = null;
    elementRef.value = null;
  });

  // Render-settled signal: fires after the scope prop changes, syncing the CE's
  // scopeElement and triggering a rescan. Route changes and general DOM mutations
  // are handled by the core's MutationObserver; this watch covers the prop-change
  // path (e.g. enabling/disabling scope, passing a different ref).
  watch(
    () => options.scope,
    () => {
      const instance = instanceRef.value;
      const el = elementRef.value;
      if (!instance || !el) return;
      el.scopeElement = options.scope ?? undefined;
      void instance.runScan();
    },
    { flush: "post" }
  );

  watch(
    () => options.theme,
    (newTheme) => {
      if (newTheme !== undefined) instanceRef.value?.setTheme(newTheme);
    },
    { flush: "post" }
  );

  watch(
    () => options.autoScan,
    (newAutoScan) => {
      const el = elementRef.value;
      if (!el) return;
      if (newAutoScan === false) {
        el.removeAttribute("auto-scan");
      } else {
        el.setAttribute("auto-scan", "");
      }
    },
    { flush: "post" }
  );

  watch(
    () => options.debounce,
    (newDebounce) => {
      const el = elementRef.value;
      if (!el || newDebounce === undefined) return;
      el.setAttribute("debounce", String(newDebounce));
    },
    { flush: "post" }
  );

  watch(
    () => options.runOnly,
    (newRunOnly) => {
      if (newRunOnly !== undefined) instanceRef.value?.setRunOnly(newRunOnly);
    },
    { flush: "post" }
  );

  function runScan(): Promise<AxeResults> {
    return instanceRef.value?.runScan() ?? Promise.resolve(null as unknown as AxeResults);
  }

  function setTheme(theme: Theme): void {
    instanceRef.value?.setTheme(theme);
  }

  function setRunOnly(tags: string[]): void {
    instanceRef.value?.setRunOnly(tags);
  }

  function exportResults(): string | null {
    return instanceRef.value?.exportResults() ?? null;
  }

  const ignores = {
    add(ruleId: string, selector?: string): void {
      instanceRef.value?.ignores.add(ruleId, selector);
    },
    remove(ruleId: string, selector?: string): void {
      instanceRef.value?.ignores.remove(ruleId, selector);
    },
    clear(): void {
      instanceRef.value?.ignores.clear();
    },
    list() {
      return instanceRef.value?.ignores.list() ?? [];
    },
    exportJson(): string {
      return instanceRef.value?.ignores.exportJson() ?? "[]";
    },
    importJson(json: string): void {
      instanceRef.value?.ignores.importJson(json);
    },
  };

  return { runScan, setTheme, setRunOnly, exportResults, ignores };
}
