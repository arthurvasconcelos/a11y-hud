import { within } from "@testing-library/dom";
import { vi } from "vitest";
import { HudHarnessError } from "./hud.harness.errors.js";
import { withinShadow } from "./scope.js";

export class HudToolbarHarness {
  readonly harnessName = "HudToolbarHarness";

  constructor(private readonly getRoot: () => ShadowRoot | null) {}

  // ─── Query ────────────────────────────────────────────────────────────

  queryToolbar(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("toolbar", { name: "Panel actions" });
  }

  queryCopyAllButton(): HTMLElement | null {
    return this.queryButton("Copy all violations to clipboard");
  }

  queryExportButton(): HTMLElement | null {
    return this.queryButton("Export results as JSON");
  }

  queryRescanButton(): HTMLElement | null {
    return this.queryButton("Re-scan page");
  }

  queryKeyboardButton(): HTMLElement | null {
    return this.queryButton("Toggle keyboard mode");
  }

  queryMinimizeButton(): HTMLElement | null {
    return this.queryButton("Minimize panel");
  }

  private queryButton(name: string): HTMLElement | null {
    const toolbar = this.queryToolbar();
    if (!toolbar) return null;
    return within(toolbar).queryByRole("button", { name });
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  isScanning(): boolean {
    return this.queryRescanButton()?.hasAttribute("data-scanning") ?? false;
  }

  isKeyboardModeOn(): boolean {
    return this.queryKeyboardButton()?.getAttribute("aria-pressed") === "true";
  }

  // ─── Action ───────────────────────────────────────────────────────────

  async copyAll(): Promise<void> {
    this.click(this.queryCopyAllButton(), "Copy all");
  }

  async exportJson(): Promise<void> {
    this.click(this.queryExportButton(), "Export JSON");
  }

  /** Clicks re-scan and waits for the scan to settle. */
  async rescan(): Promise<void> {
    this.click(this.queryRescanButton(), "Re-scan");
    await this.awaitScanSettled();
  }

  async toggleKeyboardMode(): Promise<void> {
    this.click(this.queryKeyboardButton(), "Keyboard mode");
  }

  async minimize(): Promise<void> {
    this.click(this.queryMinimizeButton(), "Minimize");
  }

  private click(button: HTMLElement | null, label: string): void {
    if (!button) {
      throw new HudHarnessError(this.harnessName, `${label} button not found`, { label });
    }
    button.click();
  }

  // ─── Stabilization ────────────────────────────────────────────────────

  /** Resolves once the re-scan button is no longer flagged as scanning. */
  async awaitScanSettled(): Promise<void> {
    await vi.waitFor(() => {
      if (this.isScanning()) {
        throw new HudHarnessError(this.harnessName, "Scan still running", {});
      }
    });
  }
}
