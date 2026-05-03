import { mount as vueMount } from "@vue/test-utils";
import { mount } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { A11yHud } from "./component.js";

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
});

afterEach(() => {
  mockEl.remove();
  vi.clearAllMocks();
});

describe("A11yHud component", () => {
  it("renders nothing into the Vue tree", async () => {
    const wrapper = vueMount(A11yHud);
    await nextTick();
    expect(wrapper.element.nodeType).toBe(Node.COMMENT_NODE);
  });

  it("mounts the CE on render", async () => {
    vueMount(A11yHud);
    await nextTick();
    expect(mount).toHaveBeenCalledOnce();
  });

  it("passes theme prop to mount()", async () => {
    vueMount(A11yHud, { props: { theme: "light" } });
    await nextTick();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ theme: "light" }));
  });

  it("passes autoScan prop to mount()", async () => {
    vueMount(A11yHud, { props: { autoScan: false } });
    await nextTick();
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ autoScan: false }));
  });

  it("calls instance.unmount() when component unmounts", async () => {
    const wrapper = vueMount(A11yHud);
    await nextTick();
    await wrapper.unmount();
    expect(mockInstance.unmount).toHaveBeenCalledOnce();
  });

  it("calls instance.setTheme() when theme prop changes", async () => {
    const wrapper = vueMount(A11yHud, { props: { theme: "light" } });
    await nextTick();
    await wrapper.setProps({ theme: "high-contrast" });
    await nextTick();
    expect(mockInstance.setTheme).toHaveBeenCalledWith("high-contrast");
  });
});
