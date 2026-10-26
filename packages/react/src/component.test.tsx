import { render } from "@testing-library/react";
import { A11yHudElement } from "a11y-hud";
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
    await hud.cleanup();
    fixtureImage.remove();
    vi.restoreAllMocks();
  });

  it("renders nothing into the React tree", () => {
    const { container } = render(<A11yHud />);
    expect(container.firstChild).toBeNull();
  });

  it("mounts the <a11y-hud> element into the document", () => {
    render(<A11yHud />);
    expect(hud.isMounted()).toBe(true);
  });

  it("applies the theme prop to the element", () => {
    render(<A11yHud theme="light" />);
    expect(hud.getThemeAttribute()).toBe("light");
  });

  it("keeps auto-scan on by default", () => {
    render(<A11yHud />);
    expect(hud.hasAutoScan()).toBe(true);
  });

  it("turns auto-scan off when autoScan is false", () => {
    render(<A11yHud autoScan={false} />);
    expect(hud.hasAutoScan()).toBe(false);
  });

  it("removes the element when the component unmounts", () => {
    const { unmount } = render(<A11yHud />);
    unmount();
    expect(hud.isMounted()).toBe(false);
  });

  it("switches the element's theme when the theme prop changes", () => {
    const { rerender } = render(<A11yHud theme="light" />);
    rerender(<A11yHud theme="high-contrast" />);
    expect(hud.getThemeAttribute()).toBe("high-contrast");
  });

  it("runs a real axe-core scan and lists the page's violations", async () => {
    const runScan = vi.spyOn(A11yHudElement.prototype, "runScan");
    render(<A11yHud />);

    await hud.awaitReady();

    expect(runScan).toHaveBeenCalled();
    expect(hud.getRuleIds()).toContain("image-alt");
  });
});
