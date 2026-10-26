import { within } from "@testing-library/dom";
import { vi } from "vitest";
import { HudHarnessError } from "./hud.harness.errors.js";
import { withinShadow } from "./scope.js";

export class HudViolationsHarness {
  readonly harnessName = "HudViolationsHarness";
  private readonly violationCache = new Map<string, HudViolationHarness>();

  constructor(private readonly getRoot: () => ShadowRoot | null) {}

  // ─── Query ────────────────────────────────────────────────────────────

  queryList(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("list", { name: /^\d+ violations?$/ });
  }

  /** Top-level violation items only; each item nests its own "Affected elements" list. */
  queryItems(): HTMLElement[] {
    const list = this.queryList();
    if (!list) return [];
    return Array.from(list.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === "LI"
    );
  }

  queryItem(ruleId: string): HTMLElement | null {
    return this.queryItems().find((item) => this.ruleIdOf(item) === ruleId) ?? null;
  }

  queryEmptyState(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByText("No violations found");
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  getRuleIds(): string[] {
    return this.queryItems().map((item) => this.ruleIdOf(item));
  }

  getCount(): number {
    return this.queryItems().length;
  }

  private ruleIdOf(item: HTMLElement): string {
    return item.querySelector(".violation-rule")?.textContent?.trim() ?? "";
  }

  // ─── Composition ──────────────────────────────────────────────────────

  violation(ruleId: string): HudViolationHarness {
    let harness = this.violationCache.get(ruleId);
    if (!harness) {
      harness = new HudViolationHarness(ruleId, () => this.queryItem(ruleId));
      this.violationCache.set(ruleId, harness);
    }
    return harness;
  }
}

export class HudViolationHarness {
  readonly harnessName = "HudViolationHarness";

  constructor(
    private readonly ruleId: string,
    private readonly getItem: () => HTMLElement | null
  ) {}

  // ─── Query ────────────────────────────────────────────────────────────

  queryToggle(): HTMLElement | null {
    const item = this.getItem();
    if (!item) return null;
    return within(item).queryByRole("button", {
      name: (name) => name.startsWith(`${this.ruleId} `),
    });
  }

  queryDetail(): HTMLElement | null {
    const item = this.getItem();
    if (!item) return null;
    return within(item).queryByRole("region", { name: `${this.ruleId} details` });
  }

  queryHighlightButtons(): HTMLElement[] {
    const detail = this.queryDetail();
    if (!detail) return [];
    return within(detail).queryAllByRole("button", { name: /^Highlight:/ });
  }

  queryCopyButton(): HTMLElement | null {
    const detail = this.queryDetail();
    if (!detail) return null;
    return within(detail).queryByRole("button", { name: `Copy ${this.ruleId} to clipboard` });
  }

  queryIgnoreButton(): HTMLElement | null {
    const detail = this.queryDetail();
    if (!detail) return null;
    return within(detail).queryByRole("button", { name: `Ignore rule ${this.ruleId}` });
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  isExpanded(): boolean {
    return this.queryToggle()?.getAttribute("aria-expanded") === "true";
  }

  /** The `data-open` state on the detail region that the CSS reacts to. */
  isDetailOpen(): boolean {
    return this.queryDetail()?.hasAttribute("data-open") ?? false;
  }

  // ─── Action ───────────────────────────────────────────────────────────

  async expand(): Promise<void> {
    if (this.isExpanded()) return;
    await this.toggle();
    await vi.waitFor(() => {
      if (!this.isDetailOpen()) {
        throw new HudHarnessError(this.harnessName, "Detail did not open", {
          ruleId: this.ruleId,
        });
      }
    });
  }

  async collapse(): Promise<void> {
    if (!this.isExpanded()) return;
    await this.toggle();
  }

  async toggle(): Promise<void> {
    const toggle = this.queryToggle();
    if (!toggle) {
      throw new HudHarnessError(this.harnessName, "Violation toggle not found", {
        ruleId: this.ruleId,
      });
    }
    toggle.click();
  }

  async focusToggle(): Promise<void> {
    const toggle = this.queryToggle();
    if (!toggle) {
      throw new HudHarnessError(this.harnessName, "Violation toggle not found", {
        ruleId: this.ruleId,
      });
    }
    toggle.focus();
  }

  async highlightNode(nodeIndex = 0): Promise<void> {
    await this.expand();
    const button = this.queryHighlightButtons()[nodeIndex];
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Highlight button not found", {
        ruleId: this.ruleId,
        nodeIndex,
        available: this.queryHighlightButtons().length,
      });
    }
    button.click();
  }

  async copy(): Promise<void> {
    await this.expand();
    const button = this.queryCopyButton();
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Copy button not found", {
        ruleId: this.ruleId,
      });
    }
    button.click();
  }

  async ignore(): Promise<void> {
    await this.expand();
    const button = this.queryIgnoreButton();
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Ignore button not found", {
        ruleId: this.ruleId,
      });
    }
    button.click();
  }
}
