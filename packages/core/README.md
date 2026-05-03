# a11y-hud

A framework-agnostic developer overlay that runs [axe-core](https://github.com/dequelabs/axe-core) accessibility audits inside your running web app — no browser extension required.

- **No DevTools required** — the HUD runs in the page itself, not as an extension.
- **Framework-agnostic** — works with any stack. Framework adapters available for React, Vue, Angular, Svelte, and Solid.
- **Interactive** — violation list with severity filters, click-to-highlight, keyboard navigation, and clipboard export.
- **Three built-in themes** — `default` (dark), `light`, `high-contrast`; `auto` respects `prefers-color-scheme`.

## Install

```sh
npm install a11y-hud
```

## Usage

### Imperative (any framework)

```ts
import { mount } from "a11y-hud";

const hud = mount({ theme: "auto" });

// later
hud.unmount();
```

### Declarative (HTML / script tag)

```html
<script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js"></script>
<a11y-hud theme="auto"></a11y-hud>
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `"auto" \| "default" \| "light" \| "high-contrast"` | `"auto"` | Panel theme |
| `scope` | `string \| Element` | `document.body` | Restrict scan to a subtree |
| `autoScan` | `boolean` | `true` | Auto-rescan on DOM mutations |
| `debounce` | `number` | `500` | Debounce delay in ms |

### Headless API

```ts
import { runScan } from "a11y-hud";

const results = await runScan(document.querySelector("#my-app"));
console.log(results.violations);
```

## Framework adapters

- React — [`@a11y-hud/react`](https://www.npmjs.com/package/@a11y-hud/react)
- Vue — `@a11y-hud/vue` _(coming soon)_
- Angular — `@a11y-hud/angular` _(coming soon)_
- Svelte — `@a11y-hud/svelte` _(coming soon)_
- Solid — `@a11y-hud/solid` _(coming soon)_

## License

MIT © Arthur Vasconcelos

Icon set: [Lucide](https://lucide.dev/) (MIT). See [LICENSE-ICONS.md](https://github.com/arthurvasconcelos/a11y-hud/blob/main/LICENSE-ICONS.md).
