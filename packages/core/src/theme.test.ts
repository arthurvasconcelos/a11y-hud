import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTheme, watchTheme } from "./theme.js";

function mockMedia(dark: boolean, highContrast: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const matches =
      (query === "(prefers-color-scheme: dark)" && dark) ||
      (query === "(prefers-contrast: more)" && highContrast);
    const listeners = new Set<EventListener>();
    return {
      matches,
      media: query,
      onchange: null,
      addEventListenercount: 0,
      addEventListener(_: string, l: EventListener) {
        listeners.add(l);
      },
      removeEventListener(_: string, l: EventListener) {
        listeners.delete(l);
      },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  });
}

describe("resolveTheme", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns high-contrast when prefers-contrast: more regardless of theme", () => {
    mockMedia(false, true);
    expect(resolveTheme("default")).toBe("high-contrast");
    expect(resolveTheme("light")).toBe("high-contrast");
    expect(resolveTheme("auto")).toBe("high-contrast");
    expect(resolveTheme("github-dark")).toBe("high-contrast");
    expect(resolveTheme("github-light")).toBe("high-contrast");
    expect(resolveTheme("tokyo-night")).toBe("high-contrast");
    expect(resolveTheme("solarized-dark")).toBe("high-contrast");
  });

  it("resolves auto to default when prefers dark scheme", () => {
    mockMedia(true, false);
    expect(resolveTheme("auto")).toBe("default");
  });

  it("resolves auto to light when prefers light scheme", () => {
    mockMedia(false, false);
    expect(resolveTheme("auto")).toBe("light");
  });

  it("returns explicit theme when no high-contrast preference", () => {
    mockMedia(false, false);
    expect(resolveTheme("default")).toBe("default");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("github-dark")).toBe("github-dark");
    expect(resolveTheme("github-light")).toBe("github-light");
    expect(resolveTheme("tokyo-night")).toBe("tokyo-night");
    expect(resolveTheme("solarized-dark")).toBe("solarized-dark");
  });
});

describe("watchTheme", () => {
  beforeEach(() => {
    mockMedia(false, false);
  });

  afterEach(() => vi.restoreAllMocks());

  it("calls callback when media changes and returns cleanup", () => {
    const listeners: Map<string, EventListener[]> = new Map();

    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener(_: string, l: EventListener) {
          listeners.get(query)?.push(l);
        },
        removeEventListener(_: string, l: EventListener) {
          const arr = listeners.get(query) ?? [];
          const idx = arr.indexOf(l);
          if (idx !== -1) arr.splice(idx, 1);
        },
        dispatchEvent: () => true,
      } as unknown as MediaQueryList;
    });

    const callback = vi.fn();
    const unwatch = watchTheme(() => "auto", callback);

    expect(typeof unwatch).toBe("function");

    // Fire the change listener to trigger the internal handler
    const colorListeners = listeners.get("(prefers-color-scheme: dark)") ?? [];
    colorListeners[0]?.(new Event("change"));
    expect(callback).toHaveBeenCalledTimes(1);

    unwatch();
    const remaining = [...listeners.values()].flat();
    expect(remaining).toHaveLength(0);
  });
});
