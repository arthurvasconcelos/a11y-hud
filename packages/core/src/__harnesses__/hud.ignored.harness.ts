import { within } from "@testing-library/dom";
import { vi } from "vitest";
import { HudHarnessError } from "./hud.harness.errors.js";
import { withinShadow } from "./scope.js";

export class HudIgnoredHarness {
  readonly harnessName = "HudIgnoredHarness";

  constructor(private readonly getRoot: () => ShadowRoot | null) {}

  // ─── Query ────────────────────────────────────────────────────────────

  queryToggle(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("button", { name: /^Ignored rules \(\d+\)$/ });
  }

  queryBody(): HTMLElement | null {
    const toggle = this.queryToggle();
    const root = this.getRoot();
    const bodyId = toggle?.getAttribute("aria-controls");
    if (!root || !bodyId) return null;
    return root.getElementById(bodyId);
  }

  queryEntries(): HTMLElement[] {
    const body = this.queryBody();
    if (!body) return [];
    const list = within(body).queryByRole("list", { name: "Ignored rules" });
    if (!list) return [];
    return within(list).queryAllByRole("listitem");
  }

  queryRemoveButton(ruleId: string): HTMLElement | null {
    const body = this.queryBody();
    if (!body) return null;
    return within(body).queryByRole("button", { name: `Remove ignore for ${ruleId}` });
  }

  queryClearButton(): HTMLElement | null {
    const body = this.queryBody();
    if (!body) return null;
    return within(body).queryByRole("button", { name: "Clear all ignored rules" });
  }

  queryExportButton(): HTMLElement | null {
    const body = this.queryBody();
    if (!body) return null;
    return within(body).queryByRole("button", { name: "Export ignored rules as JSON" });
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  getCount(): number {
    const text = this.queryToggle()?.textContent ?? "";
    const match = /\((\d+)\)/.exec(text);
    return match ? Number(match[1]) : 0;
  }

  isOpen(): boolean {
    return this.queryBody()?.hasAttribute("data-open") ?? false;
  }

  isToggleExpanded(): boolean {
    return this.queryToggle()?.getAttribute("aria-expanded") === "true";
  }

  // ─── Action ───────────────────────────────────────────────────────────

  async toggle(): Promise<void> {
    const toggle = this.queryToggle();
    if (!toggle) {
      throw new HudHarnessError(this.harnessName, "Ignored section toggle not found", {});
    }
    toggle.click();
  }

  async open(): Promise<void> {
    if (this.isOpen()) return;
    await this.toggle();
    await vi.waitFor(() => {
      if (!this.isOpen()) {
        throw new HudHarnessError(this.harnessName, "Ignored section did not open", {});
      }
    });
  }

  async remove(ruleId: string): Promise<void> {
    const button = this.queryRemoveButton(ruleId);
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Remove-ignore button not found", {
        ruleId,
        ignored: this.getCount(),
      });
    }
    button.click();
  }

  async clearAll(): Promise<void> {
    await this.open();
    const button = this.queryClearButton();
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Clear-all button not found", {
        ignored: this.getCount(),
      });
    }
    button.click();
  }

  async exportJson(): Promise<void> {
    await this.open();
    const button = this.queryExportButton();
    if (!button) {
      throw new HudHarnessError(this.harnessName, "Export-ignores button not found", {});
    }
    button.click();
  }
}
