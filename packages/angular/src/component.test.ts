import { TestBed } from "@angular/core/testing";
import { mount } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { A11yHudComponent } from "./component.js";

vi.mock("a11y-hud", () => ({
  mount: vi.fn(),
}));

type MockInstance = {
  unmount: ReturnType<typeof vi.fn>;
  setTheme: ReturnType<typeof vi.fn>;
  runScan: ReturnType<typeof vi.fn>;
};

let mockEl: HTMLElement & { scopeElement?: Element };
let mockInstance: MockInstance;

beforeEach(() => {
  mockEl = Object.assign(document.createElement("a11y-hud"), {
    scopeElement: undefined as Element | undefined,
  });
  mockInstance = {
    unmount: vi.fn(() => mockEl.remove()),
    setTheme: vi.fn(),
    runScan: vi.fn().mockResolvedValue({ violations: [] }),
  };
  (mount as ReturnType<typeof vi.fn>).mockImplementation(() => {
    document.body.appendChild(mockEl);
    return mockInstance;
  });
  TestBed.configureTestingModule({
    imports: [A11yHudComponent],
  });
});

afterEach(() => {
  mockEl.remove();
  vi.clearAllMocks();
  TestBed.resetTestingModule();
});

describe("A11yHudComponent", () => {
  it("renders nothing into the Angular tree", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.childNodes.length).toBe(0);
  });

  it("calls mount() on initial render", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes theme input to mount()", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("theme", "light");
    fixture.detectChanges();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ theme: "light" }));
  });

  it("passes autoScan input to mount()", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("autoScan", false);
    fixture.detectChanges();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ autoScan: false }));
  });

  it("calls runScan() on initial render", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("calls setTheme() when theme input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    vi.clearAllMocks();
    fixture.componentRef.setInput("theme", "high-contrast");
    fixture.detectChanges();
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("calls runScan() when scope input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    const scansBefore = mockInstance.runScan.mock.calls.length;
    const container = document.createElement("div");
    fixture.componentRef.setInput("scope", container);
    fixture.detectChanges();
    expect(mockInstance.runScan.mock.calls.length).toBeGreaterThan(scansBefore);
  });

  it("sets scopeElement on CE when scope input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    const container = document.createElement("div");
    document.body.appendChild(container);
    fixture.componentRef.setInput("scope", container);
    fixture.detectChanges();
    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("clears scopeElement when scope changes to null", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    const container = document.createElement("div");
    document.body.appendChild(container);
    fixture.componentRef.setInput("scope", container);
    fixture.detectChanges();
    fixture.componentRef.setInput("scope", null);
    fixture.detectChanges();
    expect(mockEl.scopeElement).toBeUndefined();
    container.remove();
  });

  it("sets auto-scan attribute when autoScan input changes to true", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("autoScan", false);
    fixture.detectChanges();
    fixture.componentRef.setInput("autoScan", true);
    fixture.detectChanges();
    expect(mockEl.hasAttribute("auto-scan")).toBe(true);
  });

  it("removes auto-scan attribute when autoScan input changes to false", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.componentRef.setInput("autoScan", true);
    fixture.detectChanges();
    mockEl.setAttribute("auto-scan", "");
    fixture.componentRef.setInput("autoScan", false);
    fixture.detectChanges();
    expect(mockEl.hasAttribute("auto-scan")).toBe(false);
  });

  it("sets debounce attribute when debounce input changes", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    fixture.componentRef.setInput("debounce", 400);
    fixture.detectChanges();
    expect(mockEl.getAttribute("debounce")).toBe("400");
  });

  it("calls unmount() when component is destroyed", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("public runScan() delegates to service.runScan()", async () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    await fixture.componentInstance.runScan();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("public setTheme() delegates to service.setTheme()", () => {
    const fixture = TestBed.createComponent(A11yHudComponent);
    fixture.detectChanges();
    fixture.componentInstance.setTheme("dark");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("dark");
  });
});
