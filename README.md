# a11y-hud

**Framework-agnostic dev overlay that runs axe-core accessibility audits in your running app — no DevTools required.**

[![npm version](https://img.shields.io/npm/v/a11y-hud.svg)](https://www.npmjs.com/package/a11y-hud) [![npm downloads](https://img.shields.io/npm/dm/a11y-hud.svg)](https://www.npmjs.com/package/a11y-hud)<br>
[![@a11y-hud/react](https://img.shields.io/npm/v/@a11y-hud/react.svg?label=%40a11y-hud%2Freact)](https://www.npmjs.com/package/@a11y-hud/react) [![react downloads](https://img.shields.io/npm/dm/@a11y-hud/react.svg?label=downloads)](https://www.npmjs.com/package/@a11y-hud/react)<br>
[![@a11y-hud/vue](https://img.shields.io/npm/v/@a11y-hud/vue.svg?label=%40a11y-hud%2Fvue)](https://www.npmjs.com/package/@a11y-hud/vue) [![vue downloads](https://img.shields.io/npm/dm/@a11y-hud/vue.svg?label=downloads)](https://www.npmjs.com/package/@a11y-hud/vue)<br>
[![@a11y-hud/angular](https://img.shields.io/npm/v/@a11y-hud/angular.svg?label=%40a11y-hud%2Fangular)](https://www.npmjs.com/package/@a11y-hud/angular) [![angular downloads](https://img.shields.io/npm/dm/@a11y-hud/angular.svg?label=downloads)](https://www.npmjs.com/package/@a11y-hud/angular)<br>
[![@a11y-hud/svelte](https://img.shields.io/npm/v/@a11y-hud/svelte.svg?label=%40a11y-hud%2Fsvelte)](https://www.npmjs.com/package/@a11y-hud/svelte) [![svelte downloads](https://img.shields.io/npm/dm/@a11y-hud/svelte.svg?label=downloads)](https://www.npmjs.com/package/@a11y-hud/svelte)<br>
[![@a11y-hud/solid](https://img.shields.io/npm/v/@a11y-hud/solid.svg?label=%40a11y-hud%2Fsolid)](https://www.npmjs.com/package/@a11y-hud/solid) [![solid downloads](https://img.shields.io/npm/dm/@a11y-hud/solid.svg?label=downloads)](https://www.npmjs.com/package/@a11y-hud/solid)<br>
[![CI](https://github.com/arthurvasconcelos/a11y-hud/actions/workflows/ci.yml/badge.svg)](https://github.com/arthurvasconcelos/a11y-hud/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/arthurvasconcelos/a11y-hud/graph/badge.svg)](https://codecov.io/gh/arthurvasconcelos/a11y-hud) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## Framework adapters

| Adapter | Package | Install |
|---------|---------|---------|
| React | [`@a11y-hud/react`](https://www.npmjs.com/package/@a11y-hud/react) | `npm i -D @a11y-hud/react` |
| Vue | [`@a11y-hud/vue`](https://www.npmjs.com/package/@a11y-hud/vue) | `npm i -D @a11y-hud/vue` |
| Angular | [`@a11y-hud/angular`](https://www.npmjs.com/package/@a11y-hud/angular) | `npm i -D @a11y-hud/angular` |
| Svelte | [`@a11y-hud/svelte`](https://www.npmjs.com/package/@a11y-hud/svelte) | `npm i -D @a11y-hud/svelte` |
| Solid | [`@a11y-hud/solid`](https://www.npmjs.com/package/@a11y-hud/solid) | `npm i -D @a11y-hud/solid` |

## Framework quick starts

**React**

```typescript
import { A11yHud } from "@a11y-hud/react";

// In your root component:
<A11yHud theme="auto" />
```

**Vue 3**

```vue
<!-- App.vue -->
<script setup>
import { A11yHud } from "@a11y-hud/vue";
</script>
<template>
  <A11yHud theme="auto" />
  <!-- rest of app -->
</template>
```

**Angular**

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { A11yHudComponent } from '@a11y-hud/angular';

@Component({
  standalone: true,
  imports: [A11yHudComponent],
  template: `<a11y-hud-angular [theme]="'auto'" />`,
})
export class AppComponent {}
```

**Svelte 5**

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { A11yHud } from "@a11y-hud/svelte";
</script>

<A11yHud theme="auto" />
<!-- rest of app -->
```

**Solid**

```tsx
// App.tsx
import { A11yHud } from "@a11y-hud/solid";

export default function App() {
  return (
    <>
      <A11yHud theme="auto" />
      {/* rest of app */}
    </>
  );
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE). Icons from [Lucide](https://lucide.dev/) — see [LICENSE-ICONS.md](LICENSE-ICONS.md).
