import { cleanup, render } from "@testing-library/svelte";
import { A11yHudElement } from "a11y-hud";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UseA11yHudReturn } from "../../src/types.js";
import HookWrapper from "../HookWrapper.svelte";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";

const hud = new HudHostHarness();

/** Renders the wrapper component that runs the hook and hands back what it returned. */
function mountHook(): UseA11yHudReturn {
  let captured: UseA11yHudReturn | undefined;
  render(HookWrapper, {
    props: {
      onResult: (result) => {
        captured = result;
      },
    },
  });
  if (!captured) throw new Error("onResult not called during component init");
  return captured;
}

describe("useA11yHud hook", () => {
  let runScan: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    hud.track();
    runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
  });

  afterEach(async () => {
    cleanup();
    await hud.cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("runScan() scans the element and resolves with axe results", async () => {
    const hook = mountHook();
    await tick();
    runScan.mockClear();

    const results = await hook.runScan();

    expect(runScan).toHaveBeenCalledTimes(1);
    expect(Array.isArray(results?.violations)).toBe(true);
  });

  it("setTheme() changes the element's theme", async () => {
    const hook = mountHook();
    await tick();

    hook.setTheme("high-contrast");

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("setRunOnly() changes the element's rule sets", async () => {
    const hook = mountHook();
    await tick();

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

  it("ignores.add() persists the rule and ignores.list() reads it back", async () => {
    const hook = mountHook();
    await tick();

    hook.ignores.add("color-contrast");

    expect(hook.ignores.list()).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("ignores.remove() drops the rule again", async () => {
    const hook = mountHook();
    await tick();
    hook.ignores.add("color-contrast");

    hook.ignores.remove("color-contrast");

    expect(hook.ignores.list()).toEqual([]);
  });

  it("ignores.clear() empties the list", async () => {
    const hook = mountHook();
    await tick();
    hook.ignores.add("color-contrast");
    hook.ignores.add("image-alt");

    hook.ignores.clear();

    expect(hook.ignores.list()).toEqual([]);
  });

  it("ignores.exportJson() and ignores.importJson() round-trip the list", async () => {
    const hook = mountHook();
    await tick();
    hook.ignores.add("image-alt");
    const json = hook.ignores.exportJson();
    hook.ignores.clear();

    hook.ignores.importJson(json);

    expect(JSON.parse(json)).toEqual([{ ruleId: "image-alt" }]);
    expect(hook.ignores.list()).toEqual([{ ruleId: "image-alt" }]);
  });

  it("ignores.list() and ignores.exportJson() are safe to call during component init", () => {
    let earlyList: unknown[] | undefined;
    let earlyJson: string | undefined;

    render(HookWrapper, {
      props: {
        onResult: (result) => {
          earlyList = result.ignores.list();
          earlyJson = result.ignores.exportJson();
        },
      },
    });

    expect(earlyList).toEqual([]);
    expect(earlyJson).toBe("[]");
  });

  it("runScan() resolves with null when called before the element is mounted", async () => {
    let early: Promise<unknown> | undefined;

    render(HookWrapper, {
      props: {
        onResult: (result) => {
          early = result.runScan();
        },
      },
    });

    await expect(early).resolves.toBeNull();
  });
});
