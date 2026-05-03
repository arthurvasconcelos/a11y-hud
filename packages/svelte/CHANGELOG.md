# @a11y-hud/svelte

## 0.2.0

### Minor Changes

- cf2d1bd: Add configurable axe rule sets via `runOnly` option. Pass `runOnly: ["wcag2a", "wcag2aa"]` (or any axe tag names) to `mount()` / the adapter hook to restrict which rules axe-core runs. A rule-set chip row is added to the panel filter section for interactive selection. All adapters expose `runOnly` as a prop and `setRunOnly()` in their hook/composable return.

### Patch Changes

- Updated dependencies [1d36e1b]
- Updated dependencies [cf2d1bd]
- Updated dependencies [7b24f4a]
  - a11y-hud@0.2.0

## 0.1.0

### Minor Changes

- f1fa962: Add `@a11y-hud/svelte` adapter for Svelte 5.

  Exports `useA11yHud(getOptions)` hook and `<A11yHud>` component. Uses Svelte 5 runes (`$state`, `$effect`, `onMount`, `onDestroy`) for reactive prop sync and render-settled rescans. Peer dep: `svelte@>=5`.

### Patch Changes

- Updated dependencies [f1fa962]
  - a11y-hud@0.1.4

## 0.1.0

### Minor Changes

- Initial release of `@a11y-hud/svelte` adapter.
