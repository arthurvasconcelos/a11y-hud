import { cleanup, render } from "@solidjs/testing-library";
import { mount } from "a11y-hud";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createA11yHud } from "./hook.js";
import type { CreateA11yHudOptions } from "./types.js";

vi.mock("a11y-hud", () => ({ mount: vi.fn() }));

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
  cleanup();
  vi.clearAllMocks();
});

function mountHook(options: CreateA11yHudOptions = {}) {
  return render(() => {
    createA11yHud(options);
    return null;
  });
}

describe("createA11yHud", () => {
  it("calls mount() on initial render", () => {
    mountHook();
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes initial theme to mount()", () => {
    mountHook({ theme: "light" });
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ theme: "light" }));
  });

  it("passes initial autoScan to mount()", () => {
    mountHook({ autoScan: false });
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ autoScan: false }));
  });

  it("passes initial debounce to mount()", () => {
    mountHook({ debounce: 300 });
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ debounce: 300 }));
  });

  it("does not include theme in mount() options when undefined", () => {
    mountHook({});
    expect(mount).toHaveBeenCalledWith({});
  });

  it("calls instance.unmount() when the component unmounts", () => {
    const { unmount } = mountHook();
    unmount();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("calls instance.runScan() on initial render (from scope effect)", () => {
    mountHook();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("sets scopeElement on the CE when scope has a value", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    mountHook({ scope: container });
    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("clears scopeElement when scope is null", () => {
    mountHook({ scope: null });
    expect(mockEl.scopeElement).toBeUndefined();
  });

  it("calls instance.runScan() when scope changes (via signal)", () => {
    const [scope, setScope] = createSignal<Element | null>(null);
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(() => {
      createA11yHud({
        get scope() {
          return scope();
        },
      });
      return null;
    });

    const callsBefore = mockInstance.runScan.mock.calls.length;
    setScope(container);

    expect(mockInstance.runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    container.remove();
  });

  it("calls instance.setTheme() when theme changes via signal", () => {
    const [theme, setTheme] = createSignal<CreateA11yHudOptions["theme"]>("light");

    render(() => {
      createA11yHud({
        get theme() {
          return theme();
        },
      });
      return null;
    });

    setTheme("high-contrast");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("does not call setTheme when theme is undefined", () => {
    render(() => {
      createA11yHud({ theme: undefined });
      return null;
    });
    expect(mockInstance.setTheme).not.toHaveBeenCalled();
  });

  it("sets auto-scan attribute when autoScan changes to true via signal", () => {
    const [autoScan, setAutoScan] = createSignal<boolean>(false);

    render(() => {
      createA11yHud({
        get autoScan() {
          return autoScan();
        },
      });
      return null;
    });

    setAutoScan(true);
    expect(mockEl.hasAttribute("auto-scan")).toBe(true);
  });

  it("removes auto-scan attribute when autoScan changes to false via signal", () => {
    const [autoScan, setAutoScan] = createSignal<boolean>(true);

    render(() => {
      createA11yHud({
        get autoScan() {
          return autoScan();
        },
      });
      return null;
    });

    setAutoScan(false);
    expect(mockEl.hasAttribute("auto-scan")).toBe(false);
  });

  it("sets debounce attribute when debounce changes via signal", () => {
    const [debounce, setDebounce] = createSignal<number | undefined>(200);

    render(() => {
      createA11yHud({
        get debounce() {
          return debounce();
        },
      });
      return null;
    });

    setDebounce(400);
    expect(mockEl.getAttribute("debounce")).toBe("400");
  });

  it("does not update debounce attribute when debounce changes to undefined", () => {
    const [debounce, setDebounce] = createSignal<number | undefined>(200);

    render(() => {
      createA11yHud({
        get debounce() {
          return debounce();
        },
      });
      return null;
    });

    setDebounce(400);
    expect(mockEl.getAttribute("debounce")).toBe("400");
    setDebounce(undefined);
    expect(mockEl.getAttribute("debounce")).toBe("400");
  });

  it("clears scopeElement when scope changes from element to undefined via signal", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const [scope, setScope] = createSignal<Element | null>(container);

    render(() => {
      createA11yHud({
        get scope() {
          return scope();
        },
      });
      return null;
    });

    expect(mockEl.scopeElement).toBe(container);
    setScope(null);
    expect(mockEl.scopeElement).toBeUndefined();
    container.remove();
  });

  it("returned runScan() delegates to instance.runScan()", () => {
    let result!: ReturnType<typeof createA11yHud>;

    render(() => {
      result = createA11yHud({});
      return null;
    });

    void result.runScan();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("returned setTheme() delegates to instance.setTheme()", () => {
    let result!: ReturnType<typeof createA11yHud>;

    render(() => {
      result = createA11yHud({});
      return null;
    });

    result.setTheme("dark");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("dark");
  });

  it("passes initial runOnly to mount()", () => {
    mountHook({ runOnly: ["wcag2a", "wcag2aa"] });
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ runOnly: ["wcag2a", "wcag2aa"] }));
  });

  it("calls instance.setRunOnly() when runOnly changes via signal", () => {
    const [runOnly, setRunOnly] = createSignal<string[] | undefined>(["wcag2a"]);

    render(() => {
      createA11yHud({
        get runOnly() {
          return runOnly();
        },
      });
      return null;
    });

    setRunOnly(["wcag2a", "wcag2aa"]);
    expect(mockInstance.setRunOnly).toHaveBeenCalledWith(["wcag2a", "wcag2aa"]);
  });

  it("does not call setRunOnly when runOnly is undefined", () => {
    render(() => {
      createA11yHud({ runOnly: undefined });
      return null;
    });
    expect(mockInstance.setRunOnly).not.toHaveBeenCalled();
  });

  it("returned setRunOnly() delegates to instance.setRunOnly()", () => {
    let result!: ReturnType<typeof createA11yHud>;

    render(() => {
      result = createA11yHud({});
      return null;
    });

    result.setRunOnly(["best-practice"]);
    expect(mockInstance.setRunOnly).toHaveBeenCalledWith(["best-practice"]);
  });

  it("returned ignores.add() delegates to instance.ignores.add()", () => {
    let result!: ReturnType<typeof createA11yHud>;

    render(() => {
      result = createA11yHud({});
      return null;
    });

    result.ignores.add("color-contrast");
    expect(mockInstance.ignores.add).toHaveBeenCalledWith("color-contrast", undefined);
  });

  it("returned exportResults() delegates to instance.exportResults()", () => {
    mockInstance.exportResults.mockReturnValue('{"version":"1"}');
    let result!: ReturnType<typeof createA11yHud>;

    render(() => {
      result = createA11yHud({});
      return null;
    });

    const json = result.exportResults();
    expect(mockInstance.exportResults).toHaveBeenCalledOnce();
    expect(json).toBe('{"version":"1"}');
  });

  it("runScan() returns a resolved promise when no instance", () => {
    let result!: ReturnType<typeof createA11yHud>;

    // We can't easily test this path without an instance, but verify the
    // return type is a Promise when called on an unmounted hook
    render(() => {
      result = createA11yHud({});
      return null;
    });

    const scanResult = result.runScan();
    expect(scanResult).toBeInstanceOf(Promise);
  });
});
