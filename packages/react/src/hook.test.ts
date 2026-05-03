import { act, renderHook } from "@testing-library/react";
import { mount } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useA11yHud } from "./hook.js";

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
  mockEl.remove();
  vi.clearAllMocks();
});

describe("useA11yHud", () => {
  it("calls mount() on initial render", () => {
    renderHook(() => useA11yHud());
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes initial options to mount()", () => {
    renderHook(() => useA11yHud({ theme: "light", autoScan: false, debounce: 300 }));
    expect(mount).toHaveBeenCalledWith({ theme: "light", autoScan: false, debounce: 300 });
  });

  it("calls instance.unmount() when the hook unmounts", () => {
    const { unmount } = renderHook(() => useA11yHud());
    unmount();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("calls instance.runScan() on initial render commit", async () => {
    renderHook(() => useA11yHud());
    await act(async () => {});
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("calls instance.runScan() on re-render (render-settled signal)", async () => {
    const { rerender } = renderHook(() => useA11yHud());
    await act(async () => {});
    const callsBefore = mockInstance.runScan.mock.calls.length;
    rerender();
    await act(async () => {});
    expect(mockInstance.runScan.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("calls instance.setTheme() when theme prop changes", async () => {
    let theme = "light" as const;
    const { rerender } = renderHook(() => useA11yHud({ theme }));
    await act(async () => {});
    theme = "high-contrast";
    rerender();
    await act(async () => {});
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("sets auto-scan attribute when autoScan changes to true", async () => {
    let autoScan = false;
    const { rerender } = renderHook(() => useA11yHud({ autoScan }));
    await act(async () => {});
    autoScan = true;
    rerender();
    await act(async () => {});
    expect(mockEl.hasAttribute("auto-scan")).toBe(true);
  });

  it("removes auto-scan attribute when autoScan changes to false", async () => {
    let autoScan = true;
    const { rerender } = renderHook(() => useA11yHud({ autoScan }));
    await act(async () => {});
    autoScan = false;
    rerender();
    await act(async () => {});
    expect(mockEl.hasAttribute("auto-scan")).toBe(false);
  });

  it("sets debounce attribute when debounce prop changes", async () => {
    let debounce = 200;
    const { rerender } = renderHook(() => useA11yHud({ debounce }));
    await act(async () => {});
    debounce = 400;
    rerender();
    await act(async () => {});
    expect(mockEl.getAttribute("debounce")).toBe("400");
  });

  it("sets scopeElement on the CE when scope ref has a current value", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const scopeRef = { current: container };

    renderHook(() => useA11yHud({ scope: scopeRef }));
    await act(async () => {});

    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("clears scopeElement when scope ref current is null", async () => {
    const scopeRef = { current: null };
    renderHook(() => useA11yHud({ scope: scopeRef }));
    await act(async () => {});
    expect(mockEl.scopeElement).toBeUndefined();
  });

  it("clears scopeElement when scope changes from a ref to undefined", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let scope: { current: Element | null } | undefined = { current: container };

    const { rerender } = renderHook(() =>
      useA11yHud({ scope: scope as import("react").RefObject<Element | null> })
    );
    await act(async () => {});
    expect(mockEl.scopeElement).toBe(container);

    scope = undefined;
    rerender();
    await act(async () => {});
    expect(mockEl.scopeElement).toBeUndefined();

    container.remove();
  });

  it("returned runScan() delegates to instance.runScan()", async () => {
    const { result } = renderHook(() => useA11yHud());
    await act(async () => {});
    await result.current.runScan();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("returned setTheme() delegates to instance.setTheme()", async () => {
    const { result } = renderHook(() => useA11yHud());
    await act(async () => {});
    result.current.setTheme("dark" as never);
    expect(mockInstance.setTheme).toHaveBeenCalledWith("dark");
  });

  it("returned runScan and setTheme are stable references across re-renders", async () => {
    const { result, rerender } = renderHook(() => useA11yHud());
    await act(async () => {});
    const { runScan: run1, setTheme: set1 } = result.current;
    rerender();
    await act(async () => {});
    const { runScan: run2, setTheme: set2 } = result.current;
    expect(run1).toBe(run2);
    expect(set1).toBe(set2);
  });
});
