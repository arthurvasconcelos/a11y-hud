# Roadmap

This document outlines the planned releases for `a11y-hud`.

## 0.1 — Core MVP (vanilla) ✓

- `a11y-hud` npm package (unscoped)
- `<a11y-hud>` Custom Element with Shadow DOM
- Floating panel: violations grouped by rule, click-to-highlight, keyboard navigation
- Severity and WCAG-level filters
- MutationObserver auto-rescan (debounced)
- Headless API: `runScan()` for programmatic / CI use
- Three built-in themes: `default` (dark), `light`, `high-contrast`; `auto` default
- ESM + CJS + UMD (CDN-ready)

## 0.2 — `@a11y-hud/react` ✓

React adapter: `<A11yHud />` component + `useA11yHud()` hook.

## 0.3 — `@a11y-hud/vue` ✓

Vue adapter: `<A11yHud />` component + `useA11yHud()` composable.

## 0.4 — `@a11y-hud/angular` ✓

Angular adapter: standalone component + `A11yHudService`.

## 0.5 — `@a11y-hud/svelte` + `@a11y-hud/solid` ← _current_

Svelte 5 (runes) + Solid adapters.

## 0.6 — Power features

- Ignore-rules persistence (localStorage + export/import)
- Keyboard-only mode (tab-navigation simulation + focus-trap detection)
- JSON export of scan results
- Configurable axe rule sets
- Additional built-in themes
- Bookmarklet generator

## 0.7 — Polish, docs, performance

- VitePress docs site with guides for all frameworks (including Astro and Qwik)
- Full API reference
- Bundle-size budgets
- Thorough a11y audit of the HUD's own UI

## 1.0.0

Stable public API. Semver from this point.

---

Dates are not committed. Progress is tracked via [GitHub Milestones](https://github.com/arthurvasconcelos/a11y-hud/milestones).
