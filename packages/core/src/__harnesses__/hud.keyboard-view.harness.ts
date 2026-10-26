import { within } from "@testing-library/dom";
import { HudHarnessError } from "./hud.harness.errors.js";
import { withinShadow } from "./scope.js";

export class HudKeyboardViewHarness {
  readonly harnessName = "HudKeyboardViewHarness";

  constructor(private readonly getRoot: () => ShadowRoot | null) {}

  // ─── Query ────────────────────────────────────────────────────────────

  /** The keyboard-mode view is a styled container without a landmark role. */
  queryView(): HTMLElement | null {
    return this.getRoot()?.querySelector<HTMLElement>(".kbd-mode-view") ?? null;
  }

  queryElementList(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("list", { name: "Focusable elements in tab order" });
  }

  queryElementButtons(): HTMLElement[] {
    const list = this.queryElementList();
    if (!list) return [];
    return within(list).queryAllByRole("button", { name: /^Highlight element \d+:/ });
  }

  queryElementButton(index: number): HTMLElement | null {
    const list = this.queryElementList();
    if (!list) return null;
    return within(list).queryByRole("button", {
      name: (name) => name.startsWith(`Highlight element ${index}:`),
    });
  }

  queryIssuesList(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("list", { name: "Keyboard issues" });
  }

  queryEmptyMessage(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByText("No focusable elements found in the scoped area.");
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  isVisible(): boolean {
    return this.queryView() !== null;
  }

  hasNoIssuesStat(): boolean {
    const root = this.getRoot();
    if (!root) return false;
    return withinShadow(root).queryByText("No issues") !== null;
  }

  // ─── Action ───────────────────────────────────────────────────────────

  async highlightElement(index: number): Promise<void> {
    const button = this.queryElementButton(index);
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Focusable element button not found", {
        index,
        available: this.queryElementButtons().length,
      });
    }
    button.click();
  }
}
