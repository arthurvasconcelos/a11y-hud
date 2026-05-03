import type { A11yHudElement, A11yHudInstance, AxeResults, Theme } from "a11y-hud";
import { mount } from "a11y-hud";
import { useCallback, useEffect, useRef } from "react";
import type { UseA11yHudOptions, UseA11yHudReturn } from "./types.js";

export function useA11yHud(options: UseA11yHudOptions = {}): UseA11yHudReturn {
  const { theme, scope, autoScan, debounce, runOnly } = options;
  const instanceRef = useRef<A11yHudInstance | null>(null);
  const elementRef = useRef<A11yHudElement | null>(null);

  // Mount the CE once. Capture the element reference immediately after mount()
  // so subsequent effects can access it without re-querying the DOM.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-once effect; initial options are applied here, changes are tracked by the separate sync effects below
  useEffect(() => {
    // exactOptionalPropertyTypes forbids passing `undefined` for optional props;
    // build the options object conditionally to satisfy the constraint.
    const instance = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
      ...(runOnly !== undefined && { runOnly }),
    });
    instanceRef.current = instance;
    elementRef.current = document.querySelector<A11yHudElement>("a11y-hud");
    return () => {
      instance.unmount();
      instanceRef.current = null;
      elementRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (theme !== undefined) instanceRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    if (autoScan === false) {
      el.removeAttribute("auto-scan");
    } else {
      el.setAttribute("auto-scan", "");
    }
  }, [autoScan]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || debounce === undefined) return;
    el.setAttribute("debounce", String(debounce));
  }, [debounce]);

  useEffect(() => {
    if (runOnly !== undefined) instanceRef.current?.setRunOnly(runOnly);
  }, [runOnly]);

  // Render-settled signal: runs after every React commit. Always syncs scope
  // (including clearing it when scope becomes undefined), then triggers a
  // rescan. This is the adapter's core value — rescans fire after React
  // finishes rendering, catching route changes and prop-driven ARIA mutations
  // that the MutationObserver may coalesce.
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    const el = elementRef.current;
    if (el) {
      el.scopeElement = scope?.current ?? undefined;
    }
    void instance.runScan();
  });

  const runScan = useCallback(
    (): Promise<AxeResults> =>
      instanceRef.current?.runScan() ?? Promise.resolve(null as unknown as AxeResults),
    []
  );

  const setTheme = useCallback((t: Theme): void => {
    instanceRef.current?.setTheme(t);
  }, []);

  const setRunOnly = useCallback((tags: string[]): void => {
    instanceRef.current?.setRunOnly(tags);
  }, []);

  return { runScan, setTheme, setRunOnly };
}
