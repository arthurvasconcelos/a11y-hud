import { mount as vueMount } from "@vue/test-utils";
import { mount } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, reactive, shallowReactive } from "vue";
import { useA11yHud } from "./composable.js";
import type { UseA11yHudOptions } from "./types.js";

vi.mock("a11y-hud", () => ({
  mount: vi.fn(),
}));

type MockInstance = {
  unmount: ReturnType<typeof vi.fn>;
  setTheme: ReturnType<typeof vi.fn>;
  setRunOnly: ReturnType<typeof vi.fn>;
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
    setRunOnly: vi.fn(),
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

function mountComposable(options: UseA11yHudOptions = {}) {
  const wrapper = vueMount(
    defineComponent({
      setup() {
        const result = useA11yHud(options);
        return result;
      },
      render() {
        return null;
      },
    })
  );
  return wrapper;
}

describe("useA11yHud", () => {
  it("calls mount() on initial render", async () => {
    mountComposable();
    await nextTick();
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes initial options to mount()", async () => {
    mountComposable({ theme: "light", autoScan: false, debounce: 300 });
    await nextTick();
    expect(mount).toHaveBeenCalledWith({ theme: "light", autoScan: false, debounce: 300 });
  });

  it("calls instance.unmount() when the composable owner unmounts", async () => {
    const wrapper = mountComposable();
    await nextTick();
    await wrapper.unmount();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("calls instance.runScan() on initial mount", async () => {
    mountComposable();
    await nextTick();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("calls instance.runScan() on re-render (render-settled signal)", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    // shallowReactive makes opts.scope trackable so watch(() => options.scope)
    // fires when the scope prop changes, triggering the rescan.
    const opts = shallowReactive<UseA11yHudOptions>({ scope: undefined });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    const callsBefore = mockInstance.runScan.mock.calls.length;
    opts.scope = container;
    await nextTick();
    expect(mockInstance.runScan.mock.calls.length).toBeGreaterThan(callsBefore);
    container.remove();
    wrapper.unmount();
  });

  it("calls instance.setTheme() when theme changes", async () => {
    const opts = reactive<UseA11yHudOptions>({ theme: "light" });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.theme = "high-contrast";
    await nextTick();
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
    wrapper.unmount();
  });

  it("does not call setTheme when theme changes to undefined", async () => {
    const opts = reactive({ theme: "light" as UseA11yHudOptions["theme"] });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.theme = undefined;
    await nextTick();
    expect(mockInstance.setTheme).not.toHaveBeenCalledWith(undefined);
    wrapper.unmount();
  });

  it("sets auto-scan attribute when autoScan changes to true", async () => {
    const opts = reactive<UseA11yHudOptions>({ autoScan: false });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.autoScan = true;
    await nextTick();
    expect(mockEl.hasAttribute("auto-scan")).toBe(true);
    wrapper.unmount();
  });

  it("removes auto-scan attribute when autoScan changes to false", async () => {
    const opts = reactive<UseA11yHudOptions>({ autoScan: true });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.autoScan = false;
    await nextTick();
    expect(mockEl.hasAttribute("auto-scan")).toBe(false);
    wrapper.unmount();
  });

  it("sets debounce attribute when debounce prop changes", async () => {
    const opts = reactive<UseA11yHudOptions>({ debounce: 200 });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.debounce = 400;
    await nextTick();
    expect(mockEl.getAttribute("debounce")).toBe("400");
    wrapper.unmount();
  });

  it("does not update debounce attribute when debounce changes to undefined", async () => {
    const opts = reactive({ debounce: 200 as UseA11yHudOptions["debounce"] });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.debounce = 400;
    await nextTick();
    expect(mockEl.getAttribute("debounce")).toBe("400");
    opts.debounce = undefined;
    await nextTick();
    expect(mockEl.getAttribute("debounce")).toBe("400");
    wrapper.unmount();
  });

  it("sets scopeElement on the CE when scope has a value", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    mountComposable({ scope: container });
    await nextTick();

    expect(mockEl.scopeElement).toBe(container);
    container.remove();
  });

  it("clears scopeElement when scope is null", async () => {
    mountComposable({ scope: null });
    await nextTick();
    expect(mockEl.scopeElement).toBeUndefined();
  });

  it("clears scopeElement when scope changes from an element to undefined", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const opts = shallowReactive<UseA11yHudOptions>({ scope: container });

    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    expect(mockEl.scopeElement).toBe(container);

    opts.scope = undefined;
    await nextTick();
    expect(mockEl.scopeElement).toBeUndefined();

    container.remove();
    wrapper.unmount();
  });

  it("returned runScan() delegates to instance.runScan()", async () => {
    const wrapper = mountComposable();
    await nextTick();
    await (wrapper.vm as unknown as { runScan: () => Promise<unknown> }).runScan();
    expect(mockInstance.runScan).toHaveBeenCalled();
  });

  it("returned setTheme() delegates to instance.setTheme()", async () => {
    const wrapper = mountComposable();
    await nextTick();
    (wrapper.vm as unknown as { setTheme: (t: string) => void }).setTheme("dark");
    expect(mockInstance.setTheme).toHaveBeenCalledWith("dark");
  });

  it("calls instance.setRunOnly() when runOnly changes", async () => {
    const opts = reactive<UseA11yHudOptions>({ runOnly: ["wcag2a"] });
    const wrapper = vueMount(
      defineComponent({
        setup() {
          useA11yHud(opts);
          return () => null;
        },
      })
    );
    await nextTick();
    opts.runOnly = ["wcag2a", "wcag2aa"];
    await nextTick();
    expect(mockInstance.setRunOnly).toHaveBeenCalledWith(["wcag2a", "wcag2aa"]);
    wrapper.unmount();
  });

  it("returned setRunOnly() delegates to instance.setRunOnly()", async () => {
    const wrapper = mountComposable();
    await nextTick();
    (wrapper.vm as unknown as { setRunOnly: (tags: string[]) => void }).setRunOnly([
      "best-practice",
    ]);
    expect(mockInstance.setRunOnly).toHaveBeenCalledWith(["best-practice"]);
  });

  it("returned runScan and setTheme are stable references across re-renders", async () => {
    const opts = reactive<UseA11yHudOptions>({});
    const captured: { runScan?: unknown; setTheme?: unknown } = {};

    const wrapper = vueMount(
      defineComponent({
        setup() {
          const { runScan, setTheme } = useA11yHud(opts);
          captured.runScan = runScan;
          captured.setTheme = setTheme;
          return { runScan, setTheme };
        },
        render() {
          return null;
        },
      })
    );
    await nextTick();

    const vmRunScan = (wrapper.vm as unknown as { runScan: unknown }).runScan;
    const vmSetTheme = (wrapper.vm as unknown as { setTheme: unknown }).setTheme;

    expect(captured.runScan).toBe(vmRunScan);
    expect(captured.setTheme).toBe(vmSetTheme);
    wrapper.unmount();
  });
});
