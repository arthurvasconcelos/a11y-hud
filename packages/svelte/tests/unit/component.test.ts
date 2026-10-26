import { cleanup, render } from "@testing-library/svelte";
import { A11yHudElement } from "a11y-hud";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import A11yHud from "../../src/A11yHud.svelte";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";

const hud = new HudHostHarness();

describe("A11yHud component", () => {
  let runScan: ReturnType<typeof vi.spyOn>;
  const pageFixtures: Element[] = [];

  /** Appends an element to the page and keeps it there until the scans using it have settled. */
  function addToPage(element: Element): void {
    document.body.appendChild(element);
    pageFixtures.push(element);
  }

  beforeEach(() => {
    hud.track();
    runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
  });

  afterEach(async () => {
    cleanup();
    await hud.cleanup();
    for (const element of pageFixtures.splice(0)) element.remove();
    vi.restoreAllMocks();
  });

  it("mounts the <a11y-hud> element into the document", async () => {
    render(A11yHud);
    await tick();
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the initial props to the element", async () => {
    render(A11yHud, { props: { theme: "light", autoScan: false, debounce: 300 } });
    await tick();
    expect(hud.getThemeAttribute()).toBe("light");
    expect(hud.hasAutoScan()).toBe(false);
    expect(hud.getDebounceAttribute()).toBe("300");
  });

  it("applies the runOnly prop to the element", async () => {
    render(A11yHud, { props: { runOnly: ["wcag2a"] } });
    await tick();
    expect(hud.getRunOnly()).toEqual(["wcag2a"]);
  });

  it("removes the element when the component unmounts", async () => {
    const { unmount } = render(A11yHud);
    await tick();
    unmount();
    await tick();
    expect(hud.isMounted()).toBe(false);
  });

  it("runs a scan on initial mount", async () => {
    render(A11yHud);
    await tick();
    expect(runScan).toHaveBeenCalled();
  });

  it("re-scopes and rescans when the scope prop changes", async () => {
    const container = document.createElement("div");
    addToPage(container);
    const { rerender } = render(A11yHud);
    await tick();
    const callsBefore = runScan.mock.calls.length;

    await rerender({ scope: container });
    await tick();

    expect(runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(hud.getScopeElement()).toBe(container);
  });

  it("switches the element's theme when the theme prop changes", async () => {
    const { rerender } = render(A11yHud, { props: { theme: "light" } });
    await tick();

    await rerender({ theme: "high-contrast" });
    await tick();

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("leaves the theme untouched when no theme prop is given", async () => {
    render(A11yHud);
    await tick();
    expect(hud.getThemeAttribute()).toBeNull();
  });

  it("turns auto-scan on when autoScan changes to true", async () => {
    const { rerender } = render(A11yHud, { props: { autoScan: false } });
    await tick();
    expect(hud.hasAutoScan()).toBe(false);

    await rerender({ autoScan: true });
    await tick();

    expect(hud.hasAutoScan()).toBe(true);
  });

  it("turns auto-scan off when autoScan changes to false", async () => {
    const { rerender } = render(A11yHud, { props: { autoScan: true } });
    await tick();

    await rerender({ autoScan: false });
    await tick();

    expect(hud.hasAutoScan()).toBe(false);
  });

  it("updates the debounce when the prop changes", async () => {
    const { rerender } = render(A11yHud, { props: { debounce: 200 } });
    await tick();

    await rerender({ debounce: 400 });
    await tick();

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("keeps the current debounce when the prop becomes undefined", async () => {
    const { rerender } = render(A11yHud, { props: { debounce: 200 } });
    await tick();
    expect(hud.getDebounceAttribute()).toBe("200");

    await rerender({ debounce: undefined });
    await tick();

    expect(hud.getDebounceAttribute()).toBe("200");
  });

  it("scopes the element to the given scope element", async () => {
    const container = document.createElement("div");
    addToPage(container);

    render(A11yHud, { props: { scope: container } });
    await tick();

    expect(hud.getScopeElement()).toBe(container);
  });

  it("leaves the element unscoped when scope is null", async () => {
    render(A11yHud, { props: { scope: null } });
    await tick();
    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("clears the scope when it goes from an element to undefined", async () => {
    const container = document.createElement("div");
    addToPage(container);
    const { rerender } = render(A11yHud, { props: { scope: container } });
    await tick();
    expect(hud.getScopeElement()).toBe(container);

    await rerender({ scope: undefined });
    await tick();

    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("does not scan when the element cannot be found after mounting", async () => {
    const realQuerySelector = document.querySelector.bind(document);
    vi.spyOn(document, "querySelector").mockImplementation((selector: string) =>
      selector === "a11y-hud" ? null : realQuerySelector(selector)
    );

    render(A11yHud);
    await tick();

    expect(runScan).not.toHaveBeenCalled();
  });

  it("runs a real axe-core scan and lists the page's violations", async () => {
    addToPage(document.createElement("img"));
    render(A11yHud);

    await hud.awaitReady();

    expect(hud.getRuleIds()).toContain("image-alt");
  });
});
