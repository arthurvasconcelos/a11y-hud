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
    theme: "dark",
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

<A11yHud scope={scopeSection} theme="dark" />

<div bind:this={scopeSection}>
  <!-- your app content -->
</div>
```

## API

### `useA11yHud(getOptions?: () => UseA11yHudOptions): UseA11yHudReturn`

| Option | Type | Description |
|---|---|---|
| `theme` | `Theme` | `"light"`, `"dark"`, or `"high-contrast"` |
| `scope` | `Element \| null` | Restrict scan to a subtree |
| `autoScan` | `boolean` | Enable/disable automatic scanning (default: `true`) |
| `debounce` | `number` | Debounce delay in milliseconds |

Returns `{ runScan(): Promise<AxeResults>, setTheme(theme: Theme): void }`.

### `<A11yHud>` component

Accepts the same options as `UseA11yHudOptions` as props. Renders nothing into the Svelte tree — the `<a11y-hud>` Custom Element is mounted directly on `document.body`.

## License

MIT
