# @a11y-hud/solid

## 0.4.0

### Minor Changes

- b93668c: Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
- 4afefd4: Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.

### Patch Changes

- Updated dependencies [33644fc]
- Updated dependencies [b93668c]
- Updated dependencies [4afefd4]
- Updated dependencies [7de8c9d]
  - a11y-hud@0.4.0

## 0.3.0

### Minor Changes

- b93668c: Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
- 4afefd4: Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.

### Patch Changes

- Updated dependencies [33644fc]
- Updated dependencies [b93668c]
- Updated dependencies [4afefd4]
- Updated dependencies [7de8c9d]
  - a11y-hud@0.3.0

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

- f1fa962: Add `@a11y-hud/solid` adapter for Solid.

  Exports `createA11yHud(options)` primitive and `<A11yHud>` component. Uses `onMount`, `onCleanup`, and `createEffect` for reactive prop sync and render-settled rescans. Peer dep: `solid-js@>=1.8`.

### Patch Changes

- Updated dependencies [f1fa962]
  - a11y-hud@0.1.4

## 0.1.0

### Minor Changes

- Initial release of `@a11y-hud/solid` adapter.
