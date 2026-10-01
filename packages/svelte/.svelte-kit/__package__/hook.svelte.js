import { mount } from "a11y-hud";
import { onDestroy, onMount } from "svelte";
export function useA11yHud(getOptions = () => ({})) {
  let mounted = $state(false);
  let instanceRef = null;
  let elementRef = null;
  onMount(() => {
    const opts = getOptions();
    const { theme, autoScan, debounce, runOnly } = opts;
    instanceRef = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
      ...(runOnly !== undefined && { runOnly }),
    });
    elementRef = document.querySelector("a11y-hud");
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
  function runScan() {
    return instanceRef?.runScan() ?? Promise.resolve(null);
  }
  function setTheme(t) {
    instanceRef?.setTheme(t);
  }
  function setRunOnly(tags) {
    instanceRef?.setRunOnly(tags);
  }
  function exportResults() {
    return instanceRef?.exportResults() ?? null;
  }
  const ignores = {
    add(ruleId, selector) {
      instanceRef?.ignores.add(ruleId, selector);
    },
    remove(ruleId, selector) {
      instanceRef?.ignores.remove(ruleId, selector);
    },
    clear() {
      instanceRef?.ignores.clear();
    },
    list() {
      return instanceRef?.ignores.list() ?? [];
    },
    exportJson() {
      return instanceRef?.ignores.exportJson() ?? "[]";
    },
    importJson(json) {
      instanceRef?.ignores.importJson(json);
    },
  };
  return { runScan, setTheme, setRunOnly, exportResults, ignores };
}
