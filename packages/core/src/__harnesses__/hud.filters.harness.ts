import { within } from "@testing-library/dom";
import { vi } from "vitest";
import type { Severity } from "../types.js";
import { HudHarnessError } from "./hud.harness.errors.js";
import { withinShadow } from "./scope.js";

export class HudFiltersHarness {
  readonly harnessName = "HudFiltersHarness";

  constructor(private readonly getRoot: () => ShadowRoot | null) {}

  // ─── Query ────────────────────────────────────────────────────────────

  queryToggle(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("button", { name: /Toggle filters$/ });
  }

  queryPanel(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByLabelText("Filters");
  }

  querySeverityChip(severity: Severity): HTMLElement | null {
    const label = severity.charAt(0).toUpperCase() + severity.slice(1);
    return this.queryChip("Filter by severity", label);
  }

  queryAllSeverityChips(): HTMLElement[] {
    return this.queryAllChips("Filter by severity");
  }

  queryLevelChip(level: "A" | "AA" | "AAA"): HTMLElement | null {
    return this.queryChip("Filter by WCAG level", level);
  }

  queryRuleSetChip(ruleSet: string): HTMLElement | null {
    return this.queryChip("Run only rule sets", ruleSet);
  }

  queryAllRuleSetChips(): HTMLElement[] {
    return this.queryAllChips("Run only rule sets");
  }

  private queryGroup(name: string): HTMLElement | null {
    const panel = this.queryPanel();
    if (!panel) return null;
    return within(panel).queryByRole("group", { name });
  }

  private queryChip(group: string, label: string): HTMLElement | null {
    const groupEl = this.queryGroup(group);
    if (!groupEl) return null;
    return within(groupEl).queryByRole("button", { name: label });
  }

  private queryAllChips(group: string): HTMLElement[] {
    const groupEl = this.queryGroup(group);
    if (!groupEl) return [];
    return within(groupEl).queryAllByRole("button");
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  /** Whether the filters panel is expanded (the `data-open` state the CSS reacts to). */
  isOpen(): boolean {
    return this.queryPanel()?.hasAttribute("data-open") ?? false;
  }

  /** The `aria-expanded` state announced on the toggle button. */
  isToggleExpanded(): boolean {
    return this.queryToggle()?.getAttribute("aria-expanded") === "true";
  }

  /** Whether the toggle shows the "filters active" indicator. */
  hasActiveIndicator(): boolean {
    return this.queryToggle()?.hasAttribute("data-active") ?? false;
  }

  isSeverityPressed(severity: Severity): boolean {
    return this.isPressed(this.querySeverityChip(severity), { severity });
  }

  isLevelPressed(level: "A" | "AA" | "AAA"): boolean {
    return this.isPressed(this.queryLevelChip(level), { level });
  }

  isRuleSetPressed(ruleSet: string): boolean {
    return this.isPressed(this.queryRuleSetChip(ruleSet), { ruleSet });
  }

  private isPressed(chip: HTMLElement | null, context: Record<string, unknown>): boolean {
    if (!chip) {
      throw new HudHarnessError(this.harnessName, "Filter chip not found", context);
    }
    return chip.getAttribute("aria-pressed") === "true";
  }

  // ─── Action ───────────────────────────────────────────────────────────

  async toggle(): Promise<void> {
    const toggle = this.queryToggle();
    if (!toggle) {
      throw new HudHarnessError(this.harnessName, "Filters toggle not found", {});
    }
    toggle.click();
  }

  async toggleSeverity(severity: Severity): Promise<void> {
    this.clickChip(this.querySeverityChip(severity), { severity });
  }

  async toggleLevel(level: "A" | "AA" | "AAA"): Promise<void> {
    this.clickChip(this.queryLevelChip(level), { level });
  }

  /** Rule-set chips trigger a new scan, so this waits for the scan to settle. */
  async toggleRuleSet(ruleSet: string): Promise<void> {
    this.clickChip(this.queryRuleSetChip(ruleSet), { ruleSet });
    await vi.waitFor(() => {
      const root = this.getRoot();
      const rescan = root
        ? withinShadow(root).queryByRole("button", { name: "Re-scan page" })
        : null;
      if (rescan?.hasAttribute("data-scanning")) {
        throw new HudHarnessError(this.harnessName, "Scan still running", { ruleSet });
      }
    });
  }

  private clickChip(chip: HTMLElement | null, context: Record<string, unknown>): void {
    if (!chip) {
      throw new HudHarnessError(this.harnessName, "Filter chip not found", context);
    }
    chip.click();
  }
}
