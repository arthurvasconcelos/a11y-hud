import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeRun } from "./__fixtures__/axe-core.mock.js";
import { mockAxeResults, mockViolation } from "./__fixtures__/axe-results.js";
import { mountHudElement, removeHudElements } from "./__fixtures__/hud-element.js";
import { A11yHudElement } from "./element.js";

vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"));

void A11yHudElement;

describe("A11yHudElement filters", () => {
  beforeEach(() => {
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    vi.clearAllMocks();
  });

  describe("filter panel", () => {
    it("starts collapsed", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      expect(hud.filters.isOpen()).toBe(false);
      expect(hud.filters.isToggleExpanded()).toBe(false);
    });

    it("opens when the panel title is clicked", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      await hud.filters.toggle();
      expect(hud.filters.isOpen()).toBe(true);
      expect(hud.filters.isToggleExpanded()).toBe(true);
    });

    it("closes again on a second click", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      await hud.filters.toggle();
      await hud.filters.toggle();
      expect(hud.filters.isOpen()).toBe(false);
    });

    it("marks the title as active while a severity filter is on", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      await hud.filters.toggle();
      await hud.filters.toggleSeverity("critical");
      expect(hud.filters.hasActiveIndicator()).toBe(true);
    });

    it("clears the active marker once all filters are off", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      await hud.filters.toggle();
      await hud.filters.toggleSeverity("critical");
      await hud.filters.toggleSeverity("critical");
      expect(hud.filters.hasActiveIndicator()).toBe(false);
    });
  });

  describe("severity chips", () => {
    it("start unpressed, meaning no filter is applied", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      const chips = hud.filters.queryAllSeverityChips();
      expect(chips).toHaveLength(4);
      for (const chip of chips) {
        expect(chip.getAttribute("aria-pressed")).toBe("false");
      }
    });

    it("toggle between pressed and unpressed on successive clicks", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      await hud.filters.toggleSeverity("minor");
      expect(hud.filters.isSeverityPressed("minor")).toBe(true);
      await hud.filters.toggleSeverity("minor");
      expect(hud.filters.isSeverityPressed("minor")).toBe(false);
    });

    it("can all be pressed and released independently", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      for (const severity of ["critical", "serious", "moderate", "minor"] as const) {
        await hud.filters.toggleSeverity(severity);
      }
      for (const severity of ["critical", "serious", "moderate", "minor"] as const) {
        await hud.filters.toggleSeverity(severity);
        expect(hud.filters.isSeverityPressed(severity)).toBe(false);
      }
    });

    it("narrow the list to violations of the pressed severity", async () => {
      axeRun.mockResolvedValue(
        mockAxeResults({
          violations: [
            mockViolation({ impact: "critical" }),
            mockViolation({ id: "link-name", impact: "serious" }),
          ],
        })
      );
      const { hud } = mountHudElement();
      await hud.awaitReady();
      expect(hud.violations.getCount()).toBe(2);

      await hud.filters.toggleSeverity("critical");

      expect(hud.violations.getRuleIds()).toEqual(["image-alt"]);
    });

    it("can be clicked before the first scan resolves without throwing", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      await expect(hud.filters.toggleSeverity("minor")).resolves.toBeUndefined();
    });
  });

  describe("WCAG level chips", () => {
    it("toggle between pressed and unpressed", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();
      expect(hud.filters.isLevelPressed("AA")).toBe(false);
      await hud.filters.toggleLevel("AA");
      expect(hud.filters.isLevelPressed("AA")).toBe(true);
      await hud.filters.toggleLevel("AA");
      expect(hud.filters.isLevelPressed("AA")).toBe(false);
    });

    it("narrow the list to violations tagged with the pressed level", async () => {
      axeRun.mockResolvedValue(
        mockAxeResults({
          violations: [
            mockViolation({ id: "wcag-a", tags: ["wcag2a"] }),
            mockViolation({ id: "wcag-aaa", tags: ["wcag2aaa"] }),
          ],
        })
      );
      const { hud } = mountHudElement();
      await hud.awaitReady();

      await hud.filters.toggleLevel("A");

      expect(hud.violations.getRuleIds()).toEqual(["wcag-a"]);
    });

    it("keep violations that have no WCAG level while a level filter is on", async () => {
      axeRun.mockResolvedValue(
        mockAxeResults({
          violations: [
            mockViolation({ id: "best-practice-rule", tags: ["best-practice"] }),
            mockViolation({ id: "image-alt", tags: ["wcag2aa"] }),
            mockViolation({ id: "wcag-aaa", tags: ["wcag2aaa"] }),
          ],
        })
      );
      const { hud } = mountHudElement();
      await hud.awaitReady();

      await hud.filters.toggleLevel("AA");

      expect(hud.violations.getRuleIds()).toEqual(["best-practice-rule", "image-alt"]);
    });
  });

  describe("rule-set chips", () => {
    it("pressing a chip marks it pressed and triggers a scan restricted to that rule set", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const callsBefore = axeRun.mock.calls.length;

      await hud.filters.toggleRuleSet("wcag2a");

      expect(hud.filters.isRuleSetPressed("wcag2a")).toBe(true);
      expect(axeRun.mock.calls.length).toBeGreaterThan(callsBefore);
      expect(axeRun).toHaveBeenLastCalledWith(document.body, {
        runOnly: { type: "tag", values: ["wcag2a"] },
      });
    });

    it("pressing an active chip releases it", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      await hud.filters.toggleRuleSet("wcag2aa");
      expect(hud.filters.isRuleSetPressed("wcag2aa")).toBe(true);
      await hud.filters.toggleRuleSet("wcag2aa");
      expect(hud.filters.isRuleSetPressed("wcag2aa")).toBe(false);
    });

    it("setRunOnly() presses the matching chip", async () => {
      const { el, hud } = mountHudElement();
      await hud.awaitPanel();
      el.setRunOnly(["best-practice"]);
      expect(hud.filters.isRuleSetPressed("best-practice")).toBe(true);
    });

    it("setRunOnly([]) releases every chip", async () => {
      const { el, hud } = mountHudElement();
      await hud.awaitPanel();
      el.setRunOnly(["wcag2a"]);
      el.setRunOnly([]);
      for (const chip of hud.filters.queryAllRuleSetChips()) {
        expect(chip.getAttribute("aria-pressed")).toBe("false");
      }
    });

    it("the run-only attribute accepts a JSON array and scans with it", async () => {
      const { hud } = mountHudElement({ "run-only": '["wcag2a","wcag2aa"]' });
      await hud.awaitReady();
      expect(hud.filters.isRuleSetPressed("wcag2a")).toBe(true);
      expect(hud.filters.isRuleSetPressed("wcag2aa")).toBe(true);
      expect(axeRun).toHaveBeenCalledWith(document.body, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      });
    });

    it("the run-only attribute falls back to no restriction on invalid JSON", async () => {
      const { hud } = mountHudElement({ "run-only": "not-json" });
      await hud.awaitReady();
      expect(axeRun).toHaveBeenCalledWith(document.body, {});
    });

    it("the run-only attribute falls back to no restriction when the JSON is not an array", async () => {
      const { hud } = mountHudElement({ "run-only": '"just-a-string"' });
      await hud.awaitReady();
      expect(axeRun).toHaveBeenCalledWith(document.body, {});
    });
  });
});
