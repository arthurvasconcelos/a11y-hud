import { cleanup, render } from "@testing-library/svelte";
import { mount } from "a11y-hud";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import A11yHud from "./A11yHud.svelte";

vi.mock("a11y-hud", () => ({
  mount: vi.fn(),
}));

type MockInstance = {
  unmount: ReturnType<typeof vi.fn>;
  setTheme: ReturnType<typeof vi.fn>;
  runScan: ReturnType<typeof vi.fn>;
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
  };
  (mount as ReturnType<typeof vi.fn>).mockImplementation(() => {
    document.body.appendChild(mockEl);
    return mockInstance;
  });
});

afterEach(() => {
  cleanup();
  mockEl.remove();
  vi.clearAllMocks();
});

describe("A11yHud component", () => {
  it("calls mount() on initial render", async () => {
    render(A11yHud);
    await tick();
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes initial theme to mount()", async () => {
    render(A11yHud, { props: { theme: "light" } });
    await tick();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ theme: "light" }));
  });

  it("passes initial autoScan to mount()", async () => {
    render(A11yHud, { props: { autoScan: false } });
    await tick();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ autoScan: false }));
  });

  it("passes initial debounce to mount()", async () => {
    render(A11yHud, { props: { debounce: 300 } });
    await tick();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ debounce: 300 }));
  });

  it("calls instance.unmount() when component is unmounted", async () => {
    const { unmount } = render(A11yHud);
    await tick();
    unmount();
    await tick();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("calls instance.runScan() on initial mount", async () => {
    render(A11yHud);
    await tick();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("calls instance.runScan() when scope changes", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const { rerender } = render(A11yHud);
    await tick();
    const callsBefore = mockInstance.runScan.mock.calls.length;

    await rerender({ scope: container });
    await tick();

    expect(mockInstance.runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    container.remove();
  });

  it("calls instance.setTheme() when theme changes", async () => {
    const { rerender } = render(A11yHud, { props: { theme: "light" } });
    await tick();

    await rerender({ theme: "high-contrast" });
    await tick();

    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("sets auto-scan attribute when autoScan changes to true", async () => {
    const { rerender } = render(A11yHud, { props: { autoScan: false } });
    await tick();

    await rerender({ autoScan: true });
    await tick();

    expect(mockEl.hasAttribute("auto-scan")).toBe(true);
  });

  it("removes auto-scan attribute when autoScan is set to false", async () => {
    const { rerender } = render(A11yHud, { props: { autoScan: true } });
    await tick();

    await rerender({ autoScan: false });
    await tick();

    expect(mockEl.hasAttribute("auto-scan")).toBe(false);
  });

  it("sets debounce attribute when debounce changes", async () => {
    const { rerender } = render(A11yHud, { props: { debounce: 200 } });
    await tick();

    await rerender({ debounce: 400 });
    await tick();

    expect(mockEl.getAttribute("debounce")).toBe("400");
  });

  it("sets scopeElement on CE when scope has a value", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(A11yHud, { props: { scope: container } });
    await tick();

    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("clears scopeElement when scope is null", async () => {
    render(A11yHud, { props: { scope: null } });
    await tick();

    expect(mockEl.scopeElement).toBeUndefined();
  });

  it("clears scopeElement when scope changes from element to undefined", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const { rerender } = render(A11yHud, { props: { scope: container } });
    await tick();
    expect(mockEl.scopeElement).toBe(container);

    await rerender({ scope: undefined });
    await tick();
    expect(mockEl.scopeElement).toBeUndefined();

    container.remove();
  });

  it("does not call setTheme when theme prop is undefined", async () => {
    render(A11yHud);
    await tick();
    expect(mockInstance.setTheme).not.toHaveBeenCalled();
  });

  it("does not update debounce attribute when debounce changes to undefined", async () => {
    const { rerender } = render(A11yHud, { props: { debounce: 200 } });
    await tick();
    expect(mockEl.getAttribute("debounce")).toBe("200");
    await rerender({ debounce: undefined });
    await tick();
    expect(mockEl.getAttribute("debounce")).toBe("200");
  });

  it("does not call runScan when CE element is not found in the DOM", async () => {
    vi.spyOn(document, "querySelector").mockImplementation((selector) => {
      if (selector === "a11y-hud") return null;
      return document.querySelector.call(document, selector);
    });
    render(A11yHud);
    await tick();
    expect(mockInstance.runScan).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
