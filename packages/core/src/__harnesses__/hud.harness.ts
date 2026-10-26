import { vi } from "vitest";
import type { A11yHudElement } from "../element.js";
import { HudFiltersHarness } from "./hud.filters.harness.js";
import { HudHarnessError } from "./hud.harness.errors.js";
import { HudIgnoredHarness } from "./hud.ignored.harness.js";
import { HudKeyboardViewHarness } from "./hud.keyboard-view.harness.js";
import { HudToolbarHarness } from "./hud.toolbar.harness.js";
import { HudViolationsHarness } from "./hud.violations.harness.js";
import { withinShadow } from "./scope.js";

/**
 * Root harness for the `<a11y-hud>` custom element.
 *
 * The tree mirrors what the user sees inside the panel:
 *
 *   HudHarness
 *   ├── toolbar       → HudToolbarHarness      (copy / export / re-scan / keyboard / minimize)
 *   ├── filters       → HudFiltersHarness      (severity, WCAG level and rule-set chips)
 *   ├── violations    → HudViolationsHarness   (the list; `.violation(ruleId)` for one item)
 *   ├── ignored       → HudIgnoredHarness      (the collapsible "Ignored rules" section)
 *   └── keyboardView  → HudKeyboardViewHarness (the view shown while keyboard mode is on)
 *
 * Host-level state (theme, minimized, error) lives on the root.
 */
export class HudHarness {
  readonly harnessName = "HudHarness";
  readonly toolbar: HudToolbarHarness;
  readonly filters: HudFiltersHarness;
  readonly violations: HudViolationsHarness;
  readonly ignored: HudIgnoredHarness;
  readonly keyboardView: HudKeyboardViewHarness;

  constructor(private readonly getHost: () => A11yHudElement | null) {
    const getRoot = () => this.queryShadowRoot();
    this.toolbar = new HudToolbarHarness(getRoot);
    this.filters = new HudFiltersHarness(getRoot);
    this.violations = new HudViolationsHarness(getRoot);
    this.ignored = new HudIgnoredHarness(getRoot);
    this.keyboardView = new HudKeyboardViewHarness(getRoot);
  }

  /** Harness for the single `<a11y-hud>` element in the document. */
  static forDocument(): HudHarness {
    return new HudHarness(() => document.querySelector<A11yHudElement>("a11y-hud"));
  }

  // ─── Query ────────────────────────────────────────────────────────────

  queryHost(): A11yHudElement | null {
    return this.getHost();
  }

  queryShadowRoot(): ShadowRoot | null {
    return this.getHost()?.shadowRoot ?? null;
  }

  queryPanel(): HTMLElement | null {
    const root = this.queryShadowRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("complementary", { name: "Accessibility panel" });
  }

  queryFab(): HTMLElement | null {
    const root = this.queryShadowRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("button", { name: "Open accessibility panel" });
  }

  queryScanningState(): HTMLElement | null {
    const root = this.queryShadowRoot();
    if (!root) return null;
    return withinShadow(root).queryByLabelText("Scanning for accessibility issues");
  }

  queryFirstScanPlaceholder(): HTMLElement | null {
    const root = this.queryShadowRoot();
    if (!root) return null;
    return withinShadow(root).queryByText("Running first scan…");
  }

  queryErrorAlert(): HTMLElement | null {
    const root = this.queryShadowRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("alert");
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  /** The `theme` attribute, i.e. what the consumer asked for. */
  getThemeAttribute(): string | null {
    return this.getHost()?.getAttribute("theme") ?? null;
  }

  /** The `data-theme` the element resolved (for example `auto` → `light`). */
  getResolvedTheme(): string | undefined {
    return this.getHost()?.dataset.theme;
  }

  isMinimized(): boolean {
    return this.getHost()?.hasAttribute("data-minimized") ?? false;
  }

  getViolationTotal(): number {
    const root = this.queryShadowRoot();
    if (!root) return 0;
    const count = withinShadow(root).queryByLabelText(/^\d+ violations$/);
    return Number(count?.textContent ?? 0);
  }

  getErrorMessage(): string | null {
    return this.queryErrorAlert()?.textContent?.trim() ?? null;
  }

  // ─── Action ───────────────────────────────────────────────────────────

  /** Dispatches a keydown on the panel, the way a keyboard user would. */
  async pressKey(key: string): Promise<void> {
    const panel = this.queryPanel();
    if (!panel) {
      throw new HudHarnessError(this.harnessName, "Panel not found", { key });
    }
    panel.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  }

  async restoreFromFab(): Promise<void> {
    const fab = this.queryFab();
    if (!fab) {
      throw new HudHarnessError(this.harnessName, "FAB not found", {});
    }
    fab.click();
  }

  /** The element handles these clicks itself; appending a rogue button exercises its guards. */
  async clickRogueButton(className: string, dataset: Record<string, string>): Promise<void> {
    const panel = this.queryPanel();
    if (!panel) {
      throw new HudHarnessError(this.harnessName, "Panel not found", { className });
    }
    const button = document.createElement("button");
    button.className = className;
    Object.assign(button.dataset, dataset);
    panel.appendChild(button);
    button.click();
  }

  // ─── Stabilization ────────────────────────────────────────────────────

  /** Resolves once the panel has rendered, before any scan result is known. */
  async awaitPanel(): Promise<void> {
    await vi.waitFor(() => {
      if (!this.queryPanel()) {
        throw new HudHarnessError(this.harnessName, "Panel not rendered", {});
      }
    });
  }

  /**
   * Resolves once the first scan has settled into one of its end states:
   * a violation list, the "No violations found" message, or an error alert.
   */
  async awaitReady(): Promise<void> {
    await this.awaitPanel();
    await vi.waitFor(() => {
      const settled =
        this.violations.queryList() !== null ||
        this.violations.queryEmptyState() !== null ||
        this.queryErrorAlert() !== null;
      if (!settled) {
        throw new HudHarnessError(this.harnessName, "First scan not settled", {});
      }
    });
  }
}
