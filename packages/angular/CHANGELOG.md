# @a11y-hud/angular

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

## 0.1.2

### Patch Changes

- Updated dependencies [f1fa962]
  - a11y-hud@0.1.4

## 0.1.1

### Patch Changes

- Fix missing render-settled rescan on route changes.

  `ngAfterViewInit` fires once and `ngOnChanges` only fires when `@Input()` props change, so Angular Router navigations that leave inputs unchanged never triggered a rescan. Adding `afterEveryRender()` in the constructor mirrors React's `useEffect(fn)` (no deps) and ensures a rescan fires after every Angular render commit, including route changes.

## 0.1.0

### Minor Changes

- c87225d: Initial release of `@a11y-hud/angular`.

  - `<a11y-hud-angular>` standalone component: drop into any Angular root component to mount the HUD. Accepts `theme`, `scope`, `autoScan`, and `debounce` inputs.
  - `A11yHudService` injectable: imperative alternative for apps that need to call `runScan()` or `setTheme()` programmatically.
  - `scope` input accepts `ElementRef<Element>`, a raw `Element`, or `null` — compatible with both `@ViewChild` results and template reference variables.
  - Lifecycle integration: `ngAfterViewInit` for initial mount; `ngOnChanges` for prop-change sync. `runScan()` executes outside NgZone to avoid change-detection loops from axe-core's async resolution.
  - Peer dependencies: `@angular/core >= 20.0.0 < 23.0.0` (Angular 20 LTS + Angular 21 active).

### Patch Changes

- Updated dependencies
  - a11y-hud@0.1.3
