import type { A11yHudElement } from "a11y-hud";
import { vi } from "vitest";
import { HudHostHarnessError } from "./hud-host.harness.errors.js";

/**
 * Harness for the `<a11y-hud>` element an adapter mounts into the document.
 *
 * The adapter's whole job is to wire framework props and lifecycle to the
 * element, so this harness reads the element's public surface (attributes,
 * scope, mounted state) plus the rendered rule ids, and nothing deeper. The
 * panel's internals are the core package's integration tests to cover.
 *
 * axe-core is a singleton that refuses to start while a scan is in flight, so
 * the harness also records every element that connects during a test and waits
 * for their scans to settle before the next test starts. Call `track()` in
 * `beforeEach` and `await cleanup()` in `afterEach`.
 *
 * @scope document
 */
export class HudHostHarness {
  readonly harnessName = "HudHostHarness";
  private readonly hosts = new Set<A11yHudElement>();
  private observer: MutationObserver | undefined;

  // ─── Lifecycle ────────────────────────────────────────────────────────

  /** Starts recording every `<a11y-hud>` added to the page, so `cleanup()` can wait for its scans. */
  track(): void {
    this.observer = new MutationObserver((records) => this.collect(records));
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  /** Waits for in-flight scans on every tracked element, then removes them all. */
  async cleanup(): Promise<void> {
    await this.awaitIdle();
    for (const host of this.trackedHosts()) host.remove();
    this.queryHost()?.remove();
    this.observer?.disconnect();
    this.observer = undefined;
    this.hosts.clear();
  }

  private trackedHosts(): A11yHudElement[] {
    if (this.observer) this.collect(this.observer.takeRecords());
    return Array.from(this.hosts);
  }

  private collect(records: MutationRecord[]): void {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element && node.tagName === "A11Y-HUD") {
          this.hosts.add(node as A11yHudElement);
        }
      }
    }
  }

  // ─── Query ────────────────────────────────────────────────────────────

  queryHost(): A11yHudElement | null {
    return document.querySelector<A11yHudElement>("a11y-hud");
  }

  queryViolationList(): HTMLElement | null {
    const root = this.queryHost()?.shadowRoot;
    if (!root) return null;
    for (const list of root.querySelectorAll<HTMLElement>('[role="list"]')) {
      if (/^\d+ violations?$/.test(list.getAttribute("aria-label") ?? "")) return list;
    }
    return null;
  }

  queryEmptyState(): HTMLElement | null {
    const root = this.queryHost()?.shadowRoot;
    if (!root) return null;
    for (const title of root.querySelectorAll<HTMLElement>(".empty-state-title")) {
      if (title.textContent?.trim() === "No violations found") return title;
    }
    return null;
  }

  queryErrorAlert(): HTMLElement | null {
    return this.queryHost()?.shadowRoot?.querySelector<HTMLElement>('[role="alert"]') ?? null;
  }

  // ─── Get ──────────────────────────────────────────────────────────────

  isMounted(): boolean {
    return this.queryHost() !== null;
  }

  getThemeAttribute(): string | null {
    return this.requireHost().getAttribute("theme");
  }

  hasAutoScan(): boolean {
    return this.requireHost().hasAttribute("auto-scan");
  }

  getDebounceAttribute(): string | null {
    return this.requireHost().getAttribute("debounce");
  }

  getRunOnly(): string[] | null {
    const raw = this.requireHost().getAttribute("run-only");
    return raw === null ? null : (JSON.parse(raw) as string[]);
  }

  getScopeElement(): Element | undefined {
    return this.requireHost().scopeElement;
  }

  getRuleIds(): string[] {
    const list = this.queryViolationList();
    if (!list) return [];
    return Array.from(list.children)
      .filter((item) => item.tagName === "LI")
      .map((item) => item.querySelector(".violation-rule")?.textContent?.trim() ?? "");
  }

  private requireHost(): A11yHudElement {
    const host = this.queryHost();
    if (!host) {
      throw new HudHostHarnessError(this.harnessName, "<a11y-hud> is not in the document", {});
    }
    return host;
  }

  // ─── Stabilization ────────────────────────────────────────────────────

  /** Resolves once no tracked element (attached or not) has a scan in flight. */
  async awaitIdle(): Promise<void> {
    await vi.waitFor(
      () => {
        const busy = this.trackedHosts().filter(
          (host) => host.shadowRoot?.querySelector("[data-scanning]") !== null
        );
        if (busy.length > 0) {
          throw new HudHostHarnessError(this.harnessName, "Scans still in flight", {
            busy: busy.length,
          });
        }
      },
      { timeout: 5000 }
    );
  }

  /** Resolves once a real scan has settled into a list, an empty state or an error. */
  async awaitReady(): Promise<void> {
    await vi.waitFor(
      () => {
        const settled =
          this.queryViolationList() !== null ||
          this.queryEmptyState() !== null ||
          this.queryErrorAlert() !== null;
        if (!settled) {
          throw new HudHostHarnessError(this.harnessName, "Scan not settled", {
            mounted: this.isMounted(),
          });
        }
      },
      { timeout: 5000 }
    );
  }
}
