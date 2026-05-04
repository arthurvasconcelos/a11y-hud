import { cleanup, render } from "@testing-library/svelte";
import { mount } from "a11y-hud";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HookWrapper from "../tests/HookWrapper.svelte";
import type { UseA11yHudReturn } from "./types.js";

vi.mock("a11y-hud", () => ({
  mount: vi.fn(),
}));

type MockInstance = {
  unmount: ReturnType<typeof vi.fn>;
  setTheme: ReturnType<typeof vi.fn>;
  runScan: ReturnType<typeof vi.fn>;
  exportResults: ReturnType<typeof vi.fn>;
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

function mountHook(): UseA11yHudReturn {
  let captured: UseA11yHudReturn | undefined;
  render(HookWrapper, {
    props: {
      onResult: (r) => {
        captured = r;
      },
    },
  });
  if (!captured) throw new Error("onResult not called during component init");
  return captured;
}

describe("useA11yHud hook", () => {
  it("returned runScan() delegates to instance.runScan()", async () => {
    const hook = mountHook();
    await tick();
    await hook.runScan();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("returned setTheme() delegates to instance.setTheme()", async () => {
    const hook = mountHook();
    await tick();
    hook.setTheme("dark");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("dark");
  });

  it("returned runScan() returns a Promise", async () => {
    const hook = mountHook();
    await tick();
    const result = hook.runScan();
    expect(result).toBeInstanceOf(Promise);
  });

  it("returned setTheme() accepts any valid theme", async () => {
    const hook = mountHook();
    await tick();
    expect(() => hook.setTheme("high-contrast")).not.toThrow();
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("returned exportResults() delegates to instance.exportResults()", async () => {
    mockInstance.exportResults.mockReturnValue('{"version":"1"}');
    const hook = mountHook();
    await tick();
    const json = hook.exportResults();
    expect(mockInstance.exportResults).toHaveBeenCalledOnce();
    expect(json).toBe('{"version":"1"}');
  });
});
