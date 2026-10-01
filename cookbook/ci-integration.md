---
url: /a11y-hud/cookbook/ci-integration.md
---
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

```ts [tests/a11y.spec.ts]
import { test, expect } from "@playwright/test";

test("homepage has no critical accessibility violations", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // a11y-hud is not pre-installed in the target app — inject the UMD bundle.
  // It is a classic script (not an ES module), so use addScriptTag, not import().
  await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js" });

  const violations = await page.evaluate(async () => {
    const results = await window.A11yHud.runScan(document.body);
    return results.violations;
  });

  const critical = violations.filter((v) => v.impact === "critical");
  expect(critical, `Critical violations: ${critical.map((v) => v.id).join(", ")}`).toHaveLength(0);
});
```

### Using the npm package in a test app

If a11y-hud is already installed as a dev dependency in your test target app, import it directly:

```ts [tests/a11y.spec.ts]
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

## Why not Node.js + jsdom?

Importing `a11y-hud` in Node is safe (nothing runs until `mount()` or `runScan()` is called), but **scanning under jsdom is not supported**. axe-core needs a real browser — layout, computed styles, `CSSStyleSheet`, and other APIs that jsdom does not implement — so results would be incomplete or the scan would throw. Always run `runScan()` inside a browser page, as in the Playwright recipes above.

## GitHub Actions example

```yaml [.github/workflows/a11y.yml]
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

Pass axe tags as the second argument (inside `page.evaluate()` in Playwright):

```ts
const { runScan } = await import("/node_modules/a11y-hud/dist/index.js");

const results = await runScan(document.body, ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
```

Common axe tag values:

* `wcag2a` / `wcag2aa` / `wcag2aaa` — WCAG 2.0
* `wcag21a` / `wcag21aa` — WCAG 2.1 additions
* `wcag22aa` — WCAG 2.2 additions
* `best-practice` — non-normative best practices

## Respecting the ignore list in CI

The ignore list lives in the browser's `localStorage`, which starts empty in a fresh Playwright context. If you maintain an ignore list in the HUD panel and want CI to respect it, export the list from the HUD panel as `ignores.json`, commit that file to your repo, then load it in the page before scanning:

```ts [tests/a11y.spec.ts]
import ignoreList from "./ignores.json" with { type: "json" };
import { test, expect } from "@playwright/test";

test("no violations outside the shared ignore list", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const violations = await page.evaluate(async (ignoresJson) => {
    const { importIgnores, runScan } = await import("/node_modules/a11y-hud/dist/index.js");
    importIgnores(ignoresJson);
    const results = await runScan(document.body);
    return results.violations;
  }, JSON.stringify(ignoreList));

  expect(violations).toHaveLength(0);
});
```

`runScan()` filters ignored violations before returning, so the results already reflect the list.
