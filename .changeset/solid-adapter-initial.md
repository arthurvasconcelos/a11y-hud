---
"@a11y-hud/solid": minor
---

Add `@a11y-hud/solid` adapter for Solid.

Exports `createA11yHud(options)` primitive and `<A11yHud>` component. Uses `onMount`, `onCleanup`, and `createEffect` for reactive prop sync and render-settled rescans. Peer dep: `solid-js@>=1.8`.
