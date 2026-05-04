# a11y-hud

## 0.4.1

### Patch Changes

- Fix rescan button spin (animation now targets the icon SVG only), pin the Ignored rules section to the panel footer so it's always visible regardless of violation list length, and add an accessible label to violation help links announcing they open in a new tab.

## 0.4.0

### Minor Changes

- 33644fc: Add `generateBookmarklet(version?)` — returns a `javascript:` bookmarklet URL that loads the UMD bundle from jsDelivr and calls `window.A11yHud.mount()`. Defaults to `"latest"`; pass a version string to pin to a specific release. Build now generates `dist/bookmarklet.html`, a self-contained drag-to-bookmark page.
- b93668c: Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
- 4afefd4: Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.
- 7de8c9d: Add keyboard-only mode (tab-order visualization). A keyboard icon button in the panel toolbar activates the mode. When active, the panel body switches to a keyboard view listing all naturally-focusable elements in tab order with numbered badges overlaid on the live page. The view also surfaces keyboard violations: `no-focusable-elements`, `positive-tabindex`, and `interactive-excluded`. Deactivating the mode removes the overlay and restores the normal violation view. New exports from `a11y-hud`: `getFocusableElements`, `injectFocusOrderOverlay`, `detectKeyboardViolations`, and types `FocusableElementInfo`, `KeyboardViolation`. No adapter changes — keyboard mode is HUD-UI-only.

## 0.3.0

### Minor Changes

- 33644fc: Add `generateBookmarklet(version?)` — returns a `javascript:` bookmarklet URL that loads the UMD bundle from jsDelivr and calls `window.A11yHud.mount()`. Defaults to `"latest"`; pass a version string to pin to a specific release. Build now generates `dist/bookmarklet.html`, a self-contained drag-to-bookmark page.
- b93668c: Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
- 4afefd4: Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.
- 7de8c9d: Add keyboard-only mode (tab-order visualization). A keyboard icon button in the panel toolbar activates the mode. When active, the panel body switches to a keyboard view listing all naturally-focusable elements in tab order with numbered badges overlaid on the live page. The view also surfaces keyboard violations: `no-focusable-elements`, `positive-tabindex`, and `interactive-excluded`. Deactivating the mode removes the overlay and restores the normal violation view. New exports from `a11y-hud`: `getFocusableElements`, `injectFocusOrderOverlay`, `detectKeyboardViolations`, and types `FocusableElementInfo`, `KeyboardViolation`. No adapter changes — keyboard mode is HUD-UI-only.

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
