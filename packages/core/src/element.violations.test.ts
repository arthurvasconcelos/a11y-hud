import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeRun } from "./__fixtures__/axe-core.mock.js";
import { mockAxeResults, mockNode, mockViolation } from "./__fixtures__/axe-results.js";
import { mountHudElement, removeHudElements } from "./__fixtures__/hud-element.js";
import { A11yHudElement } from "./element.js";

vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"));

void A11yHudElement;

const HIGHLIGHTED = "[data-a11y-hud-highlighted]";

function twoViolations() {
  return mockAxeResults({
    violations: [
      mockViolation({ id: "image-alt" }),
      mockViolation({ id: "link-name", impact: "serious" }),
    ],
  });
}

describe("A11yHudElement violation list", () => {
  beforeEach(() => {
    axeRun.mockResolvedValue(mockAxeResults());
    const img = document.createElement("img");
    img.className = "test-img";
    document.body.appendChild(img);
  });

  afterEach(() => {
    removeHudElements();
    for (const el of document.querySelectorAll(".test-img")) el.remove();
    vi.clearAllMocks();
  });

  describe("expand and collapse", () => {
    it("opens the detail region when the item is expanded", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const violation = hud.violations.violation("image-alt");

      await violation.expand();

      expect(violation.isExpanded()).toBe(true);
      expect(violation.isDetailOpen()).toBe(true);
    });

    it("closes the detail region again when collapsed", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const violation = hud.violations.violation("image-alt");

      await violation.expand();
      await violation.collapse();

      expect(violation.isExpanded()).toBe(false);
      expect(violation.isDetailOpen()).toBe(false);
    });

    it("still flips the expanded state when the toggle has lost its aria-controls", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const violation = hud.violations.violation("image-alt");

      violation.queryToggle()?.removeAttribute("aria-controls");
      await violation.toggle();

      expect(violation.isExpanded()).toBe(true);
      expect(violation.isDetailOpen()).toBe(false);
    });
  });

  describe("highlight", () => {
    it("marks the offending node on the host page and injects the highlight style once", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("image-alt").highlightNode();

      expect(document.querySelector(HIGHLIGHTED)).toBe(document.querySelector(".test-img"));
      expect(document.querySelectorAll("#a11y-hud-highlight-style")).toHaveLength(1);
    });

    it("does not inject a second style element on repeated highlights", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const violation = hud.violations.violation("image-alt");

      await violation.highlightNode();
      await violation.highlightNode();

      expect(document.querySelectorAll("#a11y-hud-highlight-style")).toHaveLength(1);
    });

    it("resolves a nested shadow-DOM target through its innermost selector", async () => {
      const shadowHost = document.createElement("div");
      shadowHost.id = "shadow-host";
      const inner = document.createElement("img");
      shadowHost.appendChild(inner);
      document.body.appendChild(shadowHost);
      axeRun.mockResolvedValue(
        mockAxeResults({
          violations: [
            mockViolation({
              nodes: [mockNode(), mockNode({ target: [["#shadow-host", "img"]] })],
            }),
          ],
        })
      );
      const { hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("image-alt").highlightNode(1);

      expect(document.querySelector(HIGHLIGHTED)).not.toBeNull();
      shadowHost.remove();
    });

    it("highlights nothing for an empty target", async () => {
      axeRun.mockResolvedValue(
        mockAxeResults({ violations: [mockViolation({ nodes: [mockNode({ target: [] })] })] })
      );
      const { hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("image-alt").highlightNode();

      expect(document.querySelector(HIGHLIGHTED)).toBeNull();
    });

    it("highlights nothing for an invalid CSS selector instead of throwing", async () => {
      axeRun.mockResolvedValue(
        mockAxeResults({ violations: [mockViolation({ nodes: [mockNode({ target: ["["] })] })] })
      );
      const { hud } = mountHudElement();
      await hud.awaitReady();

      await expect(hud.violations.violation("image-alt").highlightNode()).resolves.toBeUndefined();

      expect(document.querySelector(HIGHLIGHTED)).toBeNull();
    });

    it("ignores a highlight button whose violation index is missing", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const violation = hud.violations.violation("image-alt");
      await violation.expand();

      const button = violation.queryHighlightButtons()[0];
      button?.removeAttribute("data-violation");
      button?.click();

      expect(document.querySelector(HIGHLIGHTED)).toBeNull();
    });

    it("ignores a highlight button whose node index is out of bounds", async () => {
      const { hud } = mountHudElement();
      await hud.awaitReady();
      const violation = hud.violations.violation("image-alt");
      await violation.expand();

      const button = violation.queryHighlightButtons()[0];
      button?.setAttribute("data-node", "999");
      button?.click();

      expect(document.querySelector(HIGHLIGHTED)).toBeNull();
    });
  });

  describe("keyboard navigation", () => {
    it("Escape minimizes the panel to the FAB", async () => {
      const { hud } = mountHudElement();
      await hud.awaitPanel();

      await hud.pressKey("Escape");

      expect(hud.isMinimized()).toBe(true);
      expect(hud.queryHost()?.isConnected).toBe(true);
    });

    it("ArrowDown moves focus to the next violation toggle", async () => {
      axeRun.mockResolvedValue(twoViolations());
      const { el, hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("image-alt").focusToggle();
      await hud.pressKey("ArrowDown");

      expect(el.shadowRoot?.activeElement).toBe(
        hud.violations.violation("link-name").queryToggle()
      );
    });

    it("ArrowDown wraps from the last toggle to the first", async () => {
      axeRun.mockResolvedValue(twoViolations());
      const { el, hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("link-name").focusToggle();
      await hud.pressKey("ArrowDown");

      expect(el.shadowRoot?.activeElement).toBe(
        hud.violations.violation("image-alt").queryToggle()
      );
    });

    it("ArrowUp moves focus to the previous violation toggle", async () => {
      axeRun.mockResolvedValue(twoViolations());
      const { el, hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("link-name").focusToggle();
      await hud.pressKey("ArrowUp");

      expect(el.shadowRoot?.activeElement).toBe(
        hud.violations.violation("image-alt").queryToggle()
      );
    });

    it("ArrowUp wraps from the first toggle to the last", async () => {
      axeRun.mockResolvedValue(twoViolations());
      const { el, hud } = mountHudElement();
      await hud.awaitReady();

      await hud.violations.violation("image-alt").focusToggle();
      await hud.pressKey("ArrowUp");

      expect(el.shadowRoot?.activeElement).toBe(
        hud.violations.violation("link-name").queryToggle()
      );
    });

    it("arrow keys are a no-op when there is no violation list", async () => {
      axeRun.mockResolvedValue(mockAxeResults({ violations: [] }));
      const { hud } = mountHudElement();
      await hud.awaitReady();
      expect(hud.violations.queryEmptyState()).not.toBeNull();

      await expect(hud.pressKey("ArrowDown")).resolves.toBeUndefined();
    });
  });
});

describe("A11yHudElement copy to clipboard", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    vi.clearAllMocks();
  });

  it("copy-all writes every violation as markdown", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.toolbar.copyAll();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = writeText.mock.calls[0]?.[0] as string;
    expect(text).toContain("# a11y-hud scan results");
    expect(text).toContain("image-alt");
  });

  it("copying a single violation writes only that violation", async () => {
    axeRun.mockResolvedValue(twoViolations());
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.violations.violation("link-name").copy();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = writeText.mock.calls[0]?.[0] as string;
    expect(text).toContain("### [SERIOUS] link-name");
    expect(text).not.toContain("### [CRITICAL] image-alt");
  });

  it("falls back to execCommand when the clipboard API rejects", async () => {
    writeText.mockRejectedValue(new Error("not allowed"));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
      writable: true,
    });
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.toolbar.copyAll();

    await vi.waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
    Reflect.deleteProperty(document, "execCommand");
  });

  it("ignores a copy button whose violation index is out of bounds", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.clickRogueButton("btn-copy-single", { copyViolation: "9999" });

    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copy-all does nothing when there are no violations", async () => {
    axeRun.mockResolvedValue(mockAxeResults({ violations: [] }));
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.toolbar.copyAll();

    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe("A11yHudElement JSON export", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    vi.clearAllMocks();
  });

  it("shows the export button in the toolbar", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    expect(hud.toolbar.queryExportButton()).not.toBeNull();
  });

  it("exportResults() returns null before the first scan resolves", () => {
    const el = document.createElement("a11y-hud") as A11yHudElement;
    expect(el.exportResults()).toBeNull();
  });

  it("exportResults() returns a versioned JSON document after a scan", async () => {
    const { el, hud } = mountHudElement();
    await hud.awaitReady();

    const json = el.exportResults();

    expect(json).not.toBeNull();
    const parsed = JSON.parse(json as string) as Record<string, unknown>;
    expect(parsed.version).toBe("1");
    expect(typeof parsed.timestamp).toBe("string");
    expect(typeof parsed.url).toBe("string");
    expect(parsed.scope).toBe("document.body");
    expect(parsed.results).toBeDefined();
  });

  it("exportResults() records the scope selector when one is set", async () => {
    const section = document.createElement("section");
    section.id = "scoped";
    document.body.appendChild(section);
    const { el, hud } = mountHudElement({ scope: "#scoped" });
    await hud.awaitReady();

    const parsed = JSON.parse(el.exportResults() as string) as Record<string, unknown>;

    expect(parsed.scope).toBe("#scoped");
    section.remove();
  });

  it("exportResults() describes a scope element without an id by tag name", async () => {
    const section = document.createElement("section");
    document.body.appendChild(section);
    const { el, hud } = mountHudElement();
    el.scopeElement = section;
    await hud.awaitReady();

    const parsed = JSON.parse(el.exportResults() as string) as Record<string, unknown>;

    expect(parsed.scope).toBe("section");
    section.remove();
  });

  it("exportResults() describes a scope element with an id by its id selector", async () => {
    const section = document.createElement("section");
    section.id = "my-section";
    document.body.appendChild(section);
    const { el, hud } = mountHudElement();
    el.scopeElement = section;
    await hud.awaitReady();

    const parsed = JSON.parse(el.exportResults() as string) as Record<string, unknown>;

    expect(parsed.scope).toBe("#my-section");
    section.remove();
  });

  it("the export button downloads a JSON blob", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.toolbar.exportJson();

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("the export button is a no-op before any results exist", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();

    await hud.toolbar.exportJson();

    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
