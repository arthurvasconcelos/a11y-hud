import { cleanup, render } from "@solidjs/testing-library";
import { A11yHudElement } from "a11y-hud";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";
import { createA11yHud } from "./hook.js";
import type { CreateA11yHudOptions, CreateA11yHudReturn } from "./types.js";

const hud = new HudHostHarness();

/** Renders a bare component that runs the primitive and returns what it produced. */
function mountHook(options: CreateA11yHudOptions = {}): CreateA11yHudReturn {
  let captured: CreateA11yHudReturn | undefined;
  render(() => {
    captured = createA11yHud(options);
    return null;
  });
  if (!captured) throw new Error("createA11yHud() did not run during render");
  return captured;
}

describe("createA11yHud", () => {
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
    cleanup();
    await hud.cleanup();
    for (const element of pageFixtures.splice(0)) element.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("mounts the <a11y-hud> element on initial render", () => {
    mountHook();
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the initial options to the element", () => {
    mountHook({ theme: "light", autoScan: false, debounce: 300, runOnly: ["wcag2a"] });
    expect(hud.getThemeAttribute()).toBe("light");
    expect(hud.hasAutoScan()).toBe(false);
    expect(hud.getDebounceAttribute()).toBe("300");
    expect(hud.getRunOnly()).toEqual(["wcag2a"]);
  });

  it("leaves the theme untouched when no theme is given", () => {
    mountHook({});
    expect(hud.getThemeAttribute()).toBeNull();
  });

  it("removes the element when the owner unmounts", () => {
    mountHook();
    cleanup();
    expect(hud.isMounted()).toBe(false);
  });

  it("runs a scan on initial render (from the scope effect)", () => {
    mountHook();
    expect(runScan).toHaveBeenCalled();
  });

  it("scopes the element to the given scope element", () => {
    const container = document.createElement("div");
    addToPage(container);
    mountHook({ scope: container });
    expect(hud.getScopeElement()).toBe(container);
  });

  it("leaves the element unscoped when scope is null", () => {
    mountHook({ scope: null });
    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("re-scopes and rescans when the scope signal changes", () => {
    const [scope, setScope] = createSignal<Element | null>(null);
    const container = document.createElement("div");
    addToPage(container);
    mountHook({
      get scope() {
        return scope();
      },
    });
    const callsBefore = runScan.mock.calls.length;

    setScope(container);

    expect(runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(hud.getScopeElement()).toBe(container);
  });

  it("clears the scope when the signal goes from an element to null", () => {
    const container = document.createElement("div");
    addToPage(container);
    const [scope, setScope] = createSignal<Element | null>(container);
    mountHook({
      get scope() {
        return scope();
      },
    });
    expect(hud.getScopeElement()).toBe(container);

    setScope(null);

    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("switches the element's theme when the theme signal changes", () => {
    const [theme, setTheme] = createSignal<CreateA11yHudOptions["theme"]>("light");
    mountHook({
      get theme() {
        return theme();
      },
    });

    setTheme("high-contrast");

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("turns auto-scan on when the autoScan signal changes to true", () => {
    const [autoScan, setAutoScan] = createSignal(false);
    mountHook({
      get autoScan() {
        return autoScan();
      },
    });
    expect(hud.hasAutoScan()).toBe(false);

    setAutoScan(true);

    expect(hud.hasAutoScan()).toBe(true);
  });

  it("turns auto-scan off when the autoScan signal changes to false", () => {
    const [autoScan, setAutoScan] = createSignal(true);
    mountHook({
      get autoScan() {
        return autoScan();
      },
    });

    setAutoScan(false);

    expect(hud.hasAutoScan()).toBe(false);
  });

  it("updates the debounce when the signal changes", () => {
    const [debounce, setDebounce] = createSignal<number | undefined>(200);
    mountHook({
      get debounce() {
        return debounce();
      },
    });

    setDebounce(400);

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("keeps the current debounce when the signal becomes undefined", () => {
    const [debounce, setDebounce] = createSignal<number | undefined>(200);
    mountHook({
      get debounce() {
        return debounce();
      },
    });
    setDebounce(400);
    expect(hud.getDebounceAttribute()).toBe("400");

    setDebounce(undefined);

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("updates the rule sets when the runOnly signal changes", () => {
    const [runOnly, setRunOnly] = createSignal<string[] | undefined>(["wcag2a"]);
    mountHook({
      get runOnly() {
        return runOnly();
      },
    });

    setRunOnly(["wcag2a", "wcag2aa"]);

    expect(hud.getRunOnly()).toEqual(["wcag2a", "wcag2aa"]);
  });

  it("leaves the rule sets untouched when runOnly is undefined", () => {
    mountHook({ runOnly: undefined });
    expect(hud.getRunOnly()).toBeNull();
  });

  describe("returned API", () => {
    it("runScan() scans the element and resolves with axe results", async () => {
      const hook = mountHook();
      runScan.mockClear();

      const results = await hook.runScan();

      expect(runScan).toHaveBeenCalledTimes(1);
      expect(Array.isArray(results?.violations)).toBe(true);
    });

    it("setTheme() changes the element's theme", () => {
      const hook = mountHook();
      hook.setTheme("github-dark");
      expect(hud.getThemeAttribute()).toBe("github-dark");
    });

    it("setRunOnly() changes the element's rule sets", () => {
      const hook = mountHook();
      hook.setRunOnly(["best-practice"]);
      expect(hud.getRunOnly()).toEqual(["best-practice"]);
    });

    it("exportResults() returns the element's export once a scan has settled", async () => {
      const hook = mountHook();
      await hud.awaitReady();

      const json = hook.exportResults();

      expect(json).not.toBeNull();
      expect((JSON.parse(json as string) as { version: string }).version).toBe("1");
    });

    it("ignores.add() persists the rule and ignores.list() reads it back", () => {
      const hook = mountHook();
      hook.ignores.add("color-contrast");
      expect(hook.ignores.list()).toEqual([{ ruleId: "color-contrast" }]);
    });

    it("ignores.remove() drops the rule again", () => {
      const hook = mountHook();
      hook.ignores.add("color-contrast");
      hook.ignores.remove("color-contrast");
      expect(hook.ignores.list()).toEqual([]);
    });

    it("ignores.clear() empties the list", () => {
      const hook = mountHook();
      hook.ignores.add("color-contrast");
      hook.ignores.add("image-alt");
      hook.ignores.clear();
      expect(hook.ignores.list()).toEqual([]);
    });

    it("ignores.exportJson() and ignores.importJson() round-trip the list", () => {
      const hook = mountHook();
      hook.ignores.add("image-alt");
      const json = hook.ignores.exportJson();
      hook.ignores.clear();

      hook.ignores.importJson(json);

      expect(JSON.parse(json)).toEqual([{ ruleId: "image-alt" }]);
      expect(hook.ignores.list()).toEqual([{ ruleId: "image-alt" }]);
    });

    it("ignores.list() and ignores.exportJson() are safe to call during render", () => {
      let earlyList: unknown[] | undefined;
      let earlyJson: string | undefined;

      render(() => {
        const { ignores } = createA11yHud({});
        earlyList = ignores.list();
        earlyJson = ignores.exportJson();
        return null;
      });

      expect(earlyList).toEqual([]);
      expect(earlyJson).toBe("[]");
    });

    it("runScan() resolves with null when called before the element is mounted", async () => {
      let early: Promise<unknown> | undefined;

      render(() => {
        early = createA11yHud({}).runScan();
        return null;
      });

      await expect(early).resolves.toBeNull();
    });
  });
});
