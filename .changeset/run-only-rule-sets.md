---
"a11y-hud": minor
"@a11y-hud/react": minor
"@a11y-hud/vue": minor
"@a11y-hud/angular": minor
"@a11y-hud/svelte": minor
"@a11y-hud/solid": minor
---

Add configurable axe rule sets via `runOnly` option. Pass `runOnly: ["wcag2a", "wcag2aa"]` (or any axe tag names) to `mount()` / the adapter hook to restrict which rules axe-core runs. A rule-set chip row is added to the panel filter section for interactive selection. All adapters expose `runOnly` as a prop and `setRunOnly()` in their hook/composable return.
