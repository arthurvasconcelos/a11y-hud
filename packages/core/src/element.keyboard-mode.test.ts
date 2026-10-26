import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeRun } from "./__fixtures__/axe-core.mock.js";
import { mockAxeResults } from "./__fixtures__/axe-results.js";
import { mountHudElement, removeHudElements } from "./__fixtures__/hud-element.js";
import { A11yHudElement } from "./element.js";

vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"));

void A11yHudElement;

describe("A11yHudElement keyboard mode", () => {
  let pageButton: HTMLButtonElement | undefined;

  beforeEach(() => {
    localStorage.clear();
    axeRun.mockResolvedValue(mockAxeResults());
  });

  afterEach(() => {
    removeHudElements();
    pageButton?.remove();
    pageButton = undefined;
    localStorage.clear();
    vi.clearAllMocks();
  });

  function addFocusableToPage(): void {
    pageButton = document.createElement("button");
    document.body.appendChild(pageButton);
  }

  it("shows the keyboard mode toggle in the toolbar, unpressed", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    expect(hud.toolbar.queryKeyboardButton()).not.toBeNull();
    expect(hud.toolbar.isKeyboardModeOn()).toBe(false);
  });

  it("turning keyboard mode on presses the toggle and shows the keyboard view", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();

    await hud.toolbar.toggleKeyboardMode();

    expect(hud.toolbar.isKeyboardModeOn()).toBe(true);
    expect(hud.keyboardView.isVisible()).toBe(true);
  });

  it("turning keyboard mode off restores the violation view", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();

    await hud.toolbar.toggleKeyboardMode();
    expect(hud.keyboardView.isVisible()).toBe(true);
    await hud.toolbar.toggleKeyboardMode();

    expect(hud.toolbar.isKeyboardModeOn()).toBe(false);
    expect(hud.keyboardView.isVisible()).toBe(false);
    expect(hud.violations.queryList()).not.toBeNull();
    expect(hud.ignored.queryToggle()).not.toBeNull();
  });

  it("injects the focus-order overlay into the host page", async () => {
    addFocusableToPage();
    const { hud } = mountHudElement();
    await hud.awaitPanel();

    await hud.toolbar.toggleKeyboardMode();

    expect(document.getElementById("a11y-hud-kbd-overlay")).not.toBeNull();
  });

  it("explains when the scoped area has no focusable elements", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();

    await hud.toolbar.toggleKeyboardMode();

    expect(hud.keyboardView.queryEmptyMessage()).not.toBeNull();
  });

  it("reports no issues for a page with a plain focusable button", async () => {
    addFocusableToPage();
    const { hud } = mountHudElement();
    await hud.awaitPanel();

    await hud.toolbar.toggleKeyboardMode();

    expect(hud.keyboardView.hasNoIssuesStat()).toBe(true);
    expect(hud.keyboardView.queryElementButtons()).toHaveLength(1);
  });

  it("clicking a focusable entry highlights that element on the page", async () => {
    addFocusableToPage();
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    await hud.toolbar.toggleKeyboardMode();

    await hud.keyboardView.highlightElement(1);

    expect(pageButton?.hasAttribute("data-a11y-hud-highlighted")).toBe(true);
    expect(document.getElementById("a11y-hud-highlight-style")).not.toBeNull();
  });

  it("ignores an entry whose index does not exist", async () => {
    const { hud } = mountHudElement();
    await hud.awaitPanel();
    await hud.toolbar.toggleKeyboardMode();

    await expect(
      hud.clickRogueButton("btn-kbd-element", { kbdElement: "9999" })
    ).resolves.toBeUndefined();

    expect(document.querySelector("[data-a11y-hud-highlighted]")).toBeNull();
  });

  it("a rescan while keyboard mode is on does not replace the keyboard view", async () => {
    const { hud } = mountHudElement();
    await hud.awaitReady();
    await hud.toolbar.toggleKeyboardMode();
    const callsBefore = axeRun.mock.calls.length;

    await hud.toolbar.rescan();

    expect(axeRun.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(hud.keyboardView.isVisible()).toBe(true);
    expect(hud.violations.queryList()).toBeNull();
  });

  it("removing the element cleans up the overlay", async () => {
    addFocusableToPage();
    const { el, hud } = mountHudElement();
    await hud.awaitPanel();
    await hud.toolbar.toggleKeyboardMode();
    expect(document.getElementById("a11y-hud-kbd-overlay")).not.toBeNull();

    el.remove();

    expect(document.getElementById("a11y-hud-kbd-overlay")).toBeNull();
  });
});
