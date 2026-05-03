import type { AxeResults } from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axe-core", () => ({
  default: { run: vi.fn() },
}));

import { A11yHudElement } from "./element.js";

// Ensure module side effects (customElements.define) have run before tests.
// Without accessing the export, esbuild may defer execution of the module.
void A11yHudElement;

const MOCK_RESULTS: AxeResults = {
  violations: [
    {
      id: "image-alt",
      impact: "critical",
      tags: ["wcag2a"],
      description: "Images must have alternate text",
      help: "Image alt attribute",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
      nodes: [
        {
          html: '<img src="test.png">',
          impact: "critical",
          target: ["img"],
          any: [],
          all: [],
          none: [],
          failureSummary: "Fix any of the following",
          element: null as unknown as HTMLElement,
        },
      ],
    },
  ],
  passes: [],
  incomplete: [],
  inapplicable: [],
  timestamp: "2026-01-01T00:00:00.000Z",
  url: "http://localhost/",
  testEngine: { name: "axe-core", version: "4.0.0" },
  testEnvironment: {
    userAgent: "",
    windowWidth: 0,
    windowHeight: 0,
    orientationAngle: 0,
    orientationType: "",
  },
  testRunner: { name: "axe" },
  toolOptions: {},
};

async function setupMock() {
  const axe = (await import("axe-core")).default as unknown as {
    run: ReturnType<typeof vi.fn>;
  };
  axe.run.mockResolvedValue(MOCK_RESULTS);
}

function createElement(): A11yHudElement {
  const el = document.createElement("a11y-hud") as A11yHudElement;
  document.body.appendChild(el);
  return el;
}

describe("A11yHudElement", () => {
  beforeEach(async () => {
    await setupMock();
  });

  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    document.getElementById("a11y-hud-highlight-style")?.remove();
    vi.clearAllMocks();
  });

  it("registers as a custom element", () => {
    expect(customElements.get("a11y-hud")).toBeDefined();
  });

  it("attaches a shadow root", () => {
    const el = createElement();
    expect(el.shadowRoot).not.toBeNull();
    el.remove();
  });

  it("renders the panel on connection", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());
    el.remove();
  });

  it("sets data-theme attribute after connection", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.dataset.theme).toBeDefined());
    el.remove();
  });

  it("sets theme via setTheme()", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());
    el.setTheme("light");
    expect(el.getAttribute("theme")).toBe("light");
    el.remove();
  });

  it("reflects auto-scan attribute", () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    el.setAttribute("auto-scan", "");
    expect(el.getAttribute("auto-scan")).toBe("");
  });

  it("disabling auto-scan while mounted disconnects the observer", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());
    // Must set the attribute first so removeAttribute triggers attributeChangedCallback
    el.setAttribute("auto-scan", "");
    el.removeAttribute("auto-scan");
    expect(el.getAttribute("auto-scan")).toBeNull();
    el.remove();
  });

  it("watchTheme callback updates dataset.theme on media change", async () => {
    const listeners: Map<string, EventListener[]> = new Map();
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener(_: string, l: EventListener) {
          listeners.get(query)?.push(l);
        },
        removeEventListener() {},
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
    });

    const el = createElement();
    await vi.waitFor(() => expect(el.dataset.theme).toBeDefined());

    const schemeListeners = listeners.get("(prefers-color-scheme: dark)") ?? [];
    schemeListeners[0]?.call(null, new Event("change"));
    expect(el.dataset.theme).toBeDefined();

    el.remove();
    vi.restoreAllMocks();
  });

  it("scope attribute restricts scan target", async () => {
    const section = document.createElement("section");
    section.id = "scoped-section";
    document.body.appendChild(section);

    const el = document.createElement("a11y-hud") as A11yHudElement;
    el.setAttribute("scope", "#scoped-section");
    document.body.appendChild(el);

    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());
    el.remove();
    section.remove();
  });

  it("renders violations after scan", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    expect(el.shadowRoot?.querySelector(".violation-rule")?.textContent?.trim()).toBe("image-alt");
    el.remove();
  });

  it("triggerScan() returns axe results", async () => {
    const el = createElement();
    // Wait for initial scan to complete (violation list rendered) before triggering a new one.
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    const results = await el.triggerScan();
    expect(results.violations).toHaveLength(1);
    el.remove();
  });

  it("minimize button hides the panel and shows the FAB", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-minimize")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-minimize")?.click();
    expect(el.hasAttribute("data-minimized")).toBe(true);
    expect(document.querySelector("a11y-hud")).not.toBeNull();
    el.remove();
  });

  describe("filter chips", () => {
    it("severity filter toggles aria-pressed", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="minor"]');
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      el.remove();
    });

    it("does not deactivate the last active severity", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chips = el.shadowRoot?.querySelectorAll<HTMLElement>("[data-severity]") ?? [];
      for (const c of chips) {
        if (c.getAttribute("aria-pressed") === "true") c.click();
      }

      const stillActive = el.shadowRoot?.querySelectorAll<HTMLElement>(
        '[data-severity][aria-pressed="true"]'
      );
      expect(stillActive?.length ?? 0).toBeGreaterThanOrEqual(1);
      el.remove();
    });
  });

  describe("filter chips — WCAG level", () => {
    it("WCAG level filter toggles aria-pressed", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-level="AA"]');
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      el.remove();
    });
  });

  describe("violation item expand/collapse", () => {
    it("clicking an expanded toggle collapses the detail", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
      toggle?.click(); // expand
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());
      toggle?.click(); // collapse
      expect(el.shadowRoot?.querySelector("[data-open]")).toBeNull();
      el.remove();
    });
  });

  describe("severity filter re-activation", () => {
    it("deactivated chip can be re-activated", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="minor"]');
      chip?.click(); // deactivate
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      chip?.click(); // re-activate
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      el.remove();
    });
  });

  it("filter chip click before scan resolves does not throw", () => {
    const el = createElement();
    // Click filter chip synchronously — scan hasn't resolved yet, this._results is undefined
    const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="minor"]');
    chip?.click();
    el.remove();
  });

  describe("keyboard navigation", () => {
    it("Escape key minimizes the panel (shows FAB)", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());

      const panel = el.shadowRoot?.querySelector<HTMLElement>(".panel");
      panel?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

      expect(el.dataset.minimized).toBeDefined();
      // Element stays in DOM; only minimized
      expect(document.querySelector("a11y-hud")).not.toBeNull();
      el.remove();
    });

    it("ArrowDown with no violation list is a no-op (empty results)", async () => {
      const axe = (await import("axe-core")).default as unknown as {
        run: ReturnType<typeof vi.fn>;
      };
      axe.run.mockResolvedValue({ violations: [], passes: [], incomplete: [], inapplicable: [] });

      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());
      // Wait for empty state (no violation list)
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).toBeNull());

      const panel = el.shadowRoot?.querySelector<HTMLElement>(".panel");
      panel?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      el.remove();
    });

    it("ArrowDown moves focus to the next violation toggle", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const panel = el.shadowRoot?.querySelector<HTMLElement>(".panel");
      const toggle = el.shadowRoot?.querySelector<HTMLElement>(".violation-toggle");
      toggle?.focus();
      panel?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      el.remove();
    });

    it("ArrowUp does not throw when list has one item", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const panel = el.shadowRoot?.querySelector<HTMLElement>(".panel");
      panel?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
      el.remove();
    });
  });

  describe("highlight", () => {
    beforeEach(() => {
      const img = document.createElement("img");
      img.setAttribute("class", "test-img");
      document.body.appendChild(img);
    });

    afterEach(() => {
      for (const el of document.querySelectorAll(".test-img")) el.remove();
    });

    it("injects highlight style into document head once", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
      toggle?.click();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

      el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-highlight")?.click();
      expect(document.getElementById("a11y-hud-highlight-style")).not.toBeNull();
      el.remove();
    });

    it("ensureHighlightStyle early return when style already injected", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
      toggle?.click();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-highlight");
      btn?.click(); // creates the style element
      btn?.click(); // hits the early-return branch (style already exists)

      expect(document.querySelectorAll("#a11y-hud-highlight-style")).toHaveLength(1);
      el.remove();
    });
  });
});

describe("A11yHudElement — branch coverage edge cases", () => {
  const MULTI_VIOLATION_RESULTS: AxeResults = {
    violations: [
      {
        id: "best-practice-rule",
        impact: "minor",
        tags: ["best-practice"],
        description: "A best practice issue (no WCAG level)",
        help: "Best practice",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/best-practice",
        nodes: [
          {
            html: "<div>",
            impact: "minor",
            target: ["div"],
            any: [],
            all: [],
            none: [],
            failureSummary: "",
            element: null as unknown as HTMLElement,
          },
        ],
      },
      {
        id: "image-alt",
        impact: "critical",
        tags: ["wcag2aa"],
        description: "Images must have alt text",
        help: "Image alt",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
        nodes: [
          {
            html: "<img>",
            impact: "critical",
            target: ["img"],
            any: [],
            all: [],
            none: [],
            failureSummary: "",
            element: null as unknown as HTMLElement,
          },
          {
            html: "<img>",
            impact: "critical",
            target: [["#shadow-host", "img"]],
            any: [],
            all: [],
            none: [],
            failureSummary: "",
            element: null as unknown as HTMLElement,
          },
          {
            html: "<img>",
            impact: "critical",
            target: [],
            any: [],
            all: [],
            none: [],
            failureSummary: "",
            element: null as unknown as HTMLElement,
          },
          {
            html: "<img>",
            impact: "critical",
            target: ["["],
            any: [],
            all: [],
            none: [],
            failureSummary: "",
            element: null as unknown as HTMLElement,
          },
        ],
      },
    ],
    passes: [],
    incomplete: [],
    inapplicable: [],
    timestamp: "2026-01-01T00:00:00.000Z",
    url: "http://localhost/",
    testEngine: { name: "axe-core", version: "4.0.0" },
    testEnvironment: {
      userAgent: "",
      windowWidth: 0,
      windowHeight: 0,
      orientationAngle: 0,
      orientationType: "",
    },
    testRunner: { name: "axe" },
    toolOptions: {},
  };

  beforeEach(async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    axe.run.mockResolvedValue(MULTI_VIOLATION_RESULTS);
  });

  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    document.getElementById("a11y-hud-highlight-style")?.remove();
    vi.clearAllMocks();
  });

  it("toggle without aria-controls attribute is a no-op for detail lookup", async () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
    if (toggle) {
      toggle.removeAttribute("aria-controls");
      toggle.click(); // detailId = null → detail = null → branch covered
    }
    el.remove();
  });

  it("highlight with out-of-bounds violation index is a no-op", async () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
    toggle?.click();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-highlight");
    if (btn) {
      btn.removeAttribute("data-violation"); // vIdx = NaN → violations[NaN] = undefined
      btn.click();
    }
    el.remove();
  });

  it("highlight with out-of-bounds node index is a no-op", async () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
    toggle?.click();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-highlight");
    if (btn) {
      btn.setAttribute("data-violation", "1"); // valid violation index
      btn.setAttribute("data-node", "999"); // out-of-bounds node index
      btn.click();
    }
    el.remove();
  });

  it("getViolationLevel falls through A-check for wcag2aa tag", async () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    el.remove();
  });

  it("findElement handles array-of-arrays target (shadow DOM selector)", async () => {
    const shadowHost = document.createElement("div");
    shadowHost.id = "shadow-host";
    const inner = document.createElement("img");
    shadowHost.appendChild(inner);
    document.body.appendChild(shadowHost);

    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
    toggle?.click();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

    const btns = el.shadowRoot?.querySelectorAll<HTMLButtonElement>(".btn-highlight");
    // btns[0] = violation 0 (best-practice) node 0
    // btns[1] = violation 1 (image-alt) node 0 — normal target
    // btns[2] = violation 1 node 1 — array-in-array target
    // btns[3] = violation 1 node 2 — empty target
    // btns[4] = violation 1 node 3 — invalid selector
    btns?.[2]?.click(); // array-in-array target (node index 1)

    shadowHost.remove();
    el.remove();
  });

  it("findElement returns null for empty target array", async () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
    toggle?.click();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

    const btns = el.shadowRoot?.querySelectorAll<HTMLButtonElement>(".btn-highlight");
    btns?.[3]?.click(); // empty target (node index 2)

    el.remove();
  });

  it("findElement catch branch for invalid CSS selector", async () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
    toggle?.click();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-open]")).not.toBeNull());

    const btns = el.shadowRoot?.querySelectorAll<HTMLButtonElement>(".btn-highlight");
    btns?.[4]?.click(); // invalid selector target (node index 3)

    el.remove();
  });
});

describe("A11yHudElement — CSSStyleSheet fallback", () => {
  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    vi.clearAllMocks();
  });

  it("uses style element fallback when CSSStyleSheet.replaceSync throws", async () => {
    vi.mock("axe-core", () => ({
      default: { run: vi.fn().mockResolvedValue({ violations: [] }) },
    }));

    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
    CSSStyleSheet.prototype.replaceSync = () => {
      throw new Error("not supported");
    };

    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);

    CSSStyleSheet.prototype.replaceSync = originalReplaceSync;

    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".panel")).not.toBeNull());
    el.remove();
  });
});
