# @a11y-hud/react

## 0.2.4

### Patch Changes

- Updated dependencies [f1fa962]
  - a11y-hud@0.1.4

## 0.2.3

### Patch Changes

- Updated dependencies
  - a11y-hud@0.1.3

## 0.2.2

### Patch Changes

- Updated dependencies [2c0ffb7]
  - a11y-hud@0.1.2

## 0.2.1

### Patch Changes

- 64cd443: Add README.md and LICENSE to both published packages. Both files were listed in each package's `files` array but were missing, resulting in blank npm pages.
- Updated dependencies [64cd443]
  - a11y-hud@0.1.1

## 0.2.0

### Minor Changes

- 8e0da87: Initial release of `@a11y-hud/react`.

  - `<A11yHud>` component: drop into any React tree to mount the HUD. Accepts `theme`, `scope`, `autoScan`, and `debounce` props. Returns `null` — the HUD is appended to `document.body` as a Custom Element.
  - `useA11yHud(options)` hook: imperative alternative for apps that need to call `runScan()` or `setTheme()` programmatically.
  - `scope` prop accepts a `RefObject<Element | null>` to restrict the axe scan to a subtree.
  - Hooks into `useEffect` for the render-settled signal — rescans fire after every React render commit, catching route changes and prop-driven ARIA mutations.
  - Peer dependencies: `react@>=18`, `react-dom@>=18`.
