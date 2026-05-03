import { cleanup, render } from "@solidjs/testing-library";
import { mount } from "a11y-hud";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { A11yHud } from "./component.js";

vi.mock("a11y-hud", () => ({ mount: vi.fn() }));

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
});

afterEach(() => {
  mockEl.remove();
  cleanup();
  vi.clearAllMocks();
});

describe("A11yHud component", () => {
  it("mounts the CE on render", () => {
    render(() => A11yHud({}));
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes theme prop to mount()", () => {
    render(() => A11yHud({ theme: "light" }));
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ theme: "light" }));
  });

  it("passes autoScan prop to mount()", () => {
    render(() => A11yHud({ autoScan: false }));
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ autoScan: false }));
  });

  it("calls instance.unmount() when component unmounts", () => {
    const { unmount } = render(() => A11yHud({}));
    unmount();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("calls instance.setTheme() when theme prop changes via signal", () => {
    const [theme, setTheme] = createSignal<"light" | "dark" | "high-contrast" | undefined>("light");
    render(() =>
      A11yHud({
        get theme() {
          return theme();
        },
      })
    );
    setTheme("high-contrast");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("calls instance.runScan() on initial render", () => {
    render(() => A11yHud({}));
    expect(mockInstance.runScan).toHaveBeenCalled();
  });
});
