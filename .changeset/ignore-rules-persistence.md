---
"a11y-hud": minor
"@a11y-hud/react": minor
"@a11y-hud/vue": minor
"@a11y-hud/angular": minor
"@a11y-hud/svelte": minor
"@a11y-hud/solid": minor
---

Add ignore-rules persistence. Violations matching an ignored rule are silently dropped from every scan result. Ignores are stored in `localStorage` under `"a11y-hud:ignores"`. New panel UI: an "Ignore this rule" button inside each violation detail, and a collapsible "Ignored rules" section with per-entry remove buttons plus Export/Import/Clear-all actions. New `A11yHudInstance.ignores` sub-object exposes `add`, `remove`, `clear`, `list`, `exportJson`, and `importJson` programmatically; all adapters surface the same sub-object in their hook/composable returns. Standalone `addIgnore`, `removeIgnore`, `clearIgnores`, `listIgnores`, `exportIgnores`, and `importIgnores` functions are also exported from `a11y-hud` for headless use. New vendored Lucide icons: `trash-2`, `upload`.
