# Vanilla / Script tag

The vanilla core (`a11y-hud`) is a complete product on its own — no framework required.

## Install

::: code-group

```bash [npm]
npm install --save-dev a11y-hud
```

```html [CDN]
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
```

:::

## Quick start

### With a bundler (ESM)

```js
import { mount } from "a11y-hud";

if (import.meta.env.DEV) {
  mount({ theme: "auto" });
}
```

### Script tag (declarative)

```html
<!doctype html>
<html lang="en">
  <head>
    <script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
  </head>
  <body>
    <a11y-hud theme="auto"></a11y-hud>
    <!-- your content -->
  </body>
</html>
```

### Script tag (imperative)

```html
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
<script>
  window.A11yHud.mount({ theme: "auto" });
</script>
```

## Minimize to FAB

Pressing **−** or **Escape** collapses the panel to a small pill. Clicking the pill reopens it.

![Minimizing the panel to a floating action button and reopening it](/img/minimize-fab.gif)

## Mount options

```js
const hud = mount({
  theme: "auto",           // visual theme (default: "auto")
  scope: "#main-content", // CSS selector or Element to restrict scans
  autoScan: true,          // re-scan on DOM mutations (default: true)
  debounce: 500,           // debounce delay in ms (default: 500)
  runOnly: ["wcag2a", "wcag2aa"], // restrict to specific axe rule tags
});
```

`mount()` returns an [`A11yHudInstance`](/reference/api#a11yhudinstance) for runtime control.

## Scoping scans

Pass any CSS selector or `Element` reference to restrict axe to a subtree:

```js
mount({ scope: "#app" });
// or
mount({ scope: document.getElementById("app") });
```

## Runtime control

```js
const hud = mount({ theme: "github-dark" });

// Switch themes
hud.setTheme("tokyo-night");

// Change which axe rule sets run
hud.setRunOnly(["wcag2a"]);

// Trigger a manual scan
const results = await hud.runScan();

// Export results as JSON string
const json = hud.exportResults();

// Remove the HUD from the page
hud.unmount();
```

## Ignore rules

The ignore list is stored in `localStorage` and survives page reloads.

```js
// Ignore all violations for a rule
hud.ignores.add("color-contrast");

// Ignore a specific node
hud.ignores.add("label", "#my-input");

// List active ignores
console.log(hud.ignores.list());

// Export / import as JSON (for sharing across team members)
const json = hud.ignores.exportJson();
hud.ignores.importJson(json);

// Clear all ignores
hud.ignores.clear();
```

## Headless scan (no UI)

```js
import { runScan } from "a11y-hud";

const results = await runScan(document.querySelector("#app"));
console.log(results.violations);
```

`runScan()` needs a real browser DOM — it is not supported under Node/jsdom. See the [CI integration cookbook](/cookbook/ci-integration) for running it in Playwright.

## Bundle formats and SSR

`a11y-hud` ships as ESM (`dist/index.js`) plus a UMD bundle (`dist/index.umd.js`, global `window.A11yHud`) for the script-tag and bookmarklet paths. There is no CommonJS build.

Importing the package is safe in non-browser environments: the Custom Element is only registered when `customElements` exists, so server-side code can import `a11y-hud` as long as `mount()` is only called in the browser.

## Bookmarklet

For QA reviewers on staging without build access, use the bookmarklet:

```js
import { generateBookmarklet } from "a11y-hud";

// Always latest CDN version
const url = generateBookmarklet();

// Pin to a specific version
const pinned = generateBookmarklet("1.0.0");
```

A pre-built drag-to-bookmark page is included in the npm package at `dist/bookmarklet.html`. See the [Bookmarklet cookbook](/cookbook/bookmarklet) for the full workflow.

## `<a11y-hud>` element attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme |
| `scope` | `string` | — | CSS selector for scan scope. Invalid selectors fall back to `document.body`; runtime changes re-target the observer |
| `auto-scan` | presence | enabled | Remove attribute to disable auto-scan |
| `debounce` | `number` | `500` | Auto-scan debounce delay in ms |
| `run-only` | JSON string | — | Array of axe rule tags, e.g. `'["wcag2a"]'` |
