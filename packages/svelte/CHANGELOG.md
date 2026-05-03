# @a11y-hud/svelte

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
