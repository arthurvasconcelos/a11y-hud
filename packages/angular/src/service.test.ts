import { TestBed } from "@angular/core/testing";
import { A11yHudElement } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";
import { A11yHudService } from "./service.js";

const hud = new HudHostHarness();

describe("A11yHudService", () => {
  let runScan: ReturnType<typeof vi.spyOn>;
  const pageFixtures: Element[] = [];

  /** Appends an element to the page and keeps it there until the scans using it have settled. */
  function addToPage(element: Element): void {
    document.body.appendChild(element);
    pageFixtures.push(element);
  }

  beforeEach(() => {
    localStorage.clear();
    hud.track();
    runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
    TestBed.configureTestingModule({ providers: [A11yHudService] });
  });

  afterEach(async () => {
    await hud.cleanup();
    for (const element of pageFixtures.splice(0)) element.remove();
    localStorage.clear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("init() mounts the <a11y-hud> element", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    expect(hud.isMounted()).toBe(true);
    expect(service.initialized).toBe(true);
  });

  it("init() applies the given options to the element", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ theme: "light", autoScan: false, debounce: 300, runOnly: ["wcag2a"] });
    expect(hud.getThemeAttribute()).toBe("light");
    expect(hud.hasAutoScan()).toBe(false);
    expect(hud.getDebounceAttribute()).toBe("300");
    expect(hud.getRunOnly()).toEqual(["wcag2a"]);
  });

  it("init() leaves omitted options untouched on the element", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    expect(hud.getThemeAttribute()).toBeNull();
    expect(hud.getDebounceAttribute()).toBeNull();
    expect(hud.getRunOnly()).toBeNull();
  });

  it("init() scopes the element to a given Element", () => {
    const service = TestBed.inject(A11yHudService);
    const container = document.createElement("div");
    addToPage(container);
    service.init({ scope: container });
    expect(hud.getScopeElement()).toBe(container);
  });

  it("init() leaves the element unscoped when scope is null", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ scope: null });
    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("syncScope() re-scopes the element", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const container = document.createElement("div");
    addToPage(container);
    service.syncScope(container);
    expect(hud.getScopeElement()).toBe(container);
  });

  it("syncScope() clears the scope when passed null", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const container = document.createElement("div");
    addToPage(container);
    service.syncScope(container);
    service.syncScope(null);
    expect(hud.getScopeElement()).toBeUndefined();
  });

  it("syncScope() unwraps an ElementRef", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const container = document.createElement("div");
    addToPage(container);
    service.syncScope({ nativeElement: container } as unknown as Element);
    expect(hud.getScopeElement()).toBe(container);
  });

  it("syncScope() is a no-op before init()", () => {
    const service = TestBed.inject(A11yHudService);
    expect(() => service.syncScope(document.body)).not.toThrow();
    expect(hud.isMounted()).toBe(false);
  });

  it("syncTheme() changes the element's theme", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ theme: "light" });
    service.syncTheme("high-contrast");
    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("syncTheme() keeps the current theme when passed undefined", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ theme: "light" });
    service.syncTheme(undefined);
    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("syncAutoScan() turns auto-scan on", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ autoScan: false });
    service.syncAutoScan(true);
    expect(hud.hasAutoScan()).toBe(true);
  });

  it("syncAutoScan() turns auto-scan off", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ autoScan: true });
    service.syncAutoScan(false);
    expect(hud.hasAutoScan()).toBe(false);
  });

  it("syncAutoScan() is a no-op when passed undefined", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ autoScan: true });
    service.syncAutoScan(undefined);
    expect(hud.hasAutoScan()).toBe(true);
  });

  it("syncDebounce() updates the debounce", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.syncDebounce(400);
    expect(hud.getDebounceAttribute()).toBe("400");
  });

  it("syncDebounce() is a no-op when passed undefined", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ debounce: 200 });
    service.syncDebounce(undefined);
    expect(hud.getDebounceAttribute()).toBe("200");
  });

  it("runScan() scans the element and resolves with axe results", async () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    runScan.mockClear();

    const results = await service.runScan();

    expect(runScan).toHaveBeenCalledTimes(1);
    expect(Array.isArray(results?.violations)).toBe(true);
  });

  it("runScan() resolves with null before init()", async () => {
    const service = TestBed.inject(A11yHudService);
    await expect(service.runScan()).resolves.toBeNull();
  });

  it("setTheme() changes the element's theme", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.setTheme("github-dark");
    expect(hud.getThemeAttribute()).toBe("github-dark");
  });

  it("setRunOnly() changes the element's rule sets", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.setRunOnly(["best-practice"]);
    expect(hud.getRunOnly()).toEqual(["best-practice"]);
  });

  it("exportResults() returns the element's export once a scan has settled", async () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    await hud.awaitReady();

    const json = service.exportResults();

    expect(json).not.toBeNull();
    expect((JSON.parse(json as string) as { version: string }).version).toBe("1");
  });

  it("exportResults() returns null before init()", () => {
    const service = TestBed.inject(A11yHudService);
    expect(service.exportResults()).toBeNull();
  });

  it("ignores.add() persists the rule and ignores.list() reads it back", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ignores.add("color-contrast");
    expect(service.ignores.list()).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("ignores.remove() and ignores.clear() drop rules again", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ignores.add("color-contrast");
    service.ignores.add("image-alt");

    service.ignores.remove("color-contrast");
    expect(service.ignores.list()).toEqual([{ ruleId: "image-alt" }]);

    service.ignores.clear();
    expect(service.ignores.list()).toEqual([]);
  });

  it("ignores.exportJson() and ignores.importJson() round-trip the list", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ignores.add("image-alt");
    const json = service.ignores.exportJson();
    service.ignores.clear();

    service.ignores.importJson(json);

    expect(JSON.parse(json)).toEqual([{ ruleId: "image-alt" }]);
    expect(service.ignores.list()).toEqual([{ ruleId: "image-alt" }]);
  });

  it("ignores.list() returns [] before init()", () => {
    const service = TestBed.inject(A11yHudService);
    expect(service.ignores.list()).toEqual([]);
  });

  it("ngOnDestroy() removes the element", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ngOnDestroy();
    expect(hud.isMounted()).toBe(false);
    expect(service.initialized).toBe(false);
  });

  it("syncScope() is a no-op after ngOnDestroy()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ngOnDestroy();
    expect(() => service.syncScope(document.body)).not.toThrow();
  });
});
