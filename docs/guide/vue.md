# Vue 3

`@a11y-hud/vue` is a thin Vue 3 adapter that mounts the a11y-hud Custom Element and re-runs axe after every Vue render via `watchPostEffect`.

## Requirements

- Vue 3.4 or later
- `a11y-hud` (installed automatically as a dependency)

## Install

::: code-group

```bash [npm]
npm install --save-dev @a11y-hud/vue
```

```bash [pnpm]
pnpm add -D @a11y-hud/vue
```

```bash [yarn]
yarn add -D @a11y-hud/vue
```

:::

## Quick start — component

```vue
<!-- App.vue -->
<script setup lang="ts">
import { A11yHud } from "@a11y-hud/vue";
</script>

<template>
  <A11yHud v-if="isDev" theme="auto" />
  <!-- rest of app -->
</template>

<script lang="ts">
const isDev = import.meta.env.DEV;
</script>
```

Or with `<script setup>` only:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { A11yHud } from "@a11y-hud/vue";

const isDev = import.meta.env.DEV;
</script>

<template>
  <A11yHud v-if="isDev" theme="auto" />
  <!-- rest of app -->
</template>
```

## Quick start — composable

```ts
import { useA11yHud } from "@a11y-hud/vue";

const hud = useA11yHud({ theme: "auto" });
```

## Props / options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme |
| `scope` | `Element \| null` | — | Scan scope element. Pass a template ref directly (`:scope="myRef"`) — Vue templates auto-unwrap refs. |
| `autoScan` | `boolean` | `true` | Re-scan on DOM mutations |
| `debounce` | `number` | `500` | Auto-scan debounce in ms |
| `runOnly` | `string[]` | — | axe rule tags to run |

## Scoping to a subtree

Pass a Vue template ref as `scope`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { A11yHud } from "@a11y-hud/vue";

const appRoot = ref<HTMLDivElement | null>(null);
</script>

<template>
  <A11yHud theme="auto" :scope="appRoot" />
  <div ref="appRoot">
    <!-- only this subtree is scanned -->
  </div>
</template>
```

## Route-change rescans

`watchPostEffect` fires after every Vue DOM commit, covering Vue Router navigations automatically. For explicit control, see the [Route-change rescans cookbook](/cookbook/route-change-rescans).

## Instance API

```ts
const hud = useA11yHud({ theme: "auto" });

hud.runScan()
hud.setTheme("github-dark")
hud.setRunOnly(["wcag2a"])
hud.exportResults()
hud.ignores.add("color-contrast")
hud.ignores.list()
hud.ignores.exportJson()
hud.ignores.importJson(json)
hud.ignores.clear()
```

See [`UseA11yHudReturn`](/reference/api#useahudreturn) for full type details.
