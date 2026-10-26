import { mount as vueMount } from "@vue/test-utils";
import { A11yHudElement } from "a11y-hud";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { HudHostHarness } from "./__harnesses__/hud-host.harness.js";
import { A11yHud } from "./component.js";

const hud = new HudHostHarness();

describe("A11yHud component", () => {
  let fixtureImage: HTMLImageElement;

  beforeEach(() => {
    hud.track();
    fixtureImage = document.createElement("img");
    document.body.appendChild(fixtureImage);
  });

  afterEach(async () => {
    await hud.cleanup();
    fixtureImage.remove();
    vi.restoreAllMocks();
  });

  it("renders nothing into the Vue tree", async () => {
    const wrapper = vueMount(A11yHud);
    await nextTick();
    expect(wrapper.element.nodeType).toBe(Node.COMMENT_NODE);
  });

  it("mounts the <a11y-hud> element into the document", async () => {
    vueMount(A11yHud);
    await nextTick();
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the theme prop to the element", async () => {
    vueMount(A11yHud, { props: { theme: "light" } });
    await nextTick();
    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("turns auto-scan off when autoScan is false", async () => {
    vueMount(A11yHud, { props: { autoScan: false } });
    await nextTick();
    expect(hud.hasAutoScan()).toBe(false);
  });

  it("applies the runOnly prop to the element", async () => {
    vueMount(A11yHud, { props: { runOnly: ["wcag2a", "wcag2aa"] } });
    await nextTick();
    expect(hud.getRunOnly()).toEqual(["wcag2a", "wcag2aa"]);
  });

  it("removes the element when the component unmounts", async () => {
    const wrapper = vueMount(A11yHud);
    await nextTick();
    wrapper.unmount();
    expect(hud.isMounted()).toBe(false);
  });

  it("switches the element's theme when the theme prop changes", async () => {
    const wrapper = vueMount(A11yHud, { props: { theme: "light" } });
    await nextTick();
    await wrapper.setProps({ theme: "high-contrast" });
    await nextTick();
    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("runs a real axe-core scan and lists the page's violations", async () => {
    const runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
    vueMount(A11yHud);

    await hud.awaitReady();

    expect(runScan).toHaveBeenCalled();
    expect(hud.getRuleIds()).toContain("image-alt");
  });
});
