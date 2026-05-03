# @a11y-hud/angular

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
