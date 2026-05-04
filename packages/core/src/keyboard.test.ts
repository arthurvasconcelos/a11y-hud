import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  detectKeyboardViolations,
  getFocusableElements,
  injectFocusOrderOverlay,
} from "./keyboard.js";

// ─── getFocusableElements ──────────────────────────────────────────────────

describe("getFocusableElements", () => {
  let scope: HTMLElement;

  beforeEach(() => {
    scope = document.createElement("div");
    document.body.appendChild(scope);
  });

  afterEach(() => {
    scope.remove();
  });

  it("returns empty array when scope has no focusable elements", () => {
    scope.innerHTML = "<p>plain text</p>";
    expect(getFocusableElements(scope)).toHaveLength(0);
  });

  it("returns a button in the list", () => {
    scope.innerHTML = "<button>Click</button>";
    const results = getFocusableElements(scope);
    expect(results).toHaveLength(1);
    expect(results[0]!.element.tagName.toLowerCase()).toBe("button");
  });

  it("returns an <a href> in the list", () => {
    scope.innerHTML = "<a href='/'>Home</a>";
    const results = getFocusableElements(scope);
    expect(results).toHaveLength(1);
    expect(results[0]!.element.tagName.toLowerCase()).toBe("a");
  });

  it("excludes button[tabindex='-1'] from the list", () => {
    scope.innerHTML = "<button tabindex='-1'>Hidden</button>";
    expect(getFocusableElements(scope)).toHaveLength(0);
  });

  it("excludes button[disabled]", () => {
    scope.innerHTML = "<button disabled>Disabled</button>";
    expect(getFocusableElements(scope)).toHaveLength(0);
  });

  it("orders elements with positive tabindex before zero-tabindex elements", () => {
    scope.innerHTML = [
      "<button id='zero'>Zero</button>",
      "<button id='pos' tabindex='1'>Positive</button>",
    ].join("");
    const results = getFocusableElements(scope);
    expect(results[0]!.element.id).toBe("pos");
    expect(results[1]!.element.id).toBe("zero");
  });

  it("sorts multiple positive tabindex values ascending", () => {
    scope.innerHTML = [
      "<button id='t3' tabindex='3'>Three</button>",
      "<button id='t2' tabindex='2'>Two</button>",
    ].join("");
    const results = getFocusableElements(scope);
    expect(results[0]!.element.id).toBe("t2");
    expect(results[1]!.element.id).toBe("t3");
  });

  it("index is 1-based — first element has index 1", () => {
    scope.innerHTML = "<button>First</button><button>Second</button>";
    const results = getFocusableElements(scope);
    expect(results[0]!.index).toBe(1);
    expect(results[1]!.index).toBe(2);
  });

  it("buildSelector uses #id when element has an id", () => {
    scope.innerHTML = "<button id='my-btn'>Click</button>";
    const results = getFocusableElements(scope);
    expect(results[0]!.selector).toBe("#my-btn");
  });

  it("buildSelector falls back to tagName when no id", () => {
    scope.innerHTML = "<button>No ID</button>";
    const results = getFocusableElements(scope);
    expect(results[0]!.selector).toBe("button");
  });

  it("buildSelector includes class names when present", () => {
    scope.innerHTML = "<button class='primary cta'>Click</button>";
    const results = getFocusableElements(scope);
    expect(results[0]!.selector).toBe("button.primary.cta");
  });

  it("buildSelector returns just tagName when className is whitespace-only", () => {
    const btn = document.createElement("button");
    btn.className = "   ";
    scope.appendChild(btn);
    const results = getFocusableElements(scope);
    expect(results[0]!.selector).toBe("button");
  });
});

// ─── injectFocusOrderOverlay ───────────────────────────────────────────────

describe("injectFocusOrderOverlay", () => {
  let cleanup: () => void;

  afterEach(() => {
    cleanup?.();
    document.getElementById("a11y-hud-kbd-overlay")?.remove();
    document.getElementById("a11y-hud-kbd-style")?.remove();
  });

  it("injects #a11y-hud-kbd-overlay into the document", () => {
    cleanup = injectFocusOrderOverlay([]);
    expect(document.getElementById("a11y-hud-kbd-overlay")).not.toBeNull();
  });

  it("injects #a11y-hud-kbd-style into document head", () => {
    cleanup = injectFocusOrderOverlay([]);
    expect(document.getElementById("a11y-hud-kbd-style")).not.toBeNull();
  });

  it("creates one badge per element", () => {
    const scope = document.createElement("div");
    scope.innerHTML = "<button>A</button><button>B</button><button>C</button>";
    document.body.appendChild(scope);

    const elements = getFocusableElements(scope);
    cleanup = injectFocusOrderOverlay(elements);

    const overlay = document.getElementById("a11y-hud-kbd-overlay")!;
    expect(overlay.querySelectorAll(".a11y-hud-kbd-badge")).toHaveLength(3);

    scope.remove();
  });

  it("cleanup function removes the overlay and style from DOM", () => {
    cleanup = injectFocusOrderOverlay([]);
    cleanup();
    expect(document.getElementById("a11y-hud-kbd-overlay")).toBeNull();
    expect(document.getElementById("a11y-hud-kbd-style")).toBeNull();
  });

  it("calling cleanup twice does not throw", () => {
    cleanup = injectFocusOrderOverlay([]);
    expect(() => {
      cleanup();
      cleanup();
    }).not.toThrow();
  });

  it("does not inject a duplicate style element on a second call", () => {
    cleanup = injectFocusOrderOverlay([]);
    const second = injectFocusOrderOverlay([]);
    expect(document.querySelectorAll("#a11y-hud-kbd-style")).toHaveLength(1);
    second();
  });
});

// ─── detectKeyboardViolations ──────────────────────────────────────────────

describe("detectKeyboardViolations", () => {
  let scope: HTMLElement;

  beforeEach(() => {
    scope = document.createElement("div");
    document.body.appendChild(scope);
  });

  afterEach(() => {
    scope.remove();
  });

  it("returns no-focusable-elements violation when list is empty", () => {
    const violations = detectKeyboardViolations([], scope);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.type).toBe("no-focusable-elements");
  });

  it("returns positive-tabindex violation for element with tabindex=1", () => {
    scope.innerHTML = "<button tabindex='1'>Positive</button>";
    const elements = getFocusableElements(scope);
    const violations = detectKeyboardViolations(elements, scope);
    expect(violations.some((v) => v.type === "positive-tabindex")).toBe(true);
  });

  it("does not flag tabindex=0 elements as positive-tabindex", () => {
    scope.innerHTML = "<button tabindex='0'>Zero</button>";
    const elements = getFocusableElements(scope);
    const violations = detectKeyboardViolations(elements, scope);
    expect(violations.some((v) => v.type === "positive-tabindex")).toBe(false);
  });

  it("returns interactive-excluded violation for button[tabindex='-1'] in scope", () => {
    scope.innerHTML = "<button tabindex='-1'>Excluded</button>";
    const violations = detectKeyboardViolations([], scope);
    expect(violations.some((v) => v.type === "interactive-excluded")).toBe(true);
  });

  it("does not flag non-interactive elements with tabindex='-1'", () => {
    scope.innerHTML = "<div tabindex='-1'>Not interactive</div>";
    const violations = detectKeyboardViolations([], scope);
    expect(violations.some((v) => v.type === "interactive-excluded")).toBe(false);
  });

  it("returns empty array when there are no violations (normal button)", () => {
    scope.innerHTML = "<button>Normal</button>";
    const elements = getFocusableElements(scope);
    const violations = detectKeyboardViolations(elements, scope);
    expect(violations).toHaveLength(0);
  });

  it("uses document.body as default scope when no scope argument is passed", () => {
    const btn = document.createElement("button");
    btn.setAttribute("tabindex", "-1");
    document.body.appendChild(btn);
    const violations = detectKeyboardViolations([]);
    expect(violations.some((v) => v.type === "interactive-excluded")).toBe(true);
    btn.remove();
  });
});
