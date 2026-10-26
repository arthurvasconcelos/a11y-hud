if (!("adoptedStyleSheets" in Document.prototype)) {
  Object.defineProperty(Document.prototype, "adoptedStyleSheets", {
    get() {
      return [];
    },
    set() {},
    configurable: true,
  });
}

if (!("adoptedStyleSheets" in ShadowRoot.prototype)) {
  Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
    get() {
      return [];
    },
    set() {},
    configurable: true,
  });
}

if (typeof CSSStyleSheet !== "undefined" && !CSSStyleSheet.prototype.replaceSync) {
  CSSStyleSheet.prototype.replaceSync = (_css: string) => {};
  CSSStyleSheet.prototype.replace = function (_css: string) {
    return Promise.resolve(this as CSSStyleSheet);
  };
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  });
}

// axe-core probes a 2D canvas context for its colour-contrast checks. jsdom has
// no canvas implementation and logs a "not implemented" error on every scan;
// returning null is what an unsupported browser would do and axe handles it.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
