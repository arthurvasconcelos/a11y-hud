import type { A11yHudElement, A11yHudInstance, AxeResults, Theme } from "a11y-hud";
import { mount } from "a11y-hud";
import { onMounted, onUnmounted, shallowRef, watch, watchPostEffect } from "vue";
import type { UseA11yHudOptions, UseA11yHudReturn } from "./types.js";

export function useA11yHud(options: UseA11yHudOptions = {}): UseA11yHudReturn {
  const instanceRef = shallowRef<A11yHudInstance | null>(null);
  const elementRef = shallowRef<A11yHudElement | null>(null);

  onMounted(() => {
    const { theme, autoScan, debounce } = options;
    const instance = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
    });
    instanceRef.value = instance;
    elementRef.value = document.querySelector<A11yHudElement>("a11y-hud");
  });

  onUnmounted(() => {
    instanceRef.value?.unmount();
    instanceRef.value = null;
    elementRef.value = null;
  });

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

  watchPostEffect(() => {
    const instance = instanceRef.value;
    if (!instance) return;
    const el = elementRef.value;
    if (el) {
      el.scopeElement = options.scope?.value ?? undefined;
    }
    void instance.runScan();
  });

  function runScan(): Promise<AxeResults> {
    return instanceRef.value?.runScan() ?? Promise.resolve(null as unknown as AxeResults);
  }

  function setTheme(theme: Theme): void {
    instanceRef.value?.setTheme(theme);
  }

  return { runScan, setTheme };
}
