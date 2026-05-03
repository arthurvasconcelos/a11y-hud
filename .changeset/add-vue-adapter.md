---
"@a11y-hud/vue": minor
---

Initial release of `@a11y-hud/vue`.

- `<A11yHud>` component: drop into any Vue 3 tree to mount the HUD. Accepts `theme`, `scope`, `autoScan`, and `debounce` props. Returns nothing — the HUD is appended to `document.body` as a Custom Element.
- `useA11yHud(options)` composable: imperative alternative for apps that need to call `runScan()` or `setTheme()` programmatically.
- `scope` prop accepts a `Ref<Element | null>` to restrict the axe scan to a subtree.
- Hooks into `watchPostEffect` for the render-settled signal — rescans fire after Vue's DOM flush, catching prop-driven reactive updates.
- Peer dependencies: `vue@>=3.4`.
