import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeRun } from "./__fixtures__/axe-core.mock.js";
import { mockAxeResults } from "./__fixtures__/axe-results.js";
import { mountHudElement, removeHudElements } from "./__fixtures__/hud-element.js";
import { A11yHudElement } from "./element.js";

vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"));

void A11yHudElement;

const STORAGE_KEY = "a11y-hud:ignores";

function storedIgnores(): unknown[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown[];
}

describe("A11yHudElement ignored rules", () => {
  beforeEach(() => {
    localStorage.clear();
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("offers an ignore button inside each violation detail", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    expect(hud.violations.violation("image-alt").queryIgnoreButton()).not.toBeNull();
  });

  it("renders the ignored-rules section below the list, collapsed and empty", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    expect(hud.ignored.queryToggle()).not.toBeNull();
    expect(hud.ignored.getCount()).toBe(0);
    expect(hud.ignored.isOpen()).toBe(false);
  });

  it("ignoring a rule persists it and triggers a rescan", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    const callsBefore = axeRun.mock.calls.length;

    await hud.violations.violation("image-alt").ignore();
    await hud.toolbar.awaitScanSettled();

    expect(axeRun.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(storedIgnores()).toEqual([{ ruleId: "image-alt" }]);
  });

  it("the section toggle expands the body", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.ignored.toggle();

    expect(hud.ignored.isOpen()).toBe(true);
    expect(hud.ignored.isToggleExpanded()).toBe(true);
  });

  it("the section toggle collapses the body on a second click", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.ignored.toggle();
    await hud.ignored.toggle();

    expect(hud.ignored.isOpen()).toBe(false);
  });

  it("lists persisted ignores and removes one on request, rescanning", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ruleId: "image-alt" }]));
    const { hud } = mountHudElement();
    await hud.awaitReady();
    expect(hud.ignored.getCount()).toBe(1);
    expect(hud.ignored.queryEntries()).toHaveLength(1);
    const callsBefore = axeRun.mock.calls.length;

    await hud.ignored.remove("image-alt");
    await hud.toolbar.awaitScanSettled();

    expect(axeRun.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(storedIgnores()).toHaveLength(0);
  });

  it("clear-all empties the list and rescans", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ruleId: "image-alt" }]));
    const { hud } = mountHudElement();
    await hud.awaitReady();
    const callsBefore = axeRun.mock.calls.length;

    await hud.ignored.clearAll();
    await hud.toolbar.awaitScanSettled();

    expect(axeRun.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(storedIgnores()).toHaveLength(0);
  });

  it("exporting ignores downloads a JSON blob", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:ignores-url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
      writable: true,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ruleId: "image-alt" }]));
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.ignored.exportJson();

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
  });
});
