# @a11y-hud/vue

## 0.2.1

### Patch Changes

- 2c0ffb7: Fix scope prop type and add README.

  - `scope` prop is now correctly typed as `Element | null` instead of `Ref<Element | null>`. Vue 3 auto-unwraps template refs before passing them as component props, so the previous `Ref`-based type meant `scopeElement` was never set and subtree scoping never worked.
  - Add `README.md` to the published package.

- Updated dependencies [2c0ffb7]
  - a11y-hud@0.1.2

## 0.2.0

### Minor Changes

- ef8aa89: Initial release of `@a11y-hud/vue`.

  - `<A11yHud>` component: drop into any Vue 3 tree to mount the HUD. Accepts `theme`, `scope`, `autoScan`, and `debounce` props. Returns nothing — the HUD is appended to `document.body` as a Custom Element.
  - `useA11yHud(options)` composable: imperative alternative for apps that need to call `runScan()` or `setTheme()` programmatically.
  - `scope` prop accepts a `Ref<Element | null>` to restrict the axe scan to a subtree.
  - Hooks into `watchPostEffect` for the render-settled signal — rescans fire after Vue's DOM flush, catching prop-driven reactive updates.
  - Peer dependencies: `vue@>=3.4`.

## 0.1.0

### Minor Changes

- Initial release. Vue 3 adapter for a11y-hud — `useA11yHud()` composable and `<A11yHud>` component.
