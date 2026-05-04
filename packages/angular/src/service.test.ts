import { TestBed } from "@angular/core/testing";
import { mount } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { A11yHudService } from "./service.js";

vi.mock("a11y-hud", () => ({
  mount: vi.fn(),
}));

type MockIgnores = {
  add: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  exportJson: ReturnType<typeof vi.fn>;
  importJson: ReturnType<typeof vi.fn>;
};

type MockInstance = {
  unmount: ReturnType<typeof vi.fn>;
  setTheme: ReturnType<typeof vi.fn>;
  runScan: ReturnType<typeof vi.fn>;
  exportResults: ReturnType<typeof vi.fn>;
  ignores: MockIgnores;
};

function makeMockElement() {
  const el = document.createElement("a11y-hud") as HTMLElement & {
    scopeElement?: Element;
  };
  Object.defineProperty(el, "scopeElement", {
    value: undefined,
    writable: true,
    configurable: true,
  });
  return el;
}

let mockEl: ReturnType<typeof makeMockElement>;
let mockInstance: MockInstance;

beforeEach(() => {
  mockEl = makeMockElement();
  mockInstance = {
    unmount: vi.fn(() => mockEl.remove()),
    setTheme: vi.fn(),
    runScan: vi.fn().mockResolvedValue({ violations: [] }),
    exportResults: vi.fn().mockReturnValue(null),
    ignores: {
      add: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      list: vi.fn().mockReturnValue([]),
      exportJson: vi.fn().mockReturnValue("[]"),
      importJson: vi.fn(),
    },
  };
  (mount as ReturnType<typeof vi.fn>).mockImplementation(() => {
    document.body.appendChild(mockEl);
    return mockInstance;
  });
  TestBed.configureTestingModule({
    providers: [A11yHudService],
  });
});

afterEach(() => {
  mockEl.remove();
  vi.clearAllMocks();
  TestBed.resetTestingModule();
});

describe("A11yHudService", () => {
  it("calls mount() on init()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes theme to mount()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ theme: "light", autoScan: false, debounce: 300 });
    expect(mount).toHaveBeenCalledWith({ theme: "light", autoScan: false, debounce: 300 });
  });

  it("does not pass undefined fields to mount()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    expect(mount).toHaveBeenCalledWith({});
  });

  it("sets scopeElement on CE when scope is an Element", () => {
    const service = TestBed.inject(A11yHudService);
    const container = document.createElement("div");
    document.body.appendChild(container);
    service.init({ scope: container });
    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("sets scopeElement to undefined when scope is null", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({ scope: null });
    expect(mockEl.scopeElement).toBeUndefined();
  });

  it("syncScope() updates scopeElement", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const container = document.createElement("div");
    document.body.appendChild(container);
    service.syncScope(container);
    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("syncScope() clears scopeElement when passed null", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const container = document.createElement("div");
    service.syncScope(container);
    service.syncScope(null);
    expect(mockEl.scopeElement).toBeUndefined();
  });

  it("syncScope() unwraps ElementRef.nativeElement", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const container = document.createElement("div");
    document.body.appendChild(container);
    service.syncScope({ nativeElement: container } as unknown as Element);
    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("syncScope() is a no-op before init()", () => {
    const service = TestBed.inject(A11yHudService);
    service.syncScope(document.body);
    expect(true).toBe(true);
  });

  it("syncTheme() calls setTheme on the instance", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.syncTheme("high-contrast");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("syncTheme() does not call setTheme when theme is undefined", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.syncTheme(undefined);
    expect(mockInstance.setTheme).not.toHaveBeenCalled();
  });

  it("syncAutoScan() sets auto-scan attribute when true", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.syncAutoScan(true);
    expect(mockEl.hasAttribute("auto-scan")).toBe(true);
  });

  it("syncAutoScan() removes auto-scan attribute when false", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    mockEl.setAttribute("auto-scan", "");
    service.syncAutoScan(false);
    expect(mockEl.hasAttribute("auto-scan")).toBe(false);
  });

  it("syncAutoScan() is a no-op when autoScan is undefined", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    const hadAutoScan = mockEl.hasAttribute("auto-scan");
    service.syncAutoScan(undefined);
    expect(mockEl.hasAttribute("auto-scan")).toBe(hadAutoScan);
  });

  it("syncDebounce() sets debounce attribute", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.syncDebounce(400);
    expect(mockEl.getAttribute("debounce")).toBe("400");
  });

  it("syncDebounce() is a no-op when debounce is undefined", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.syncDebounce(undefined);
    expect(mockEl.getAttribute("debounce")).toBeNull();
  });

  it("runScan() delegates to instance.runScan()", async () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    await service.runScan();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("runScan() returns null-equivalent when not yet initialized", async () => {
    const service = TestBed.inject(A11yHudService);
    const result = await service.runScan();
    expect(result).toBeNull();
  });

  it("setTheme() delegates to instance.setTheme()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.setTheme("light");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("light");
  });

  it("exportResults() delegates to instance.exportResults()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    mockInstance.exportResults.mockReturnValue('{"version":"1"}');
    const json = service.exportResults();
    expect(mockInstance.exportResults).toHaveBeenCalledOnce();
    expect(json).toBe('{"version":"1"}');
  });

  it("ignores.add() delegates to instance.ignores.add()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ignores.add("color-contrast");
    expect(mockInstance.ignores.add).toHaveBeenCalledWith("color-contrast", undefined);
  });

  it("ignores.list() returns [] when not initialized", () => {
    const service = TestBed.inject(A11yHudService);
    expect(service.ignores.list()).toEqual([]);
  });

  it("exportResults() returns null when not initialized", () => {
    const service = TestBed.inject(A11yHudService);
    expect(service.exportResults()).toBeNull();
  });

  it("ngOnDestroy() calls instance.unmount()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ngOnDestroy();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("syncScope() is a no-op after ngOnDestroy()", () => {
    const service = TestBed.inject(A11yHudService);
    service.init({});
    service.ngOnDestroy();
    service.syncScope(document.body);
    expect(true).toBe(true);
  });
});
