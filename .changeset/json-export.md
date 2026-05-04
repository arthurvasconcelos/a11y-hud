---
"a11y-hud": minor
"@a11y-hud/react": minor
"@a11y-hud/vue": minor
"@a11y-hud/angular": minor
"@a11y-hud/svelte": minor
"@a11y-hud/solid": minor
---

Add JSON export feature. A download button in the panel toolbar exports current scan results as a structured JSON file (`a11y-hud-results.json`). The exported format wraps `AxeResults` in an `A11yHudExport` envelope with `version`, `timestamp`, `url`, and `scope` fields. New `exportResults(): string | null` method on `A11yHudInstance` and all adapter hooks returns the same JSON string for programmatic use. New `A11yHudExport` type is exported from `a11y-hud`. Includes a new vendored Lucide `download` icon.
