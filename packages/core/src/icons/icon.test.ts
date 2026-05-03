import { describe, expect, it } from "vitest";
import { icon } from "./index.js";

describe("icon registry", () => {
  it("returns an SVG string for a known icon", () => {
    expect(icon("x")).toContain("<svg");
  });

  it("returns empty string for an unknown icon name", () => {
    expect(icon("not-a-real-icon")).toBe("");
  });
});
