import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("axe-core", () => ({
  default: { run: vi.fn().mockResolvedValue({ violations: [] }) },
}));

import { A11yHudElement } from "./element.js";
import { mount } from "./mount.js";

void A11yHudElement;

describe("mount()", () => {
  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    vi.clearAllMocks();
  });

  it("creates and appends an a11y-hud element", () => {
    mount();
    expect(document.querySelector("a11y-hud")).not.toBeNull();
  });

  it("returns an instance with unmount()", () => {
    const hud = mount();
    hud.unmount();
    expect(document.querySelector("a11y-hud")).toBeNull();
  });

  it("reuses an existing a11y-hud element", () => {
    mount();
    mount();
    expect(document.querySelectorAll("a11y-hud")).toHaveLength(1);
  });

  it("sets theme attribute from options", () => {
    mount({ theme: "light" });
    expect(document.querySelector("a11y-hud")?.getAttribute("theme")).toBe("light");
  });

  it("sets scope attribute when string passed", () => {
    mount({ scope: "main" });
    expect(document.querySelector("a11y-hud")?.getAttribute("scope")).toBe("main");
  });

  it("sets scopeElement when Element passed", () => {
    const el = document.createElement("main");
    document.body.appendChild(el);
    mount({ scope: el });
    const hud = document.querySelector("a11y-hud") as A11yHudElement;
    expect(hud.scopeElement).toBe(el);
    el.remove();
  });

  it("removes auto-scan attribute when autoScan is false", () => {
    mount({ autoScan: false });
    expect(document.querySelector("a11y-hud")?.hasAttribute("auto-scan")).toBe(false);
  });

  it("sets auto-scan attribute when autoScan is true", () => {
    mount({ autoScan: true });
    expect(document.querySelector("a11y-hud")?.hasAttribute("auto-scan")).toBe(true);
  });

  it("sets debounce attribute from options", () => {
    mount({ debounce: 300 });
    expect(document.querySelector("a11y-hud")?.getAttribute("debounce")).toBe("300");
  });

  it("sets run-only attribute when runOnly option is provided with tags", () => {
    mount({ runOnly: ["wcag2a", "wcag2aa"] });
    expect(document.querySelector("a11y-hud")?.getAttribute("run-only")).toBe(
      '["wcag2a","wcag2aa"]'
    );
  });

  it("does not set run-only attribute when runOnly is an empty array", () => {
    mount({ runOnly: [] });
    expect(document.querySelector("a11y-hud")?.hasAttribute("run-only")).toBe(false);
  });

  it("setTheme() on the instance updates the element theme", () => {
    const hud = mount();
    hud.setTheme("high-contrast");
    expect(document.querySelector("a11y-hud")?.getAttribute("theme")).toBe("high-contrast");
  });

  it("setRunOnly() on the instance updates the run-only attribute", () => {
    const hud = mount();
    hud.setRunOnly(["best-practice"]);
    expect(document.querySelector("a11y-hud")?.getAttribute("run-only")).toBe('["best-practice"]');
  });

  it("runScan() on the instance resolves with axe results", async () => {
    const hud = mount();
    const results = await hud.runScan();
    expect(Array.isArray(results.violations)).toBe(true);
  });
});
