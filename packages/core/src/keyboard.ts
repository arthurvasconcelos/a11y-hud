export interface FocusableElementInfo {
  element: Element;
  index: number;
  selector: string;
  tabIndex: number;
}

export interface KeyboardViolation {
  type: "positive-tabindex" | "interactive-excluded" | "no-focusable-elements";
  element?: Element;
  selector?: string;
  message: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
  "details > summary:not([tabindex='-1'])",
  "area[href]:not([tabindex='-1'])",
].join(", ");

const INTERACTIVE_SELECTOR =
  "a[href], button, input, select, textarea, [role='button'], [role='link']";

function buildSelector(el: Element): string {
  if (el.id) {
    return `#${el.id}`;
  }

  let selector = el.tagName.toLowerCase();

  if (el.className && typeof el.className === "string") {
    const classes = el.className.trim().split(/\s+/).slice(0, 2);
    if (classes.length > 0 && classes[0] !== "") {
      selector += classes.map((c) => `.${c}`).join("");
    }
  }

  return selector;
}

export function getFocusableElements(scope: Element): FocusableElementInfo[] {
  const all = Array.from(scope.querySelectorAll<Element>(FOCUSABLE_SELECTOR));

  const positive: Element[] = [];
  const zero: Element[] = [];

  for (const el of all) {
    const ti = (el as HTMLElement).tabIndex;
    if (ti > 0) {
      positive.push(el);
    } else {
      zero.push(el);
    }
  }

  positive.sort((a, b) => (a as HTMLElement).tabIndex - (b as HTMLElement).tabIndex);

  const ordered = [...positive, ...zero];

  return ordered.map((element, i) => ({
    element,
    index: i + 1,
    selector: buildSelector(element),
    tabIndex: (element as HTMLElement).tabIndex,
  }));
}

export function injectFocusOrderOverlay(elements: FocusableElementInfo[]): () => void {
  if (!document.getElementById("a11y-hud-kbd-style")) {
    const style = document.createElement("style");
    style.id = "a11y-hud-kbd-style";
    style.textContent = [
      "#a11y-hud-kbd-overlay{position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483646}",
      ".a11y-hud-kbd-badge{position:absolute;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#7c3aed;color:#fff;font:700 11px/20px system-ui,sans-serif;text-align:center;pointer-events:none}",
    ].join("");
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.id = "a11y-hud-kbd-overlay";
  document.body.appendChild(overlay);

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  for (const info of elements) {
    const rect = info.element.getBoundingClientRect();
    const badge = document.createElement("span");
    badge.className = "a11y-hud-kbd-badge";
    badge.textContent = String(info.index);
    badge.style.top = `${rect.top + scrollY}px`;
    badge.style.left = `${rect.left + scrollX}px`;
    overlay.appendChild(badge);
  }

  return () => {
    document.getElementById("a11y-hud-kbd-overlay")?.remove();
    document.getElementById("a11y-hud-kbd-style")?.remove();
  };
}

export function detectKeyboardViolations(
  elements: FocusableElementInfo[],
  scope: Element = document.body
): KeyboardViolation[] {
  const violations: KeyboardViolation[] = [];

  if (elements.length === 0) {
    violations.push({
      type: "no-focusable-elements",
      message:
        "No focusable elements found in scope. Users who rely on keyboard navigation cannot reach any interactive content.",
    });
  }

  for (const info of elements) {
    if (info.tabIndex > 0) {
      violations.push({
        type: "positive-tabindex",
        element: info.element,
        selector: info.selector,
        message: `tabindex="${info.tabIndex}" on <${info.element.tagName.toLowerCase()}> disrupts the natural tab order. Use tabindex="0" instead.`,
      });
    }
  }

  const excluded = Array.from(scope.querySelectorAll<Element>(INTERACTIVE_SELECTOR)).filter(
    (el) => (el as HTMLElement).tabIndex === -1
  );

  for (const el of excluded) {
    violations.push({
      type: "interactive-excluded",
      element: el,
      selector: buildSelector(el),
      message: `<${el.tagName.toLowerCase()}> with tabindex="-1" is removed from the tab order. Keyboard users cannot reach this element.`,
    });
  }

  return violations;
}
