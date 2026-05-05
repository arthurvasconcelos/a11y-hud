# @a11y-hud/react

## 1.0.0-rc.0

### Major Changes

- First stable release. Public API is now frozen under semver: mount options, Custom Element attributes, theme names, CSS custom properties, headless API, and UMD globals will not break in minor or patch releases. Includes framework adapters for React, Vue, Angular, Svelte, and Solid; bookmarklet generator; ignore-rules persistence; keyboard mode; JSON export; eight built-in themes; and a full VitePress documentation site.

### Patch Changes

- Updated dependencies
  - a11y-hud@1.0.0-rc.0

## 0.5.1

### Patch Changes

- Updated dependencies
  - a11y-hud@0.4.1

## 0.5.0

### Minor Changes

- b93668c: Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
- 4afefd4: Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.

### Patch Changes

- Updated dependencies [33644fc]
- Updated dependencies [b93668c]
- Updated dependencies [4afefd4]
- Updated dependencies [7de8c9d]
  - a11y-hud@0.4.0

## 0.4.0

### Minor Changes

- b93668c: Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
- 4afefd4: Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.

### Patch Changes

- Updated dependencies [33644fc]
- Updated dependencies [b93668c]
- Updated dependencies [4afefd4]
- Updated dependencies [7de8c9d]
  - a11y-hud@0.3.0

## 0.3.0

### Minor Changes

- cf2d1bd: Add configurable axe rule sets via `runOnly` option. Pass `runOnly: ["wcag2a", "wcag2aa"]` (or any axe tag names) to `mount()` / the adapter hook to restrict which rules axe-core runs. A rule-set chip row is added to the panel filter section for interactive selection. All adapters expose `runOnly` as a prop and `setRunOnly()` in their hook/composable return.

### Patch Changes

- Updated dependencies [1d36e1b]
- Updated dependencies [cf2d1bd]
- Updated dependencies [7b24f4a]
  - a11y-hud@0.2.0

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
