---
"@a11y-hud/react": minor
---

Initial release of `@a11y-hud/react`.

- `<A11yHud>` component: drop into any React tree to mount the HUD. Accepts `theme`, `scope`, `autoScan`, and `debounce` props. Returns `null` — the HUD is appended to `document.body` as a Custom Element.
- `useA11yHud(options)` hook: imperative alternative for apps that need to call `runScan()` or `setTheme()` programmatically.
- `scope` prop accepts a `RefObject<Element | null>` to restrict the axe scan to a subtree.
- Hooks into `useEffect` for the render-settled signal — rescans fire after every React render commit, catching route changes and prop-driven ARIA mutations.
- Peer dependencies: `react@>=18`, `react-dom@>=18`.
