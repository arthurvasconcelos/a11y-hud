import { describe, expect, it } from "vitest";
import { generateBookmarklet } from "./bookmarklet.js";

describe("generateBookmarklet", () => {
  it("returns a string starting with 'javascript:'", () => {
    expect(generateBookmarklet()).toMatch(/^javascript:/);
  });

  it("defaults to the latest version", () => {
    expect(generateBookmarklet()).toContain("a11y-hud@latest/dist/index.umd.js");
  });

  it("pins to the given version string", () => {
    expect(generateBookmarklet("1.0.0")).toContain("a11y-hud@1.0.0/dist/index.umd.js");
  });

  it("loads from the jsDelivr CDN", () => {
    expect(generateBookmarklet()).toContain("cdn.jsdelivr.net");
  });

  it("references the UMD bundle path", () => {
    expect(generateBookmarklet()).toContain("dist/index.umd.js");
  });

  it("calls window.A11yHud.mount() once the script loads", () => {
    expect(generateBookmarklet()).toContain("window.A11yHud.mount()");
  });

  it("skips script injection when window.A11yHud is already present", () => {
    const bookmarklet = generateBookmarklet();
    expect(bookmarklet).toContain("if(window.A11yHud){window.A11yHud.mount();return;}");
  });

  it("injects the script via document.head.appendChild", () => {
    expect(generateBookmarklet()).toContain("document.head.appendChild(s)");
  });

  it("wraps the code in an IIFE", () => {
    const bookmarklet = generateBookmarklet();
    expect(bookmarklet).toContain("(function(){");
    expect(bookmarklet).toMatch(/\}\)\(\)$/);
  });

  it("produces a different URL for each version argument", () => {
    const latest = generateBookmarklet("latest");
    const pinned = generateBookmarklet("0.5.0");
    expect(latest).not.toBe(pinned);
  });
});
