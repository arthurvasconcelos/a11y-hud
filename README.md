# a11y-hud

**Framework-agnostic dev overlay that runs axe-core accessibility audits in your running app — no DevTools required.**

[![npm version](https://img.shields.io/npm/v/a11y-hud.svg)](https://www.npmjs.com/package/a11y-hud)
[![CI](https://github.com/arthurvasconcelos/a11y-hud/actions/workflows/ci.yml/badge.svg)](https://github.com/arthurvasconcelos/a11y-hud/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Drop an interactive accessibility HUD into any web app during development. No browser extension, no build-step magic, no framework lock-in — just a `<script>` tag or an `import`.

## Install

**npm / pnpm / yarn**

```bash
npm install --save-dev a11y-hud
```

**CDN (script tag)**

```html
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
```

## Quick start

**Imperative (any framework)**

```js
import { mount } from "a11y-hud";

if (import.meta.env.DEV) {
  mount({ theme: "auto" });
}
```

**Declarative (script-tag path)**

```html
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
<a11y-hud theme="auto"></a11y-hud>
```

**Headless (CI / programmatic use)**

```js
import { runScan } from "a11y-hud";

const results = await runScan(document.body);
console.log(results.violations);
```

## API

### `mount(options?): A11yHudInstance`

Mounts the HUD panel into the page.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'auto' \| 'default' \| 'light' \| 'high-contrast'` | `'auto'` | Visual theme. `auto` respects `prefers-color-scheme`. |
| `scope` | `string \| Element` | `document.body` | CSS selector or element to restrict scans to. |
| `autoScan` | `boolean` | `true` | Re-scan when the DOM changes. |
| `debounce` | `number` | `500` | Milliseconds to debounce auto-scan. |

### `runScan(target?: Element): Promise<AxeResults>`

Runs an axe-core scan without rendering any UI. Returns raw axe results.

### `<a11y-hud>` element

Attributes: `theme`, `scope`, `auto-scan`, `debounce`.

### Themes

Three built-in themes: `default` (dark), `light`, `high-contrast`. `auto` switches between `default` and `light` based on `prefers-color-scheme`. If `prefers-contrast: more` is set, any theme auto-promotes to `high-contrast`.

### CSS custom properties

Customize the HUD by overriding custom properties on the host element:

```css
a11y-hud {
  --a11y-hud-bg: #1e1e2e;
  --a11y-hud-text: #cdd6f4;
  --a11y-hud-critical: #f38ba8;
}
```

See the [full token reference](https://github.com/arthurvasconcelos/a11y-hud/blob/main/docs/theming.md) for the complete list.

## Framework guides

- [Vanilla JS / HTML](https://github.com/arthurvasconcelos/a11y-hud)
- React, Vue, Angular, Svelte, Solid — adapters coming in 0.2–0.5

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE). Icons from [Lucide](https://lucide.dev/) — see [LICENSE-ICONS.md](LICENSE-ICONS.md).
