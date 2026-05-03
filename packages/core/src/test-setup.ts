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

// jsdom does not implement scrollIntoView.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom does not implement matchMedia; stub it so elements that call
// resolveTheme() inside lifecycle callbacks don't throw silently.
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
