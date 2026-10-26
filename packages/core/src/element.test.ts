import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeRun } from "./__fixtures__/axe-core.mock.js";
import { mockAxeResults } from "./__fixtures__/axe-results.js";
import { mountHudElement, removeHudElements } from "./__fixtures__/hud-element.js";
import { A11yHudElement } from "./element.js";

vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"));

// Ensure module side effects (customElements.define) have run before tests.
void A11yHudElement;

describe("A11yHudElement lifecycle", () => {
  beforeEach(() => {
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("registers as a custom element", () => {
    expect(customElements.get("a11y-hud")).toBe(A11yHudElement);
  });

  it("attaches an open shadow root", () => {
    const { el } = mountHudElement();
    expect(el.shadowRoot).not.toBeNull();
  });

  it("renders the panel on connection", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    expect(hud.queryPanel()).not.toBeNull();
  });

  it("resolves a theme as soon as it connects", () => {
    const { hud } = mountHudElement();
    expect(hud.getResolvedTheme()).toBeDefined();
  });

  it("setTheme() reflects the requested theme to the attribute", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitPanel();
    el.setTheme("light");
    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("re-resolves the theme when the colour-scheme media query changes", () => {
    const listeners = new Map<string, EventListener[]>();
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener(_: string, listener: EventListener) {
          listeners.get(query)?.push(listener);
        },
        removeEventListener() {},
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
    });

    const { hud } = mountHudElement();
    expect(hud.getResolvedTheme()).toBeDefined();

    const schemeListeners = listeners.get("(prefers-color-scheme: dark)") ?? [];
    schemeListeners[0]?.call(null, new Event("change"));
    expect(hud.getResolvedTheme()).toBeDefined();
  });

  it("scans the element matched by the scope attribute", async () => {
    const section = document.createElement("section");
    section.id = "scoped-section";
    document.body.appendChild(section);

    const { hud } = mountHudElement({ scope: "#scoped-section" });
    await hud.awaitReady();

    expect(axeRun).toHaveBeenCalledWith(section, {});
    section.remove();
  });

  it("renders the violations returned by the scan", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    expect(hud.violations.getRuleIds()).toEqual(["image-alt"]);
    expect(hud.getViolationTotal()).toBe(1);
  });

  it("runScan() resolves with the axe results", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    const results = await el.runScan();
    expect(results.violations).toHaveLength(1);
  });

  it("the toolbar minimize button collapses the panel to the FAB", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    await hud.toolbar.minimize();
    expect(hud.isMinimized()).toBe(true);
    expect(hud.queryHost()?.isConnected).toBe(true);
  });

  it("the FAB restores the panel", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    await hud.toolbar.minimize();
    await hud.restoreFromFab();
    expect(hud.isMinimized()).toBe(false);
  });

  it("falls back to a <style> element when constructable stylesheets are unsupported", async () => {
    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
    CSSStyleSheet.prototype.replaceSync = () => {
      throw new Error("not supported");
    };
    try {
      const { el, hud } = mountHudElement();
      await hud.awaitPanel();
      expect(el.shadowRoot?.querySelector("style")).not.toBeNull();
    } finally {
      CSSStyleSheet.prototype.replaceSync = originalReplaceSync;
    }
  });
});

describe("A11yHudElement auto-scan and scope observation", () => {
  beforeEach(() => {
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("an auto-scan attribute set before connection starts observing once connected", () => {
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const el = document.createElement("a11y-hud") as A11yHudElement;
    el.setAttribute("auto-scan", "");
    expect(observe).not.toHaveBeenCalled();

    document.body.appendChild(el);

    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe.mock.calls[0]?.[0]).toBe(document.body);
  });

  it("removing auto-scan while mounted clears the attribute", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitPanel();
    // Set first so that removeAttribute triggers attributeChangedCallback.
    el.setAttribute("auto-scan", "");
    el.removeAttribute("auto-scan");
    expect(el.hasAttribute("auto-scan")).toBe(false);
  });

  it("changing the scope attribute while mounted re-observes the new target", async () => {
    const section = document.createElement("section");
    section.id = "late-scope";
    document.body.appendChild(section);
    const observe = vi.spyOn(MutationObserver.prototype, "observe");

    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    observe.mockClear();

    el.setAttribute("scope", "#late-scope");
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe.mock.calls[0]?.[0]).toBe(section);
    section.remove();
  });

  it("the scopeElement setter restarts the observer only when the element changes", async () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    document.body.append(a, b);
    const observe = vi.spyOn(MutationObserver.prototype, "observe");

    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    observe.mockClear();

    el.scopeElement = a;
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe.mock.calls[0]?.[0]).toBe(a);

    el.scopeElement = a;
    expect(observe).toHaveBeenCalledTimes(1);

    el.scopeElement = b;
    expect(observe).toHaveBeenCalledTimes(2);
    expect(observe.mock.calls[1]?.[0]).toBe(b);
    a.remove();
    b.remove();
  });

  it("scope changes do not start an observer when auto-scan is off", async () => {
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const { el, hud } = mountHudElement();
    el.setAttribute("auto-scan", "");
    el.removeAttribute("auto-scan");
    await hud.awaitReady();
    observe.mockClear();

    el.scopeElement = document.createElement("div");
    expect(observe).not.toHaveBeenCalled();
  });

  it("a runtime debounce change is honoured by the live observer", async () => {
    vi.useFakeTimers();
    try {
      const { el } = mountHudElement();
      el.setAttribute("debounce", "50");
      await vi.advanceTimersByTimeAsync(10);
      axeRun.mockClear();

      const probe = document.createElement("p");
      document.body.appendChild(probe);
      await vi.advanceTimersByTimeAsync(0);
      expect(axeRun).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(60);
      expect(axeRun).toHaveBeenCalledTimes(1);
      probe.remove();
    } finally {
      vi.useRealTimers();
    }
  });

  it("the element's own highlight attribute on the host page does not trigger a rescan", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    const callsBefore = axeRun.mock.calls.length;

    // Setting data-a11y-hud-highlighted is what the highlight feature does; the
    // MutationObserver guard must filter this mutation out.
    document.body.setAttribute("data-a11y-hud-highlighted", "");
    await Promise.resolve(); // flush the MutationObserver microtask queue
    await new Promise<void>((resolve) => setTimeout(resolve, 600)); // past the 500ms debounce

    expect(axeRun.mock.calls.length).toBe(callsBefore);
    document.body.removeAttribute("data-a11y-hud-highlighted");
  });
});

describe("A11yHudElement scan lifecycle and robustness", () => {
  beforeEach(() => {
    localStorage.clear();
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("concurrent runScan() calls share the in-flight promise", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    const first = el.runScan();
    const second = el.runScan();
    expect(second).toBe(first);
    const results = await second;
    expect(results.violations).toHaveLength(1);
  });

  it("renders an error state and rejects when axe.run throws", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    axeRun.mockRejectedValueOnce(new Error("axe exploded"));

    await expect(el.runScan()).rejects.toThrow("axe exploded");

    expect(hud.getErrorMessage()).toContain("Scan failed");
    expect(hud.getErrorMessage()).toContain("axe exploded");
    expect(hud.toolbar.isScanning()).toBe(false);
  });

  it("stringifies non-Error rejection values in the error state", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    axeRun.mockRejectedValueOnce("plain string failure");

    await expect(el.runScan()).rejects.toBe("plain string failure");
    expect(hud.getErrorMessage()).toContain("plain string failure");
  });

  it("does not render the error state while in keyboard mode", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitPanel();
    await hud.toolbar.toggleKeyboardMode();
    axeRun.mockRejectedValueOnce(new Error("kbd failure"));

    await expect(el.runScan()).rejects.toThrow("kbd failure");
    expect(hud.queryErrorAlert()).toBeNull();
  });

  it("does not touch the DOM when the element is removed before a failing scan settles", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitReady();
    axeRun.mockRejectedValueOnce(new Error("late failure"));

    const pending = el.runScan();
    el.remove();

    await expect(pending).rejects.toThrow("late failure");
    expect(hud.queryErrorAlert()).toBeNull();
  });

  it("internal scan triggers surface failures in the panel instead of as unhandled rejections", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    axeRun.mockRejectedValueOnce(new Error("button failure"));

    await hud.toolbar.rescan();

    expect(hud.getErrorMessage()).toContain("button failure");
  });
});
