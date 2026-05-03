---
"@a11y-hud/svelte": minor
---

Add `@a11y-hud/svelte` adapter for Svelte 5.

Exports `useA11yHud(getOptions)` hook and `<A11yHud>` component. Uses Svelte 5 runes (`$state`, `$effect`, `onMount`, `onDestroy`) for reactive prop sync and render-settled rescans. Peer dep: `svelte@>=5`.
