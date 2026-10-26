import { mount as vueMount } from "@vue/test-utils";
import { A11yHudElement } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, reactive, shallowReactive } from "vue";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";
import { useA11yHud } from "./composable.js";
import type { UseA11yHudOptions, UseA11yHudReturn } from "./types.js";

const hud = new HudHostHarness();

/** Mounts a bare component that runs the composable and exposes what it returns. */
function mountComposable(options: UseA11yHudOptions = {}) {
  let captured: UseA11yHudReturn | undefined;
  const wrapper = vueMount(
    defineComponent({
      setup() {
        captured = useA11yHud(options);
        return () => null;
      },
    })
  );
  if (!captured) throw new Error("useA11yHud() did not run during setup");
  return { wrapper, hook: captured };
}

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

  it("mounts the <a11y-hud> element once the owner is mounted", async () => {
    mountComposable();
    await nextTick();
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the initial options to the element", async () => {
    mountComposable({ theme: "light", autoScan: false, debounce: 300 });
    await nextTick();
    expect(hud.getThemeAttribute()).toBe("light");
    expect(hud.hasAutoScan()).toBe(false);
    expect(hud.getDebounceAttribute()).toBe("300");
  });

  it("removes the element when the owner unmounts", async () => {
    const { wrapper } = mountComposable();
    await nextTick();
    wrapper.unmount();
    expect(hud.isMounted()).toBe(false);
  });

  it("runs a scan on initial mount", async () => {
    mountComposable();
    await nextTick();
    expect(runScan).toHaveBeenCalled();
  });

  it("runs a scan again when the scope changes (render-settled signal)", async () => {
    const container = document.createElement("div");
    addToPage(container);
    // shallowReactive makes opts.scope trackable, so the composable's watch fires on change.
    const opts = shallowReactive<UseA11yHudOptions>({ scope: undefined });
    mountComposable(opts);
    await nextTick();
    const callsBefore = runScan.mock.calls.length;

    opts.scope = container;
    await nextTick();

    expect(runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(hud.getScopeElement()).toBe(container);
  });

  it("switches the element's theme when the theme option changes", async () => {
    const opts = reactive<UseA11yHudOptions>({ theme: "light" });
    mountComposable(opts);
    await nextTick();

    opts.theme = "high-contrast";
    await nextTick();

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("keeps the current theme when the theme option becomes undefined", async () => {
    const opts = reactive({ theme: "light" as UseA11yHudOptions["theme"] });
    mountComposable(opts);
    await nextTick();

    opts.theme = undefined;
    await nextTick();

    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("turns auto-scan on when autoScan changes to true", async () => {
    const opts = reactive<UseA11yHudOptions>({ autoScan: false });
    mountComposable(opts);
    await nextTick();
    expect(hud.hasAutoScan()).toBe(false);

    opts.autoScan = true;
    await nextTick();

    expect(hud.hasAutoScan()).toBe(true);
  });

  it("turns auto-scan off when autoScan changes to false", async () => {
    const opts = reactive<UseA11yHudOptions>({ autoScan: true });
    mountComposable(opts);
    await nextTick();

    opts.autoScan = false;
    await nextTick();

    expect(hud.hasAutoScan()).toBe(false);
  });

  it("updates the debounce when the option changes", async () => {
    const opts = reactive<UseA11yHudOptions>({ debounce: 200 });
    mountComposable(opts);
    await nextTick();

    opts.debounce = 400;
    await nextTick();

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("keeps the current debounce when the option becomes undefined", async () => {
    const opts = reactive({ debounce: 200 as UseA11yHudOptions["debounce"] });
    mountComposable(opts);
    await nextTick();
    opts.debounce = 400;
    await nextTick();
    expect(hud.getDebounceAttribute()).toBe("400");

    opts.debounce = undefined;
    await nextTick();

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("scopes the element to the given scope element", async () => {
    const container = document.createElement("div");
    addToPage(container);

    mountComposable({ scope: container });
    await nextTick();

    expect(hud.getScopeElement()).toBe(container);
  });

  it("leaves the element unscoped when scope is null", async () => {
    mountComposable({ scope: null });
    await nextTick();
    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("clears the scope when it goes from an element to undefined", async () => {
    const container = document.createElement("div");
    addToPage(container);
    const opts = shallowReactive<UseA11yHudOptions>({ scope: container });
    mountComposable(opts);
    await nextTick();
    expect(hud.getScopeElement()).toBe(container);

    opts.scope = undefined;
    await nextTick();

    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("applies runOnly changes to the element", async () => {
    const opts = reactive<UseA11yHudOptions>({ runOnly: ["wcag2a"] });
    mountComposable(opts);
    await nextTick();
    expect(hud.getRunOnly()).toEqual(["wcag2a"]);

    opts.runOnly = ["wcag2a", "wcag2aa"];
    await nextTick();

    expect(hud.getRunOnly()).toEqual(["wcag2a", "wcag2aa"]);
  });

  describe("returned API", () => {
    it("runScan() scans the element and resolves with axe results", async () => {
      const { hook } = mountComposable();
      await nextTick();
      runScan.mockClear();

      const results = await hook.runScan();

      expect(runScan).toHaveBeenCalledTimes(1);
      expect(Array.isArray(results?.violations)).toBe(true);
    });

    it("setTheme() changes the element's theme", async () => {
      const { hook } = mountComposable();
      await nextTick();

      hook.setTheme("github-dark");

      expect(hud.getThemeAttribute()).toBe("github-dark");
    });

    it("setRunOnly() changes the element's rule sets", async () => {
      const { hook } = mountComposable();
      await nextTick();

      hook.setRunOnly(["best-practice"]);

      expect(hud.getRunOnly()).toEqual(["best-practice"]);
    });

    it("exportResults() returns the element's export once a scan has settled", async () => {
      const { hook } = mountComposable();
      await hud.awaitReady();

      const json = hook.exportResults();

      expect(json).not.toBeNull();
      expect((JSON.parse(json as string) as { version: string }).version).toBe("1");
    });

    it("ignores.add() persists the rule and ignores.list() reads it back", async () => {
      const { hook } = mountComposable();
      await nextTick();

      hook.ignores.add("color-contrast");

      expect(hook.ignores.list()).toEqual([{ ruleId: "color-contrast" }]);
    });

    it("ignores.remove() drops the rule again", async () => {
      const { hook } = mountComposable();
      await nextTick();
      hook.ignores.add("color-contrast");

      hook.ignores.remove("color-contrast");

      expect(hook.ignores.list()).toEqual([]);
    });

    it("ignores.clear() empties the list", async () => {
      const { hook } = mountComposable();
      await nextTick();
      hook.ignores.add("color-contrast");
      hook.ignores.add("image-alt");

      hook.ignores.clear();

      expect(hook.ignores.list()).toEqual([]);
    });

    it("ignores.exportJson() and ignores.importJson() round-trip the list", async () => {
      const { hook } = mountComposable();
      await nextTick();
      hook.ignores.add("image-alt");
      const json = hook.ignores.exportJson();
      hook.ignores.clear();

      hook.ignores.importJson(json);

      expect(JSON.parse(json)).toEqual([{ ruleId: "image-alt" }]);
      expect(hook.ignores.list()).toEqual([{ ruleId: "image-alt" }]);
    });

    it("ignores.list() and ignores.exportJson() are safe to call during setup", () => {
      let earlyList: unknown[] | undefined;
      let earlyJson: string | undefined;

      vueMount(
        defineComponent({
          setup() {
            const { ignores } = useA11yHud();
            earlyList = ignores.list();
            earlyJson = ignores.exportJson();
            return () => null;
          },
        })
      );

      expect(earlyList).toEqual([]);
      expect(earlyJson).toBe("[]");
    });

    it("runScan and setTheme are stable references across re-renders", async () => {
      const opts = reactive<UseA11yHudOptions>({});
      const captured: { runScan?: unknown; setTheme?: unknown } = {};
      const wrapper = vueMount(
        defineComponent({
          setup() {
            const { runScan: scan, setTheme } = useA11yHud(opts);
            captured.runScan = scan;
            captured.setTheme = setTheme;
            return { runScan: scan, setTheme };
          },
          render() {
            return null;
          },
        })
      );
      await nextTick();

      const vm = wrapper.vm as unknown as { runScan: unknown; setTheme: unknown };
      expect(captured.runScan).toBe(vm.runScan);
      expect(captured.setTheme).toBe(vm.setTheme);
    });
  });
});
