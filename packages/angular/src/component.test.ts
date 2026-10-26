import { TestBed } from "@angular/core/testing";
import { A11yHudElement } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";
import { A11yHudComponent } from "./component.js";

const hud = new HudHostHarness();

describe("A11yHudComponent", () => {
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
    TestBed.configureTestingModule({ imports: [A11yHudComponent] });
  });

  afterEach(async () => {
    await hud.cleanup();
    for (const element of pageFixtures.splice(0)) element.remove();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("renders nothing into the Angular tree", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.childNodes.length).toBe(0);
  });

  it("mounts the <a11y-hud> element into the document", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the theme input to the element", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("theme", "light");
    fixture.detectChanges();
    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("turns auto-scan off when the autoScan input is false", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("autoScan", false);
    fixture.detectChanges();
    expect(hud.hasAutoScan()).toBe(false);
  });

  it("runs a scan on initial render", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    expect(runScan).toHaveBeenCalled();
  });

  it("switches the element's theme when the theme input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("theme", "light");
    fixture.detectChanges();

    fixture.componentRef.setInput("theme", "high-contrast");
    fixture.detectChanges();

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("re-scopes and rescans when the scope input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    const callsBefore = runScan.mock.calls.length;
    const container = document.createElement("div");
    addToPage(container);

    fixture.componentRef.setInput("scope", container);
    fixture.detectChanges();

    expect(runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(hud.getScopeElement()).toBe(container);
  });

  it("clears the scope when the scope input changes to null", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    const container = document.createElement("div");
    addToPage(container);
    fixture.componentRef.setInput("scope", container);
    fixture.detectChanges();

    fixture.componentRef.setInput("scope", null);
    fixture.detectChanges();

    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("turns auto-scan on when the autoScan input changes to true", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("autoScan", false);
    fixture.detectChanges();

    fixture.componentRef.setInput("autoScan", true);
    fixture.detectChanges();

    expect(hud.hasAutoScan()).toBe(true);
  });

  it("turns auto-scan off when the autoScan input changes to false", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("autoScan", true);
    fixture.detectChanges();

    fixture.componentRef.setInput("autoScan", false);
    fixture.detectChanges();

    expect(hud.hasAutoScan()).toBe(false);
  });

  it("updates the debounce when the debounce input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();

    fixture.componentRef.setInput("debounce", 400);
    fixture.detectChanges();

    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("updates the rule sets when the runOnly input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();

    fixture.componentRef.setInput("runOnly", ["wcag2a", "wcag2aa"]);
    fixture.detectChanges();

    expect(hud.getRunOnly()).toEqual(["wcag2a", "wcag2aa"]);
  });

  it("removes the element when the component is destroyed", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(hud.isMounted()).toBe(false);
  });

  it("public runScan() scans the element and resolves with axe results", async () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    runScan.mockClear();

    const results = await fixture.componentInstance.runScan();

    expect(runScan).toHaveBeenCalledTimes(1);
    expect(Array.isArray(results?.violations)).toBe(true);
  });

  it("public setTheme() changes the element's theme", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    fixture.componentInstance.setTheme("github-dark");
    expect(hud.getThemeAttribute()).toBe("github-dark");
  });

  it("public setRunOnly() and exportResults() reach the element", async () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    fixture.componentInstance.setRunOnly(["best-practice"]);
    expect(hud.getRunOnly()).toEqual(["best-practice"]);

    await hud.awaitReady();

    const json = fixture.componentInstance.exportResults();
    expect((JSON.parse(json as string) as { version: string }).version).toBe("1");
  });

  it("public ignores reach the element's ignore list", () => {
    localStorage.clear();
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();

    fixture.componentInstance.ignores.add("color-contrast");

    expect(fixture.componentInstance.ignores.list()).toEqual([{ ruleId: "color-contrast" }]);
    localStorage.clear();
  });

  it("runs a real axe-core scan and lists the page's violations", async () => {
    addToPage(document.createElement("img"));
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();

    await hud.awaitReady();

    expect(hud.getRuleIds()).toContain("image-alt");
  });
});
