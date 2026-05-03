import "zone.js";
import "zone.js/testing";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

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

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true },
});
