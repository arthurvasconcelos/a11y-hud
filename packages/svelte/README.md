# @a11y-hud/svelte

Svelte 5 adapter for [a11y-hud](https://github.com/arthurvasconcelos/a11y-hud) — run axe-core accessibility audits in your Svelte app with no DevTools required.

## Install

```sh
pnpm add @a11y-hud/svelte svelte
```

## Usage

### Hook (recommended)

Use `useA11yHud` inside any Svelte 5 component. Pass a getter function so that reactive state is read inside the `$effect` that tracks it:

```svelte
<script lang="ts">
  import { useA11yHud } from "@a11y-hud/svelte";

  let scopeSection = $state<HTMLDivElement | null>(null);

  useA11yHud(() => ({
    theme: "auto",
    scope: scopeSection,
    autoScan: true,
    debounce: 300,
  }));
</script>

<div bind:this={scopeSection}>
  <!-- your app content -->
</div>
```

The `scope` option accepts `Element | null` (from `bind:this`), consistent with the Vue adapter.

### Component

Use the `<A11yHud>` component when you prefer a declarative approach:

```svelte
<script lang="ts">
  import { A11yHud } from "@a11y-hud/svelte";

  let scopeSection = $state<HTMLDivElement | null>(null);
</script>

<A11yHud scope={scopeSection} theme="auto" />

<div bind:this={scopeSection}>
  <!-- your app content -->
</div>
```

## API

### `useA11yHud(getOptions?: () => UseA11yHudOptions): UseA11yHudReturn`

| Option | Type | Description |
|---|---|---|
| `theme` | `Theme` | `"auto"` (default), `"default"`, `"light"`, `"high-contrast"`, `"github-dark"`, `"github-light"`, `"tokyo-night"`, `"solarized-dark"` |
| `scope` | `Element \| null` | Restrict scan to a subtree |
| `autoScan` | `boolean` | Enable/disable automatic scanning (default: `true`) |
| `debounce` | `number` | Debounce delay in milliseconds |
| `runOnly` | `string[]` | Restrict axe to specific rule-set tags |

Returns `{ runScan, setTheme, setRunOnly, exportResults, ignores }`. `runScan()` resolves `Promise<AxeResults | null>` — `null` if called before the HUD has mounted.

### `<A11yHud>` component

Accepts the same options as `UseA11yHudOptions` as props (`theme`, `scope`, `autoScan`, `debounce`, `runOnly`). Renders nothing into the Svelte tree — the `<a11y-hud>` Custom Element is mounted directly on `document.body`.

### Server-side rendering

Importing `@a11y-hud/svelte` is safe on the server (SvelteKit); the HUD mounts in `onMount`, so nothing renders server-side.

## License

MIT
