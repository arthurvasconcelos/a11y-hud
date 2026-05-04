# CI integration

Use the headless `runScan()` API to fail CI when accessibility violations are detected — no HUD UI, no browser extension required.

## Playwright (recommended)

Playwright controls a real browser, giving axe-core a full, live DOM to audit.

### Setup

Install the dependency alongside Playwright:

```bash
npm install --save-dev a11y-hud @playwright/test
```

### Basic test

```ts
// tests/a11y.spec.ts
import { test, expect } from "@playwright/test";
import { chromium } from "playwright";

test("homepage has no critical accessibility violations", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const violations = await page.evaluate(async () => {
    // a11y-hud is not pre-installed on CI — inject it
    await import("https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js");
    const results = await window.A11yHud.runScan(document.body);
    return results.violations;
  });

  const critical = violations.filter((v) => v.impact === "critical");
  expect(critical, `Critical violations: ${critical.map((v) => v.id).join(", ")}`).toHaveLength(0);
});
```

### Using the npm package in a test app

If a11y-hud is already installed as a dev dependency in your test target app, import it directly:

```ts
// tests/a11y.spec.ts
import { test, expect } from "@playwright/test";

test("no critical violations", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const violations = await page.evaluate(async () => {
    const { runScan } = await import("/node_modules/a11y-hud/dist/index.js");
    const results = await runScan(document.body);
    return results.violations;
  });

  expect(violations.filter((v) => v.impact === "critical")).toHaveLength(0);
});
```

### Full violation report on failure

```ts
test("no accessibility violations", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const violations = await page.evaluate(async () => {
    const { runScan } = await import("/node_modules/a11y-hud/dist/index.js");
    const { violations } = await runScan(document.body);
    return violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => n.target),
    }));
  });

  if (violations.length > 0) {
    console.table(violations);
  }
  expect(violations).toHaveLength(0);
});
```

## Node.js + jsdom (lightweight, no browser)

For environments where Playwright is unavailable:

```ts
import { JSDOM } from "jsdom";
import { runScan } from "a11y-hud";

const dom = new JSDOM(`
  <!doctype html>
  <html lang="en">
    <body>
      <img src="logo.png" />
      <button>Click me</button>
    </body>
  </html>
`, { url: "http://localhost" });

// axe-core needs window and document globals
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;

const results = await runScan(dom.window.document.body);
if (results.violations.length > 0) {
  console.error("Violations:", results.violations.map((v) => v.id));
  process.exit(1);
}
```

::: warning jsdom limitations
jsdom doesn't compute CSS styles, so color-contrast and focus-indicator rules won't fire. Use Playwright for a comprehensive audit.
:::

## GitHub Actions example

```yaml
# .github/workflows/a11y.yml
name: A11y

on:
  pull_request:

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
        with:
          version: 9
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      - name: Start dev server
        run: pnpm dev &
        env:
          CI: true
      - name: Wait for server
        run: npx wait-on http://localhost:5173
      - name: Run a11y tests
        run: pnpm exec playwright test tests/a11y.spec.ts
```

## Restricting to WCAG 2.1 AA only

```ts
import { runScan } from "a11y-hud";

const results = await runScan(document.body, ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
```

Common axe tag values:
- `wcag2a` / `wcag2aa` / `wcag2aaa` — WCAG 2.0
- `wcag21a` / `wcag21aa` — WCAG 2.1 additions
- `wcag22aa` — WCAG 2.2 additions
- `best-practice` — non-normative best practices

## Respecting the ignore list in CI

The ignore list lives in `localStorage`, which doesn't exist in Node or Playwright by default. If you maintain an ignore list in the HUD panel and want CI to respect it, export the list as JSON and load it before scanning:

```ts
// ignores.json — export from the HUD panel and commit to the repo
import ignoreList from "./ignores.json" assert { type: "json" };
import { importIgnores, runScan } from "a11y-hud";

importIgnores(JSON.stringify(ignoreList));
const results = await runScan(document.body);
```
