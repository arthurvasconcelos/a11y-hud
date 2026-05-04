import { act, renderHook } from "@testing-library/react";
import { mount } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useA11yHud } from "./hook.js";

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
  setRunOnly: ReturnType<typeof vi.fn>;
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
    setRunOnly: vi.fn(),
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

  it("passes initial runOnly to mount()", () => {
    renderHook(() => useA11yHud({ runOnly: ["wcag2a", "wcag2aa"] }));
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ runOnly: ["wcag2a", "wcag2aa"] }));
  });

  it("calls instance.setRunOnly() when runOnly prop changes", async () => {
    let runOnly = ["wcag2a"] as string[];
    const { rerender } = renderHook(() => useA11yHud({ runOnly }));
    await act(async () => {});
    runOnly = ["wcag2a", "wcag2aa"];
    rerender();
    await act(async () => {});
    expect(mockInstance.setRunOnly).toHaveBeenCalledWith(["wcag2a", "wcag2aa"]);
  });

  it("returned setRunOnly() delegates to instance.setRunOnly()", async () => {
    const { result } = renderHook(() => useA11yHud());
    await act(async () => {});
    result.current.setRunOnly(["best-practice"]);
    expect(mockInstance.setRunOnly).toHaveBeenCalledWith(["best-practice"]);
  });

  it("returned exportResults() delegates to instance.exportResults()", async () => {
    mockInstance.exportResults.mockReturnValue('{"version":"1"}');
    const { result } = renderHook(() => useA11yHud());
    await act(async () => {});
    const json = result.current.exportResults();
    expect(mockInstance.exportResults).toHaveBeenCalledOnce();
    expect(json).toBe('{"version":"1"}');
  });

  it("returned ignores.add() delegates to instance.ignores.add()", async () => {
    const { result } = renderHook(() => useA11yHud());
    await act(async () => {});
    result.current.ignores.add("color-contrast");
    expect(mockInstance.ignores.add).toHaveBeenCalledWith("color-contrast", undefined);
  });

  it("returned ignores.list() delegates to instance.ignores.list()", async () => {
    mockInstance.ignores.list.mockReturnValue([{ ruleId: "image-alt" }]);
    const { result } = renderHook(() => useA11yHud());
    await act(async () => {});
    const list = result.current.ignores.list();
    expect(list).toEqual([{ ruleId: "image-alt" }]);
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
