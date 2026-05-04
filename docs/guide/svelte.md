# Svelte 5

`@a11y-hud/svelte` is a Svelte 5 adapter using runes that mounts the a11y-hud Custom Element and re-runs axe after DOM updates.

## Requirements

- Svelte 5 (runes required)
- `a11y-hud` (installed automatically as a dependency)

## Install

::: code-group

```bash [npm]
npm install --save-dev @a11y-hud/svelte
```

```bash [pnpm]
pnpm add -D @a11y-hud/svelte
```

```bash [yarn]
yarn add -D @a11y-hud/svelte
```

:::

## Quick start — component

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { A11yHud } from "@a11y-hud/svelte";

  const isDev = import.meta.env.DEV;
</script>

{#if isDev}
  <A11yHud theme="auto" />
{/if}
<!-- rest of app -->
```

## Quick start — hook

`useA11yHud` accepts a getter function (not a plain object) so Svelte's `$effect` can track reactive `$props()` values:

```svelte
<script lang="ts">
  import { useA11yHud } from "@a11y-hud/svelte";

  const hud = useA11yHud(() => ({ theme: "auto" }));
</script>
```

## Props / options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme |
| `scope` | `Element \| null` | — | Element for scan scope (use `bind:this`) |
| `autoScan` | `boolean` | `true` | Re-scan on DOM mutations |
| `debounce` | `number` | `500` | Auto-scan debounce in ms |
| `runOnly` | `string[]` | — | axe rule tags to run |

## Scoping to a subtree

Use `bind:this` to get an element reference:

```svelte
<script lang="ts">
  import { A11yHud } from "@a11y-hud/svelte";

  let appRoot: HTMLDivElement | null = null;
</script>

<A11yHud theme="auto" scope={appRoot} />
<div bind:this={appRoot}>
  <!-- only this subtree is scanned -->
</div>
```

## Why a getter function for `useA11yHud`

Svelte 5's `$effect` tracks reactive reads that happen during execution. If you spread `$props()` into a plain object before passing it, the effect cannot track the individual reactive property reads. Passing a getter closure preserves reactivity:

```ts
// ✅ reactive — $effect tracks reads through the closure
useA11yHud(() => ({ theme: props.theme }));

// ❌ not reactive — spread loses prop reactivity
const opts = { theme: props.theme };
useA11yHud(() => opts);
```

## Route-change rescans

`$effect` fires after Svelte DOM updates, covering router-driven re-renders automatically. For explicit control, see the [Route-change rescans cookbook](/cookbook/route-change-rescans).

## Instance API

```ts
const hud = useA11yHud(() => ({ theme: "auto" }));

hud.runScan()
hud.setTheme("solarized-dark")
hud.setRunOnly(["wcag2a"])
hud.exportResults()
hud.ignores.add("color-contrast")
hud.ignores.list()
```

See [`UseA11yHudReturn`](/reference/api#useahudreturn) for full type details.
