import { cleanup, render } from "@solidjs/testing-library";
import { A11yHudElement } from "a11y-hud";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    cleanup();
    await hud.cleanup();
    fixtureImage.remove();
    vi.restoreAllMocks();
  });

  it("mounts the <a11y-hud> element into the document", () => {
    render(() => A11yHud({}));
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the theme prop to the element", () => {
    render(() => A11yHud({ theme: "light" }));
    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("turns auto-scan off when autoScan is false", () => {
    render(() => A11yHud({ autoScan: false }));
    expect(hud.hasAutoScan()).toBe(false);
  });

  it("removes the element when the component unmounts", () => {
    const { unmount } = render(() => A11yHud({}));
    unmount();
    expect(hud.isMounted()).toBe(false);
  });

  it("switches the element's theme when the theme signal changes", () => {
    const [theme, setTheme] = createSignal<"light" | "high-contrast">("light");
    render(() =>
      A11yHud({
        get theme() {
          return theme();
        },
      })
    );

    setTheme("high-contrast");

    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("runs a scan on initial render", () => {
    const runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
    render(() => A11yHud({}));
    expect(runScan).toHaveBeenCalled();
  });

  it("runs a real axe-core scan and lists the page's violations", async () => {
    render(() => A11yHud({}));

    await hud.awaitReady();

    expect(hud.getRuleIds()).toContain("image-alt");
  });
});
