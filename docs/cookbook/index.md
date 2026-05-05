# Cookbook

Practical recipes for common a11y-hud tasks.

## Recipes

### [Route-change rescans](/cookbook/route-change-rescans)

How to trigger a fresh axe scan after a client-side route change in React Router, Vue Router, Angular Router, SvelteKit, and Solid Router.

### [CI integration](/cookbook/ci-integration)

Use the headless `runScan()` API in Playwright tests or a Node script to fail CI when accessibility violations are detected.

### [Custom severity colors](/cookbook/custom-severity-colors)

Override severity and accent colors via CSS custom properties — including per-page overrides and dynamic theme switching.

### [CSP compatibility](/cookbook/csp-compatibility)

How a11y-hud interacts with Content Security Policy, and what directives you need for the CDN / bookmarklet paths.

### [Bookmarklet usage](/cookbook/bookmarklet)

The end-to-end workflow for QA reviewers on staging: generating, installing, and using the bookmarklet without touching the app's source.

### [Ignore-rules workflow](/cookbook/ignore-rules)

How to mute rules or specific nodes in the panel UI, export ignore lists as JSON, and share them across your team.

### [Keyboard mode](/cookbook/keyboard-mode)

Reading the tab-order overlay, understanding keyboard violations, and using the headless keyboard helpers in tests.

### [Security model](/cookbook/security-model)

The dev-only trust model, scope injection behavior, ignore-rules validation, violation HTML rendering context, and Shadow DOM isolation.
