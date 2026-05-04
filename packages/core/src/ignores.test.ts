import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addIgnore,
  clearIgnores,
  exportIgnores,
  importIgnores,
  listIgnores,
  removeIgnore,
} from "./ignores.js";

describe("ignores", () => {
  beforeEach(() => {
    clearIgnores();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listIgnores() returns [] when storage is empty", () => {
    expect(listIgnores()).toEqual([]);
  });

  it("addIgnore stores an entry with just ruleId", () => {
    addIgnore("color-contrast");
    expect(listIgnores()).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("addIgnore deduplicates — calling twice with same args doesn't create two entries", () => {
    addIgnore("color-contrast");
    addIgnore("color-contrast");
    expect(listIgnores()).toHaveLength(1);
  });

  it("addIgnore stores an entry with selector", () => {
    addIgnore("image-alt", "#hero");
    expect(listIgnores()).toEqual([{ ruleId: "image-alt", selector: "#hero" }]);
  });

  it("addIgnore with ruleId+selector and just ruleId are distinct entries", () => {
    addIgnore("image-alt", "#hero");
    addIgnore("image-alt");
    expect(listIgnores()).toHaveLength(2);
  });

  it("removeIgnore removes the matching entry", () => {
    addIgnore("color-contrast");
    removeIgnore("color-contrast");
    expect(listIgnores()).toEqual([]);
  });

  it("removeIgnore with a selector only removes the entry matching both ruleId and selector", () => {
    addIgnore("image-alt", "#hero");
    addIgnore("image-alt");
    removeIgnore("image-alt", "#hero");
    expect(listIgnores()).toEqual([{ ruleId: "image-alt" }]);
  });

  it("removeIgnore on a non-existent entry is a no-op", () => {
    addIgnore("color-contrast");
    removeIgnore("label");
    expect(listIgnores()).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("clearIgnores empties the list", () => {
    addIgnore("color-contrast");
    addIgnore("image-alt");
    clearIgnores();
    expect(listIgnores()).toEqual([]);
  });

  it("exportIgnores returns valid JSON that round-trips through JSON.parse", () => {
    addIgnore("color-contrast");
    const json = exportIgnores();
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("exportIgnores output contains the ruleId of added ignores", () => {
    addIgnore("image-alt", "#hero");
    const json = exportIgnores();
    expect(json).toContain("image-alt");
  });

  it("importIgnores replaces the list with entries from JSON", () => {
    addIgnore("color-contrast");
    importIgnores(
      JSON.stringify([{ ruleId: "label" }, { ruleId: "image-alt", selector: ".logo" }])
    );
    expect(listIgnores()).toEqual([
      { ruleId: "label" },
      { ruleId: "image-alt", selector: ".logo" },
    ]);
  });

  it("importIgnores with invalid JSON string is a no-op", () => {
    addIgnore("color-contrast");
    importIgnores("not valid json {{");
    expect(listIgnores()).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("importIgnores with a JSON non-array is a no-op", () => {
    addIgnore("color-contrast");
    importIgnores("{}");
    expect(listIgnores()).toEqual([{ ruleId: "color-contrast" }]);
  });

  it("importIgnores skips items without a string ruleId", () => {
    importIgnores(JSON.stringify([{ ruleId: 42 }, { ruleId: "label" }, { noRuleId: true }]));
    expect(listIgnores()).toEqual([{ ruleId: "label" }]);
  });

  it("importIgnores preserves valid selector strings", () => {
    importIgnores(JSON.stringify([{ ruleId: "image-alt", selector: "#banner" }]));
    expect(listIgnores()).toEqual([{ ruleId: "image-alt", selector: "#banner" }]);
  });

  it("listIgnores returns [] when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(listIgnores()).toEqual([]);
  });

  it("addIgnore does not throw when localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => addIgnore("color-contrast")).not.toThrow();
  });
});
