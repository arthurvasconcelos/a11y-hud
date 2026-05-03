# @a11y-hud/vue

Vue 3 adapter for [a11y-hud](https://www.npmjs.com/package/a11y-hud) — run axe-core accessibility audits in your Vue app with no browser extension required.

## Install

```sh
npm install a11y-hud @a11y-hud/vue
```

Peer dependencies: `vue@>=3.4`.

## Usage

### Component

Drop `<A11yHud />` anywhere in your Vue tree. It renders nothing into the Vue DOM — the HUD panel is appended to `document.body` as a Custom Element.

```vue
<script setup>
import { A11yHud } from "@a11y-hud/vue";
</script>

<template>
  <A11yHud theme="auto" />
  <!-- rest of your app -->
</template>
```

### Composable

Use `useA11yHud` when you need programmatic access to `runScan` or `setTheme`.

```vue
<script setup>
import { useA11yHud } from "@a11y-hud/vue";

const { runScan, setTheme } = useA11yHud({ theme: "auto" });
</script>

<template>
  <button @click="runScan()">Scan now</button>
</template>
```

### Subtree scoping

Restrict the scan to a specific subtree by passing a template ref.

```vue
<script setup>
import { ref } from "vue";
import { A11yHud } from "@a11y-hud/vue";

const scopeRef = ref(null);
</script>

<template>
  <A11yHud :scope="scopeRef" />
  <div ref="scopeRef">
    <!-- only this subtree is scanned -->
  </div>
</template>
```

### Props / options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `"auto" \| "default" \| "light" \| "high-contrast"` | `"auto"` | Panel theme |
| `scope` | `Ref<Element \| null>` | — | Restrict scan to a subtree |
| `autoScan` | `boolean` | `true` | Auto-rescan on DOM mutations |
| `debounce` | `number` | `500` | Debounce delay in ms |

## License

MIT © Arthur Vasconcelos
