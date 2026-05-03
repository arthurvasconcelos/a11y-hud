# a11y-hud

## 0.2.0

### Minor Changes

- 1d36e1b: Rename `A11yHudElement.triggerScan()` to `runScan()` to match the `A11yHudInstance.runScan()` name on the object returned by `mount()`.
- cf2d1bd: Add configurable axe rule sets via `runOnly` option. Pass `runOnly: ["wcag2a", "wcag2aa"]` (or any axe tag names) to `mount()` / the adapter hook to restrict which rules axe-core runs. A rule-set chip row is added to the panel filter section for interactive selection. All adapters expose `runOnly` as a prop and `setRunOnly()` in their hook/composable return.
- 7b24f4a: Add four new built-in themes: `github-dark`, `github-light`, `tokyo-night`, and `solarized-dark`. All new themes maintain WCAG AA contrast ratios for text and interactive elements. The `ResolvedTheme` type is now derived as `Exclude<Theme, "auto">` and will automatically include any future theme additions.

## 0.1.4

### Patch Changes

- f1fa962: Update README to link `@a11y-hud/svelte` and `@a11y-hud/solid` now that both adapters are published.

## 0.1.3

### Patch Changes

- Update README to link `@a11y-hud/angular` now that the adapter is published.

## 0.1.2

### Patch Changes

- 2c0ffb7: Update README to link `@a11y-hud/vue` now that the adapter is published.

## 0.1.1

### Patch Changes

- 64cd443: Add README.md and LICENSE to both published packages. Both files were listed in each package's `files` array but were missing, resulting in blank npm pages.
