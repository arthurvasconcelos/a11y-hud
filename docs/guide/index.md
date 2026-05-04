# Getting Started

a11y-hud is a dev-only overlay that runs [axe-core](https://github.com/dequelabs/axe-core) accessibility audits inside your running web app. It renders a floating panel listing every detected violation — no browser extension, no build-time transformation, no framework lock-in.

![a11y-hud panel open showing violations, with filter chips expanded](/img/filter-ux.gif)

## Who it's for

- **App developers** doing local a11y work during development.
- **QA / a11y reviewers** poking at staging without installing axe DevTools.

## Installation

::: code-group

```bash [npm]
npm install --save-dev a11y-hud
```

```bash [pnpm]
pnpm add -D a11y-hud
```

```bash [yarn]
yarn add -D a11y-hud
```

:::

**CDN / script tag** — no install needed:

```html
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
```

## First mount

### Imperative (any framework)

```js
import { mount } from "a11y-hud";

// Gate behind DEV check so it never ships to production
if (import.meta.env.DEV) {
  mount({ theme: "auto" });
}
```

### Declarative (script-tag path)

```html
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
<a11y-hud theme="auto"></a11y-hud>
```

### Click to highlight

Clicking a node selector in the panel outlines the corresponding element on the page.

![Clicking a violation node highlights the element on the page with a purple outline](/img/click-to-highlight.gif)

### Headless (CI / programmatic)

```js
import { runScan } from "a11y-hud";

const results = await runScan(document.body);
if (results.violations.length > 0) {
  console.error("Accessibility violations found:", results.violations);
  process.exit(1);
}
```

## Framework adapters

If you're using a framework, pick the matching adapter for a tighter integration that rescans automatically when your component tree re-renders.

| Framework | Package |
|-----------|---------|
| React | [`@a11y-hud/react`](/guide/react) |
| Vue 3 | [`@a11y-hud/vue`](/guide/vue) |
| Angular | [`@a11y-hud/angular`](/guide/angular) |
| Svelte 5 | [`@a11y-hud/svelte`](/guide/svelte) |
| Solid | [`@a11y-hud/solid`](/guide/solid) |
| Astro | [Guide (no separate package)](/guide/astro) |
| Qwik | [Guide (no separate package)](/guide/qwik) |

## What not to use it for

- **Production sites** — mount only in development. The HUD adds axe-core (~300KB) to the page.
- **Storybook** — `@storybook/addon-a11y` is purpose-built for that workflow.
- **Server-side rendering** — axe-core requires a live DOM. Mount after hydration.
