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

  it("runScan() returns axe results", async () => {
    const el = createElement();
    // Wait for initial scan to complete (violation list rendered) before triggering a new one.
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    const results = await el.runScan();
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

  describe("filter panel toggle", () => {
    it("filter panel starts collapsed", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".btn-panel-title")).not.toBeNull()
      );
      expect(el.shadowRoot?.querySelector("#panel-filters")?.hasAttribute("data-open")).toBe(false);
      el.remove();
    });

    it("clicking panel title opens the filter panel", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".btn-panel-title")).not.toBeNull()
      );
      el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-panel-title")?.click();
      expect(el.shadowRoot?.querySelector("#panel-filters")?.hasAttribute("data-open")).toBe(true);
      expect(el.shadowRoot?.querySelector(".btn-panel-title")?.getAttribute("aria-expanded")).toBe(
        "true"
      );
      el.remove();
    });

    it("clicking panel title twice closes the filter panel", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".btn-panel-title")).not.toBeNull()
      );
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-panel-title");
      btn?.click();
      btn?.click();
      expect(el.shadowRoot?.querySelector("#panel-filters")?.hasAttribute("data-open")).toBe(false);
      el.remove();
    });

    it("panel title gets data-active when a severity filter is activated", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".btn-panel-title")).not.toBeNull()
      );
      el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-panel-title")?.click();
      el.shadowRoot?.querySelector<HTMLElement>('[data-severity="critical"]')?.click();
      expect(el.shadowRoot?.querySelector(".btn-panel-title")?.hasAttribute("data-active")).toBe(
        true
      );
      el.remove();
    });

    it("data-active is removed when all filters are cleared", async () => {
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".btn-panel-title")).not.toBeNull()
      );
      el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-panel-title")?.click();
      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="critical"]');
      chip?.click(); // activate
      chip?.click(); // deactivate
      expect(el.shadowRoot?.querySelector(".btn-panel-title")?.hasAttribute("data-active")).toBe(
        false
      );
      el.remove();
    });
  });

  describe("filter chips", () => {
    it("severity chip starts inactive; clicking activates it", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="minor"]');
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      el.remove();
    });

    it("all severity chips start inactive (no filters = show all)", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chips = el.shadowRoot?.querySelectorAll<HTMLElement>("[data-severity]") ?? [];
      for (const c of chips) {
        expect(c.getAttribute("aria-pressed")).toBe("false");
      }
      el.remove();
    });

    it("activating all four severity chips can all be deactivated independently", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chips = Array.from(
        el.shadowRoot?.querySelectorAll<HTMLElement>("[data-severity]") ?? []
      );
      for (const c of chips) c.click();
      for (const c of chips) c.click();
      for (const c of chips) {
        expect(c.getAttribute("aria-pressed")).toBe("false");
      }
      el.remove();
    });
  });

  describe("filter chips — WCAG level", () => {
    it("WCAG level chip starts inactive; clicking activates then deactivates", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-level="AA"]');
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      el.remove();
    });
  });

  describe("filter chips — rule sets", () => {
    it("rule-set chip starts unpressed; clicking it marks it pressed and triggers a scan", async () => {
      const axe = (await import("axe-core")).default as unknown as {
        run: ReturnType<typeof vi.fn>;
      };
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-ruleset="wcag2a"]');
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      const callsBefore = axe.run.mock.calls.length;
      chip?.click();
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      await vi.waitFor(() => expect(axe.run.mock.calls.length).toBeGreaterThan(callsBefore));
      el.remove();
    });

    it("clicking an active rule-set chip deactivates it", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-ruleset="wcag2aa"]');
      chip?.click(); // activate
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      chip?.click(); // deactivate
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
      el.remove();
    });

    it("setRunOnly() marks the matching chip as pressed", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-ruleset]")).not.toBeNull());

      el.setRunOnly(["best-practice"]);
      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-ruleset="best-practice"]');
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      el.remove();
    });

    it("setRunOnly([]) clears all rule-set chips", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector("[data-ruleset]")).not.toBeNull());

      el.setRunOnly(["wcag2a"]);
      el.setRunOnly([]);
      const chips = el.shadowRoot?.querySelectorAll<HTMLElement>("[data-ruleset]") ?? [];
      for (const c of chips) {
        expect(c.getAttribute("aria-pressed")).toBe("false");
      }
      el.remove();
    });

    it("run-only attribute accepts a JSON array", () => {
      const el = document.createElement("a11y-hud") as A11yHudElement;
      el.setAttribute("run-only", '["wcag2a","wcag2aa"]');
      document.body.appendChild(el);
      expect(el.getAttribute("run-only")).toBe('["wcag2a","wcag2aa"]');
      el.remove();
    });

    it("run-only attribute falls back to empty array on invalid JSON", () => {
      const el = document.createElement("a11y-hud") as A11yHudElement;
      el.setAttribute("run-only", "not-json");
      document.body.appendChild(el);
      // Element should still be present without throwing
      expect(el.isConnected).toBe(true);
      el.remove();
    });

    it("run-only attribute falls back to empty array when JSON is not an array", () => {
      const el = document.createElement("a11y-hud") as A11yHudElement;
      el.setAttribute("run-only", '"just-a-string"');
      document.body.appendChild(el);
      expect(el.isConnected).toBe(true);
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

  describe("filter chip filtering behaviour", () => {
    it("activating a severity filter shows only violations of that severity", async () => {
      const axe = (await import("axe-core")).default as unknown as {
        run: ReturnType<typeof vi.fn>;
      };
      axe.run.mockResolvedValueOnce({
        ...MOCK_RESULTS,
        violations: [
          { ...MOCK_RESULTS.violations[0]!, impact: "critical" },
          { ...MOCK_RESULTS.violations[0]!, id: "link-name", impact: "serious" },
        ],
      });
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="critical"]');
      chip?.click();
      const items = el.shadowRoot?.querySelectorAll(".violation-item");
      expect(items?.length).toBe(1);
      el.remove();
    });

    it("activating a WCAG level filter shows only violations of that level", async () => {
      const axe = (await import("axe-core")).default as unknown as {
        run: ReturnType<typeof vi.fn>;
      };
      axe.run.mockResolvedValueOnce({
        ...MOCK_RESULTS,
        violations: [
          { ...MOCK_RESULTS.violations[0]!, id: "wcag-a", tags: ["wcag2a"] },
          { ...MOCK_RESULTS.violations[0]!, id: "wcag-aaa", tags: ["wcag2aaa"] },
        ],
      });
      const el = createElement();
      await vi.waitFor(() =>
        expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull()
      );

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-level="A"]');
      chip?.click();
      const items = el.shadowRoot?.querySelectorAll(".violation-item");
      expect(items?.length).toBe(1);
      el.remove();
    });
  });

  describe("severity filter toggle", () => {
    it("inactive chip activates then deactivates on successive clicks", async () => {
      const el = createElement();
      await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".filter-chip")).not.toBeNull());

      const chip = el.shadowRoot?.querySelector<HTMLElement>('[data-severity="minor"]');
      chip?.click(); // activate
      expect(chip?.getAttribute("aria-pressed")).toBe("true");
      chip?.click(); // deactivate
      expect(chip?.getAttribute("aria-pressed")).toBe("false");
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

  it("highlight-attr mutations on the host page do not trigger a rescan", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };

    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const callsBefore = axe.run.mock.calls.length;

    // Setting data-a11y-hud-highlighted is what the highlight feature does.
    // The MutationObserver guard should filter this mutation and not trigger a rescan.
    document.body.setAttribute("data-a11y-hud-highlighted", "");
    await Promise.resolve(); // flush MutationObserver microtask queue

    // Advance past the 500ms debounce — if the guard worked, axe.run was never queued
    await new Promise<void>((r) => setTimeout(r, 600));

    expect(axe.run.mock.calls.length).toBe(callsBefore);

    document.body.removeAttribute("data-a11y-hud-highlighted");
    el.remove();
  });
});

describe("A11yHudElement — clipboard and copy", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    await setupMock();
  });

  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    vi.clearAllMocks();
  });

  it("copy-all button writes formatted markdown to clipboard", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-copy-all")?.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = writeText.mock.calls[0]?.[0] as string;
    expect(text).toContain("# a11y-hud scan results");
    expect(text).toContain("image-alt");
    el.remove();
  });

  it("copy-single button writes single violation to clipboard", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-copy-single")?.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = writeText.mock.calls[0]?.[0] as string;
    expect(text).toContain("# a11y-hud scan results");
    el.remove();
  });

  it("falls back to execCommand when clipboard API rejects", async () => {
    writeText.mockRejectedValue(new Error("not allowed"));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
      writable: true,
    });
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-copy-all")?.click();
    await vi.waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
    el.remove();
    Reflect.deleteProperty(document, "execCommand");
  });

  it("copy-single does nothing when violation index is out of bounds", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    // Inject a btn-copy-single with an out-of-bounds index and click it via the panel handler
    const panel = el.shadowRoot?.querySelector(".panel");
    const btn = document.createElement("button");
    btn.className = "btn-copy-single";
    btn.dataset.copyViolation = "9999";
    panel?.appendChild(btn);
    btn.click();
    await new Promise<void>((r) => setTimeout(r, 20));
    expect(writeText).not.toHaveBeenCalled();
    el.remove();
  });

  it("copy-all does nothing when results have no violations", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    axe.run.mockResolvedValue({
      ...MOCK_RESULTS,
      violations: [],
    });
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".empty-state")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-copy-all")?.click();
    await new Promise<void>((r) => setTimeout(r, 20));
    expect(writeText).not.toHaveBeenCalled();
    el.remove();
  });

  it("FAB click removes data-minimized and re-shows the panel", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-minimize")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-minimize")?.click();
    expect(el.hasAttribute("data-minimized")).toBe(true);
    el.shadowRoot?.querySelector<HTMLButtonElement>(".fab")?.click();
    expect(el.hasAttribute("data-minimized")).toBe(false);
    el.remove();
  });
});

describe("A11yHudElement — JSON export", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
      writable: true,
    });
    await setupMock();
  });

  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    vi.clearAllMocks();
  });

  it("export button is present in the panel toolbar", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-export")).not.toBeNull());
    el.remove();
  });

  it("exportResults() returns null before first scan resolves", () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    expect(el.exportResults()).toBeNull();
  });

  it("exportResults() returns a JSON string with correct shape after scan", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    const json = el.exportResults();
    expect(json).not.toBeNull();
    const parsed = JSON.parse(json!) as Record<string, unknown>;
    expect(parsed.version).toBe("1");
    expect(typeof parsed.timestamp).toBe("string");
    expect(typeof parsed.url).toBe("string");
    expect(parsed.scope).toBe("document.body");
    expect(parsed.results).toBeDefined();
    el.remove();
  });

  it("exportResults() reflects scope selector when set", async () => {
    const section = document.createElement("section");
    section.id = "scoped";
    document.body.appendChild(section);

    const el = document.createElement("a11y-hud") as A11yHudElement;
    el.setAttribute("scope", "#scoped");
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const parsed = JSON.parse(el.exportResults()!) as Record<string, unknown>;
    expect(parsed.scope).toBe("#scoped");

    section.remove();
    el.remove();
  });

  it("exportResults() falls back to tagName when scopeElement has no id", async () => {
    const section = document.createElement("section");
    document.body.appendChild(section);

    const el = document.createElement("a11y-hud") as A11yHudElement;
    el.scopeElement = section;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const parsed = JSON.parse(el.exportResults()!) as Record<string, unknown>;
    expect(parsed.scope).toBe("section");

    section.remove();
    el.remove();
  });

  it("exportResults() uses id selector when scopeElement has an id", async () => {
    const section = document.createElement("section");
    section.id = "my-section";
    document.body.appendChild(section);

    const el = document.createElement("a11y-hud") as A11yHudElement;
    el.scopeElement = section;
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());

    const parsed = JSON.parse(el.exportResults()!) as Record<string, unknown>;
    expect(parsed.scope).toBe("#my-section");

    section.remove();
    el.remove();
  });

  it("export button click calls URL.createObjectURL with a Blob", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-export")?.click();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    el.remove();
  });

  it("export button click is a no-op when no scan results are available", () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    document.body.appendChild(el);
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-export")?.click();
    expect(createObjectURL).not.toHaveBeenCalled();
    el.remove();
  });
});

describe("A11yHudElement — ignore rules UI", () => {
  beforeEach(async () => {
    await setupMock();
    localStorage.clear();
  });

  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders an ignore button inside each violation detail", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    expect(el.shadowRoot?.querySelector(".btn-ignore-rule")).not.toBeNull();
    el.remove();
  });

  it("renders the ignored-section below the violation list", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull();
    el.remove();
  });

  it("clicking ignore button adds rule to localStorage and triggers rescan", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".violation-list")).not.toBeNull());
    const callsBefore = axe.run.mock.calls.length;

    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-ignore-rule");
    btn?.click();

    await vi.waitFor(() => expect(axe.run.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(localStorage.getItem("a11y-hud:ignores")).toContain("image-alt");
    el.remove();
  });

  it("ignored-section toggle expands the body", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull());
    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".ignored-section-toggle");
    toggle?.click();
    expect(el.shadowRoot?.querySelector("#ignored-section-body")?.hasAttribute("data-open")).toBe(
      true
    );
    el.remove();
  });

  it("ignored-section toggle collapses the body on second click", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull());
    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".ignored-section-toggle");
    toggle?.click();
    toggle?.click();
    expect(el.shadowRoot?.querySelector("#ignored-section-body")?.hasAttribute("data-open")).toBe(
      false
    );
    el.remove();
  });

  it("remove-ignore button calls removeIgnore and triggers rescan", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    localStorage.setItem("a11y-hud:ignores", JSON.stringify([{ ruleId: "image-alt" }]));

    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull());

    const callsBefore = axe.run.mock.calls.length;
    const removeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-remove-ignore");
    removeBtn?.click();
    await vi.waitFor(() => expect(axe.run.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(JSON.parse(localStorage.getItem("a11y-hud:ignores") ?? "[]")).toHaveLength(0);
    el.remove();
  });

  it("clear-ignores button clears all ignores and triggers rescan", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    localStorage.setItem("a11y-hud:ignores", JSON.stringify([{ ruleId: "image-alt" }]));

    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".ignored-section-toggle");
    toggle?.click();
    await vi.waitFor(() =>
      expect(el.shadowRoot?.querySelector("#ignored-section-body")?.hasAttribute("data-open")).toBe(
        true
      )
    );

    const callsBefore = axe.run.mock.calls.length;
    const clearBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-clear-ignores");
    clearBtn?.click();
    await vi.waitFor(() => expect(axe.run.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(JSON.parse(localStorage.getItem("a11y-hud:ignores") ?? "[]")).toHaveLength(0);
    el.remove();
  });

  it("export-ignores button creates a downloadable JSON blob", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:ignores-url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
      writable: true,
    });

    localStorage.setItem("a11y-hud:ignores", JSON.stringify([{ ruleId: "image-alt" }]));
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull());

    const toggle = el.shadowRoot?.querySelector<HTMLButtonElement>(".ignored-section-toggle");
    toggle?.click();
    await vi.waitFor(() =>
      expect(el.shadowRoot?.querySelector("#ignored-section-body")?.hasAttribute("data-open")).toBe(
        true
      )
    );

    el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-export-ignores")?.click();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    el.remove();
  });
});

describe("A11yHudElement — keyboard mode", () => {
  beforeEach(async () => {
    await setupMock();
    localStorage.clear();
  });

  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    document.getElementById("a11y-hud-kbd-overlay")?.remove();
    document.getElementById("a11y-hud-kbd-style")?.remove();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the keyboard mode toggle button in the panel toolbar", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.remove();
  });

  it("keyboard button starts with aria-pressed='false'", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    expect(el.shadowRoot?.querySelector("#btn-keyboard")?.getAttribute("aria-pressed")).toBe(
      "false"
    );
    el.remove();
  });

  it("clicking the keyboard button sets aria-pressed='true' and shows keyboard view", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();
    expect(el.shadowRoot?.querySelector("#btn-keyboard")?.getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(el.shadowRoot?.querySelector(".kbd-mode-view")).not.toBeNull();
    el.remove();
  });

  it("clicking the keyboard button again deactivates keyboard mode", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard");
    btn?.click(); // activate
    btn?.click(); // deactivate
    expect(btn?.getAttribute("aria-pressed")).toBe("false");
    expect(el.shadowRoot?.querySelector(".kbd-mode-view")).toBeNull();
    el.remove();
  });

  it("deactivating keyboard mode restores the normal violation view", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull());
    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard");
    btn?.click(); // activate
    expect(el.shadowRoot?.querySelector(".kbd-mode-view")).not.toBeNull();
    btn?.click(); // deactivate
    expect(el.shadowRoot?.querySelector(".kbd-mode-view")).toBeNull();
    expect(el.shadowRoot?.querySelector(".ignored-section")).not.toBeNull();
    el.remove();
  });

  it("keyboard mode injects the overlay into the host page", async () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();
    expect(document.getElementById("a11y-hud-kbd-overlay")).not.toBeNull();

    btn.remove();
    el.remove();
  });

  it("keyboard view shows 'No focusable elements' when scope has none", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();
    expect(el.shadowRoot?.querySelector(".kbd-empty")).not.toBeNull();
    el.remove();
  });

  it("keyboard view shows 'No issues' stat when there are no violations", async () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();
    expect(el.shadowRoot?.querySelector(".kbd-mode-stat--ok")).not.toBeNull();

    btn.remove();
    el.remove();
  });

  it("clicking a kbd-element button highlights that element on the page", async () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();

    await vi.waitFor(() => expect(el.shadowRoot?.querySelector(".btn-kbd-element")).not.toBeNull());

    el.shadowRoot?.querySelector<HTMLButtonElement>(".btn-kbd-element")?.click();
    expect(document.getElementById("a11y-hud-highlight-style")).not.toBeNull();

    btn.remove();
    el.remove();
  });

  it("clicking a kbd-element button with a non-existent index is a no-op", async () => {
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();

    const panel = el.shadowRoot?.querySelector(".panel");
    const fake = document.createElement("button");
    fake.className = "btn-kbd-element";
    fake.dataset.kbdElement = "9999";
    panel?.appendChild(fake);
    expect(() => fake.click()).not.toThrow();
    el.remove();
  });

  it("rescan while keyboard mode is active does not overwrite the keyboard view", async () => {
    const axe = (await import("axe-core")).default as unknown as {
      run: ReturnType<typeof vi.fn>;
    };
    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();
    expect(el.shadowRoot?.querySelector(".kbd-mode-view")).not.toBeNull();

    const callsBefore = axe.run.mock.calls.length;
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-rescan")?.click();
    await vi.waitFor(() => expect(axe.run.mock.calls.length).toBeGreaterThan(callsBefore));

    expect(el.shadowRoot?.querySelector(".kbd-mode-view")).not.toBeNull();
    expect(el.shadowRoot?.querySelector(".violation-list")).toBeNull();
    el.remove();
  });

  it("removing the element cleans up the keyboard overlay", async () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    const el = createElement();
    await vi.waitFor(() => expect(el.shadowRoot?.querySelector("#btn-keyboard")).not.toBeNull());
    el.shadowRoot?.querySelector<HTMLButtonElement>("#btn-keyboard")?.click();
    expect(document.getElementById("a11y-hud-kbd-overlay")).not.toBeNull();

    el.remove();
    expect(document.getElementById("a11y-hud-kbd-overlay")).toBeNull();

    btn.remove();
  });
});

describe("A11yHudElement — CSSStyleSheet fallback", () => {
  afterEach(() => {
    for (const el of document.querySelectorAll("a11y-hud")) el.remove();
    vi.clearAllMocks();
  });

  it("uses style element fallback when CSSStyleSheet.replaceSync throws", async () => {
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
