import { act, renderHook } from "@testing-library/react";
import { A11yHudElement } from "a11y-hud";
import type { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";
import { useA11yHud } from "./hook.js";

const hud = new HudHostHarness();

describe("useA11yHud", () => {
  let runScan: ReturnType<typeof vi.spyOn>;
  const pageFixtures: Element[] = [];

  /** Appends an element to the page and keeps it there until the scans using it have settled. */
  function addToPage(element: Element): void {
    document.body.appendChild(element);
    pageFixtures.push(element);
  }

  beforeEach(() => {
    localStorage.clear();
    hud.track();
    runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
  });

  afterEach(async () => {
    await hud.cleanup();
    for (const element of pageFixtures.splice(0)) element.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("mounts the <a11y-hud> element on first render", () => {
    renderHook(() => useA11yHud());
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the initial options to the element", () => {
    renderHook(() => useA11yHud({ theme: "light", autoScan: false, debounce: 300 }));
    expect(hud.getThemeAttribute()).toBe("light");
    expect(hud.hasAutoScan()).toBe(false);
    expect(hud.getDebounceAttribute()).toBe("300");
  });

  it("removes the element when the hook unmounts", () => {
    const { unmount } = renderHook(() => useA11yHud());
    unmount();
    expect(hud.isMounted()).toBe(false);
  });

  it("runs a scan once the initial render has committed", async () => {
    renderHook(() => useA11yHud());
    await act(async () => {});
    expect(runScan).toHaveBeenCalled();
  });

  it("runs a scan again after every re-render (render-settled signal)", async () => {
    const { rerender } = renderHook(() => useA11yHud());
    await act(async () => {});
    const callsBefore = runScan.mock.calls.length;

    rerender();
    await act(async () => {});

    expect(runScan.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("switches the element's theme when the theme option changes", async () => {
    let theme: "light" | "high-contrast" = "light";
    const { rerender } = renderHook(() => useA11yHud({ theme }));
    await act(async () => {});

    theme = "high-contrast";
    rerender();
    await act(async () => {});

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("turns auto-scan on when autoScan changes to true", async () => {
    let autoScan = false;
    const { rerender } = renderHook(() => useA11yHud({ autoScan }));
    await act(async () => {});
    expect(hud.hasAutoScan()).toBe(false);

    autoScan = true;
    rerender();
    await act(async () => {});

    expect(hud.hasAutoScan()).toBe(true);
  });

  it("turns auto-scan off when autoScan changes to false", async () => {
    let autoScan = true;
    const { rerender } = renderHook(() => useA11yHud({ autoScan }));
    await act(async () => {});

    autoScan = false;
    rerender();
    await act(async () => {});

    expect(hud.hasAutoScan()).toBe(false);
  });

  it("updates the debounce when the option changes", async () => {
    let debounce = 200;
    const { rerender } = renderHook(() => useA11yHud({ debounce }));
    await act(async () => {});

    debounce = 400;
    rerender();
    await act(async () => {});

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("scopes the element to the ref's current element", async () => {
    const container = document.createElement("div");
    addToPage(container);

    renderHook(() => useA11yHud({ scope: { current: container } }));
    await act(async () => {});

    expect(hud.getScopeElement()).toBe(container);
  });

  it("leaves the element unscoped when the ref is empty", async () => {
    renderHook(() => useA11yHud({ scope: { current: null } }));
    await act(async () => {});
    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("clears the scope when the option goes from a ref to undefined", async () => {
    const container = document.createElement("div");
    addToPage(container);
    let scope: RefObject<Element | null> | undefined = { current: container };

    const { rerender } = renderHook(() => useA11yHud({ scope }));
    await act(async () => {});
    expect(hud.getScopeElement()).toBe(container);

    scope = undefined;
    rerender();
    await act(async () => {});

    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("applies the initial runOnly tags to the element", () => {
    renderHook(() => useA11yHud({ runOnly: ["wcag2a", "wcag2aa"] }));
    expect(hud.getRunOnly()).toEqual(["wcag2a", "wcag2aa"]);
  });

  it("updates the runOnly tags when the option changes", async () => {
    let runOnly = ["wcag2a"];
    const { rerender } = renderHook(() => useA11yHud({ runOnly }));
    await act(async () => {});

    runOnly = ["wcag2a", "wcag2aa"];
    rerender();
    await act(async () => {});

    expect(hud.getRunOnly()).toEqual(["wcag2a", "wcag2aa"]);
  });

  describe("returned API", () => {
    it("runScan() scans the element and resolves with axe results", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});
      runScan.mockClear();

      const results = await result.current.runScan();

      expect(runScan).toHaveBeenCalledTimes(1);
      expect(Array.isArray(results?.violations)).toBe(true);
    });

    it("setTheme() changes the element's theme", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});

      result.current.setTheme("github-dark");

      expect(hud.getThemeAttribute()).toBe("github-dark");
    });

    it("setRunOnly() changes the element's rule sets", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});

      result.current.setRunOnly(["best-practice"]);

      expect(hud.getRunOnly()).toEqual(["best-practice"]);
    });

    it("exportResults() returns the element's export once a scan has settled", async () => {
      const { result } = renderHook(() => useA11yHud());
      await hud.awaitReady();

      const json = result.current.exportResults();

      expect(json).not.toBeNull();
      expect((JSON.parse(json as string) as { version: string }).version).toBe("1");
    });

    it("ignores.add() persists the rule and ignores.list() reads it back", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});

      result.current.ignores.add("color-contrast");

      expect(result.current.ignores.list()).toEqual([{ ruleId: "color-contrast" }]);
    });

    it("ignores.remove() drops the rule again", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});
      result.current.ignores.add("color-contrast");

      result.current.ignores.remove("color-contrast");

      expect(result.current.ignores.list()).toEqual([]);
    });

    it("ignores.clear() empties the list", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});
      result.current.ignores.add("color-contrast");
      result.current.ignores.add("image-alt");

      result.current.ignores.clear();

      expect(result.current.ignores.list()).toEqual([]);
    });

    it("ignores.exportJson() and ignores.importJson() round-trip the list", async () => {
      const { result } = renderHook(() => useA11yHud());
      await act(async () => {});
      result.current.ignores.add("image-alt");
      const json = result.current.ignores.exportJson();
      result.current.ignores.clear();

      result.current.ignores.importJson(json);

      expect(JSON.parse(json)).toEqual([{ ruleId: "image-alt" }]);
      expect(result.current.ignores.list()).toEqual([{ ruleId: "image-alt" }]);
    });

    it("ignores.list() and ignores.exportJson() are safe to call during the first render", () => {
      let earlyList: unknown[] | undefined;
      let earlyJson: string | undefined;

      renderHook(() => {
        const hook = useA11yHud();
        earlyList ??= hook.ignores.list();
        earlyJson ??= hook.ignores.exportJson();
        return hook;
      });

      expect(earlyList).toEqual([]);
      expect(earlyJson).toBe("[]");
    });

    it("runScan and setTheme are stable references across re-renders", async () => {
      const { result, rerender } = renderHook(() => useA11yHud());
      await act(async () => {});
      const { runScan: firstRunScan, setTheme: firstSetTheme } = result.current;

      rerender();
      await act(async () => {});

      expect(result.current.runScan).toBe(firstRunScan);
      expect(result.current.setTheme).toBe(firstSetTheme);
    });
  });
});
