import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createObserver, debounce } from "./observer.js";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("delays invocation by the specified delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer on repeated calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel prevents the pending invocation", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });

  it("passes arguments to the wrapped function", () => {
    const fn = vi.fn<(a: number, b: string) => void>();
    const debounced = debounce(fn, 100);

    debounced(42, "hello");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith(42, "hello");
  });
});

describe("createObserver", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
  });

  it("returns a MutationObserver instance", () => {
    const observer = createObserver(container, vi.fn(), 100);
    expect(observer).toBeInstanceOf(MutationObserver);
    observer.disconnect();
  });

  it("calls callback (debounced) when child nodes change", async () => {
    const callback = vi.fn();
    const observer = createObserver(container, callback, 100);

    container.appendChild(document.createElement("span"));
    await Promise.resolve(); // flush MutationObserver microtask
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    observer.disconnect();
  });

  it("debounces rapid DOM mutations into a single callback", async () => {
    const callback = vi.fn();
    const observer = createObserver(container, callback, 200);

    container.appendChild(document.createElement("span"));
    container.appendChild(document.createElement("div"));
    container.appendChild(document.createElement("p"));
    await Promise.resolve(); // flush MutationObserver microtask
    vi.advanceTimersByTime(200);

    expect(callback).toHaveBeenCalledTimes(1);
    observer.disconnect();
  });
});
